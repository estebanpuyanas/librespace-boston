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

            val body = json.decodeFromString<QueryResponse>(response.bodyAsText())
            assertNull(body.answer)
            assertNull(body.detected_language)
            assertNull(body.translated_query)
            assertTrue(body.disclaimers.isEmpty())
            assertTrue(body.spots.isNotEmpty(), "expected real seeded spots near Boston Common")
            assertTrue(body.spots.all { it.distance_meters <= 1500 })
            assertTrue(body.spots.zipWithNext().all { (a, b) -> a.distance_meters <= b.distance_meters })
            assertTrue(body.spots.any { it.name.contains("Boston Common", ignoreCase = true) })
        }

    @Test
    fun queryWithFreeTextDoesNotAttemptSynthesis() =
        testApplication {
            application { module(fixtureSpots, mockChromaClient(), mockEmbeddingClient()) }
            val response =
                client.post("/api/query") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        """{"query": "somewhere quiet with wifi", "location": {"lat": 42.3551, "lon": -71.0657}}""",
                    )
                }
            assertEquals(HttpStatusCode.OK, response.status)

            val body = json.decodeFromString<QueryResponse>(response.bodyAsText())
            assertNull(body.answer)
            assertNull(body.detected_language)
            assertNull(body.translated_query)
            assertTrue(body.disclaimers.isNotEmpty())
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

            application { module(fixtureSpots, mockChromaClient(matchIds = listOf(semanticWinner)), mockEmbeddingClient()) }
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
