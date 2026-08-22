package com.librespaceboston

import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
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
            application { module(fixtureSpots) }
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
