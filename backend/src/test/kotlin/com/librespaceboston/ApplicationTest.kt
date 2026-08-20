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
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ApplicationTest {
    private val json = Json { ignoreUnknownKeys = true }

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

    // Boston Common's real coordinates — verifies the structured (no `query`) path
    // returns actual spots joined by data-service/etl.py from output/spots.json,
    // not stubbed/empty data.
    @Test
    fun queryWithLocationOnlyReturnsNearbySeededSpots() =
        testApplication {
            application { module() }
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
            application { module() }
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
}
