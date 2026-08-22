package com.librespaceboston

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.testing.testApplication
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ApplicationTest {
    private val json = Json { ignoreUnknownKeys = true }

    // A small checked-in fixture (backend/src/test/resources/fixtures/spots.json) with a
    // handful of real spots.json records from a past ETL run (Boston Common et al.), so
    // /api/query tests are hermetic and don't depend on data-service's ETL having been run.
    private val fixtureSpots = SpotsRepository.loadFromResource("fixtures/spots.json")
    private val collectionId = "e14ba1c0-66fb-472e-9dc0-cc9d45842f9c"

    // Hermetic stand-ins for the live ramalama-embeddings/Chroma containers (same MockEngine
    // precedent as ChromaClientTest.kt) - CI has neither, so the `query` present path must not
    // depend on real network calls. `matchIds`, in relevance order, is what Chroma "returns".
    private fun mockChromaClient(matchIds: List<String> = emptyList()): ChromaClient =
        ChromaClient(
            config = ChromaConfig(baseUrl = "http://localhost:8000"),
            httpClient =
                HttpClient(
                    MockEngine { request ->
                        if (request.url.encodedPath.endsWith("/collections")) {
                            respond(
                                content = """[{"id":"$collectionId","name":"spots"}]""",
                                status = HttpStatusCode.OK,
                                headers = headersOf(HttpHeaders.ContentType, "application/json"),
                            )
                        } else {
                            val idsJson = matchIds.joinToString(",") { "\"$it\"" }
                            respond(
                                content = """{"ids": [[$idsJson]]}""",
                                status = HttpStatusCode.OK,
                                headers = headersOf(HttpHeaders.ContentType, "application/json"),
                            )
                        }
                    },
                ) {
                    install(ContentNegotiation) {
                        json(Json { ignoreUnknownKeys = true })
                    }
                },
        )

    // Simulates the real Chroma/embeddings containers being unreachable or misbehaving: the
    // /collections lookup returns a body that fails to parse, so findCollectionByName throws.
    private fun brokenChromaClient(): ChromaClient =
        ChromaClient(
            config = ChromaConfig(baseUrl = "http://localhost:8000"),
            httpClient =
                HttpClient(
                    MockEngine {
                        respond(
                            content = "not valid json",
                            status = HttpStatusCode.InternalServerError,
                            headers = headersOf(HttpHeaders.ContentType, "application/json"),
                        )
                    },
                ) {
                    install(ContentNegotiation) {
                        json(Json { ignoreUnknownKeys = true })
                    }
                },
        )

    private fun mockEmbeddingClient(): EmbeddingClient =
        EmbeddingClient(
            config = EmbeddingConfig(baseUrl = "http://localhost:8180", model = "all-minilm"),
            httpClient =
                HttpClient(
                    MockEngine {
                        respond(
                            content = """{"data": [{"embedding": [0.1, 0.2, 0.3]}]}""",
                            status = HttpStatusCode.OK,
                            headers = headersOf(HttpHeaders.ContentType, "application/json"),
                        )
                    },
                ) {
                    install(ContentNegotiation) {
                        json(Json { ignoreUnknownKeys = true })
                    }
                },
        )

    // Hermetic stand-in for the real ramalama chat container (qwen2.5:7b) - CI has no live
    // RamaLama, so both LLM calls buildQueryResponse makes (detect+translate, then grounded
    // synthesis) must be servable from a MockEngine. `responses` are returned in call order, one
    // per /v1/chat/completions request; the last one repeats if more calls happen than responses given.
    private fun sequencedLlmClient(vararg responses: String): LlmClient {
        var callIndex = 0
        return LlmClient(
            config = LlmConfig(anthropicApiKey = null, ramalamaUrl = "http://localhost:8080", ramalamaModel = "qwen2.5:7b"),
            httpClient =
                HttpClient(
                    MockEngine {
                        val content = responses.getOrElse(callIndex) { responses.last() }
                        callIndex++
                        respond(
                            content =
                                Json.encodeToString(
                                    ChatCompletionResponse(
                                        choices = listOf(ChatCompletionChoice(ChatMessage(role = "assistant", content = content))),
                                    ),
                                ),
                            status = HttpStatusCode.OK,
                            headers = headersOf(HttpHeaders.ContentType, "application/json"),
                        )
                    },
                ) {
                    install(ContentNegotiation) {
                        json(Json { ignoreUnknownKeys = true })
                    }
                },
        )
    }

    // A well-behaved LLM stand-in for tests that exercise something other than LLM behavior
    // (semantic ranking, structural filtering) - detects English, no-ops on synthesis.
    private fun noOpLlmClient(): LlmClient =
        sequencedLlmClient(
            """{"detected_language": "en", "translated_query": null}""",
            """{"answer": "", "unsupported_attributes": []}""",
        )

    // Simulates the real ramalama container being unreachable or misbehaving.
    private fun brokenLlmClient(): LlmClient =
        LlmClient(
            config = LlmConfig(anthropicApiKey = null, ramalamaUrl = "http://localhost:8080", ramalamaModel = "qwen2.5:7b"),
            httpClient =
                HttpClient(
                    MockEngine {
                        respond(
                            content = "not valid json",
                            status = HttpStatusCode.InternalServerError,
                            headers = headersOf(HttpHeaders.ContentType, "application/json"),
                        )
                    },
                ) {
                    install(ContentNegotiation) {
                        json(Json { ignoreUnknownKeys = true })
                    }
                },
        )

    @Test
    fun healthCheckReturnsOk() =
        testApplication {
            application { module() }
            val response = client.get("/health")
            assertEquals(HttpStatusCode.OK, response.status)
            assertEquals("""{"status":"ok"}""", response.bodyAsText())
        }

    @Test
    fun pingReturnsHelloWorld() =
        testApplication {
            application { module() }
            val response = client.get("/api/ping")
            assertEquals(HttpStatusCode.OK, response.status)
            assertEquals("""{"message":"Hello, world!"}""", response.bodyAsText())
        }

    @Test
    fun weatherEndpointReturnsProviderConditions() =
        testApplication {
            application {
                module(
                    weatherResolver =
                        object : WeatherResolver {
                            override suspend fun current(
                                lat: Double,
                                lon: Double,
                            ): WeatherConditions = WeatherConditions(temperature_fahrenheit = 72, weather_code = 1)
                        },
                )
            }
            val response = client.get("/api/weather?lat=42.3554&lon=-71.0657")

            assertEquals(HttpStatusCode.OK, response.status)
            val body = json.decodeFromString<WeatherConditions>(response.bodyAsText())
            assertEquals(72, body.temperature_fahrenheit)
            assertEquals(1, body.weather_code)
        }

    // Boston Common's real coordinates, this verifies the structured (no `query`) path
    // returns real spots (from the fixture, itself real data-service/etl.py output),
    // not stubbed/empty data.
    @Test
    fun queryWithLocationOnlyReturnsNearbySeededSpots() =
        testApplication {
            application { module(fixtureSpots) }
            val response =
                client.post("/api/query") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        """{"location": {"lat": 42.3551, "lon": -71.0657}, "radius_meters": 1500}""",
                    )
                }
            assertEquals(HttpStatusCode.OK, response.status)

            val rawBody = response.bodyAsText()
            // Regression: disclaimers = emptyList() is QueryResponse's default value, and
            // kotlinx.serialization silently drops fields left at their default unless
            // encodeDefaults is on - which would omit "disclaimers" here even though the OpenAPI
            // schema marks it required. Assert the key survives serialization, not just that the
            // client-side decoder (which tolerates a missing key via the same default) fills it in.
            assertTrue(rawBody.contains("\"disclaimers\""), "expected \"disclaimers\" key in response JSON: $rawBody")

            val body = json.decodeFromString<QueryResponse>(rawBody)
            assertNull(body.answer)
            assertNull(body.detected_language)
            assertNull(body.translated_query)
            assertTrue(body.disclaimers.isEmpty())
            assertTrue(body.spots.isNotEmpty(), "expected real seeded spots near Boston Common")
            assertTrue(body.spots.all { it.distance_meters <= 1500 })
            assertTrue(body.spots.zipWithNext().all { (a, b) -> a.distance_meters <= b.distance_meters })
            assertTrue(body.spots.any { it.name.contains("Boston Common", ignoreCase = true) })
        }

    // Happy path for the full natural-language pipeline: language detection (English here),
    // semantic re-ranking, and a grounded answer that cites real retrieved spot data plus a
    // disclaimer for the one requested attribute ("quiet") with no supporting dataset field.
    @Test
    fun queryWithFreeTextProducesGroundedAnswerAndFlagsUnsupportedAttribute() =
        testApplication {
            val languageResponse = """{"detected_language": "en", "translated_query": null}"""
            val synthesisResponse =
                """{"answer": "Boston Common has Wi-Fi (Wicked Free Wi-Fi Locations).", "unsupported_attributes": ["quiet"]}"""
            application {
                module(
                    spotsRepository = fixtureSpots,
                    chromaClient = mockChromaClient(matchIds = listOf("os-27")),
                    embeddingClient = mockEmbeddingClient(),
                    llmClient = sequencedLlmClient(languageResponse, synthesisResponse),
                )
            }
            val response =
                client.post("/api/query") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        """{"query": "somewhere quiet with wifi", "location": {"lat": 42.3551, "lon": -71.0657}}""",
                    )
                }
            assertEquals(HttpStatusCode.OK, response.status)

            val body = json.decodeFromString<QueryResponse>(response.bodyAsText())
            assertEquals("en", body.detected_language)
            assertNull(body.translated_query)
            assertTrue(body.answer!!.contains("Boston Common"))
            assertTrue(body.answer!!.contains("Wicked Free Wi-Fi Locations"))
            assertTrue(body.disclaimers.any { it.contains("quiet") })
        }

    // spec.md section 9: English + Spanish are fully validated; every other language (Vietnamese
    // here, per spec.md's own example) is best-effort machine translation and must say so.
    @Test
    fun queryInVietnameseIsTranslatedAndFlaggedAsBestEffort() =
        testApplication {
            val languageResponse = """{"detected_language": "vi", "translated_query": "somewhere quiet with wifi"}"""
            val synthesisResponse =
                """{"answer": "Boston Common có Wi-Fi (Wicked Free Wi-Fi Locations).", "unsupported_attributes": ["quiet"]}"""
            application {
                module(
                    spotsRepository = fixtureSpots,
                    chromaClient = mockChromaClient(matchIds = listOf("os-27")),
                    embeddingClient = mockEmbeddingClient(),
                    llmClient = sequencedLlmClient(languageResponse, synthesisResponse),
                )
            }
            val response =
                client.post("/api/query") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        """{"query": "noi yen tinh co wifi", "location": {"lat": 42.3551, "lon": -71.0657}}""",
                    )
                }
            assertEquals(HttpStatusCode.OK, response.status)

            val body = json.decodeFromString<QueryResponse>(response.bodyAsText())
            assertEquals("vi", body.detected_language)
            assertEquals("somewhere quiet with wifi", body.translated_query)
            assertTrue(body.answer!!.contains("Wi-Fi"))
            assertTrue(body.disclaimers.any { it.contains("machine-translated", ignoreCase = true) })
            assertTrue(body.disclaimers.any { it.contains("quiet") })
        }

    // If the ramalama container is unreachable or misbehaving, /api/query must still succeed with
    // the structurally/semantically ranked spots, no detected_language/translated_query/answer,
    // and disclaimers explaining synthesis wasn't available - never a 500.
    @Test
    fun queryFallsBackGracefullyWhenLlmIsUnreachable() =
        testApplication {
            application {
                module(
                    spotsRepository = fixtureSpots,
                    chromaClient = mockChromaClient(),
                    embeddingClient = mockEmbeddingClient(),
                    llmClient = brokenLlmClient(),
                )
            }
            val response =
                client.post("/api/query") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        """{"query": "somewhere quiet with wifi", "location": {"lat": 42.3551, "lon": -71.0657}}""",
                    )
                }
            assertEquals(HttpStatusCode.OK, response.status)

            val body = json.decodeFromString<QueryResponse>(response.bodyAsText())
            assertNull(body.detected_language)
            assertNull(body.translated_query)
            assertNull(body.answer)
            assertTrue(body.spots.isNotEmpty())
            assertTrue(body.disclaimers.isNotEmpty())
        }

    // Regression for the review fix in this change: when no spots match the structural filter,
    // buildQueryResponse must return early with the "no nearby spots" disclaimer and skip both
    // LLM calls entirely, rather than translating/synthesizing against an empty spot list. Wiring
    // a brokenLlmClient() here proves it: if either LLM call were attempted, the broken client's
    // failure would surface as the "unavailable" disclaimers instead of the expected one.
    @Test
    fun queryWithFreeTextAndNoMatchingSpotsSkipsLlmCallsEntirely() =
        testApplication {
            application {
                module(
                    spotsRepository = fixtureSpots,
                    chromaClient = mockChromaClient(),
                    embeddingClient = mockEmbeddingClient(),
                    llmClient = brokenLlmClient(),
                )
            }
            val response =
                client.post("/api/query") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        """{"query": "somewhere quiet with wifi", "location": {"lat": 0.0, "lon": 0.0}, "radius_meters": 100}""",
                    )
                }
            assertEquals(HttpStatusCode.OK, response.status)

            val body = json.decodeFromString<QueryResponse>(response.bodyAsText())
            assertNull(body.detected_language)
            assertNull(body.translated_query)
            assertNull(body.answer)
            assertTrue(body.spots.isEmpty())
            assertEquals(listOf("No nearby spots matched your search, try a larger radius or fewer filters."), body.disclaimers)
        }

    // Real semantic-retrieval path: a free-text query ("quiet place to sit") that wouldn't match
    // any structured amenity filter re-ranks the structurally-filtered spots by the relevance
    // order a (mocked) Chroma similarity query returns, instead of pure distance.
    @Test
    fun queryWithFreeTextRanksSpotsBySemanticRelevance() =
        testApplication {
            // Fixture spots nearest-to-farthest from this location; assert the response
            // reorders them to put the semantically "closer" match first even though it's
            // farther away in plain distance.
            val nearestFirst = fixtureSpots.nearby(42.3551, -71.0657, 5000.0, emptyList())
            assertTrue(nearestFirst.size >= 2, "fixture needs at least 2 spots within range for this test")
            val semanticWinner = nearestFirst.last().spot_id

            application {
                module(
                    spotsRepository = fixtureSpots,
                    chromaClient = mockChromaClient(matchIds = listOf(semanticWinner)),
                    embeddingClient = mockEmbeddingClient(),
                    llmClient = noOpLlmClient(),
                )
            }
            val response =
                client.post("/api/query") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        """{"query": "quiet place to sit", "location": {"lat": 42.3551, "lon": -71.0657}, "radius_meters": 5000}""",
                    )
                }
            assertEquals(HttpStatusCode.OK, response.status)

            val body = json.decodeFromString<QueryResponse>(response.bodyAsText())
            assertTrue(body.spots.isNotEmpty())
            assertEquals(semanticWinner, body.spots.first().spot_id)
        }

    // Regression coverage for the review fix that wraps semantic ranking in a try/catch: if
    // Chroma/embeddings are unreachable or return something unparseable, /api/query must still
    // succeed with the structurally-filtered, distance-sorted spots rather than erroring out.
    @Test
    fun queryFallsBackToStructuralOrderWhenSemanticRankingFails() =
        testApplication {
            application {
                module(
                    spotsRepository = fixtureSpots,
                    chromaClient = brokenChromaClient(),
                    embeddingClient = mockEmbeddingClient(),
                    llmClient = noOpLlmClient(),
                )
            }
            val response =
                client.post("/api/query") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        """{"query": "quiet place to sit", "location": {"lat": 42.3551, "lon": -71.0657}, "radius_meters": 5000}""",
                    )
                }
            assertEquals(HttpStatusCode.OK, response.status)

            val expectedOrder = fixtureSpots.nearby(42.3551, -71.0657, 5000.0, emptyList()).map { it.spot_id }
            val body = json.decodeFromString<QueryResponse>(response.bodyAsText())
            assertEquals(expectedOrder, body.spots.map { it.spot_id })
        }

    @Test
    fun queryWithoutDeviceCoordinatesUsesTheCoarseLocationResolver() =
        testApplication {
            val coarseLocation =
                ResolvedLocation(
                    lat = 42.3551,
                    lon = -71.0657,
                    source = "ip",
                    label = "Near Boston (approximate)",
                    approximate = true,
                )
            application {
                module(
                    spotsRepository = fixtureSpots,
                    locationResolver =
                        object : LocationResolver {
                            override suspend fun resolve(clientIp: String?): ResolvedLocation? = coarseLocation
                        },
                )
            }
            val response =
                client.post("/api/query") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"radius_meters": 1500}""")
                }

            assertEquals(HttpStatusCode.OK, response.status)
            val body = json.decodeFromString<QueryResponse>(response.bodyAsText())
            assertEquals("ip", body.resolved_location?.source)
            assertTrue(body.resolved_location?.approximate == true)
            assertTrue(body.disclaimers.any { it.contains("approximate area") })
        }

    @Test
    fun queryWithoutAnyLocationReturnsAnActionableError() =
        testApplication {
            application {
                module(
                    spotsRepository = fixtureSpots,
                    locationResolver =
                        object : LocationResolver {
                            override suspend fun resolve(clientIp: String?): ResolvedLocation? = null
                        },
                )
            }
            val response =
                client.post("/api/query") {
                    contentType(ContentType.Application.Json)
                    setBody("{}")
                }

            assertEquals(HttpStatusCode.UnprocessableEntity, response.status)
            val body = json.decodeFromString<LocationRequiredError>(response.bodyAsText())
            assertEquals("location_required", body.code)
        }

    @Test
    fun resolvePortAcceptsAValidConfiguredPort() {
        assertEquals(8081, resolvePort("8081"))
    }

    @Test
    fun resolvePortRefusesToFallBackToTheRamalamaPortWhenUnset() {
        assertFailsWith<IllegalStateException> { resolvePort(null) }
    }

    @Test
    fun resolvePortRefusesToFallBackToTheRamalamaPortWhenUnparseable() {
        assertFailsWith<IllegalStateException> { resolvePort("not-a-port") }
    }
}
