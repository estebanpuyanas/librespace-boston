package com.librespaceboston

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.content.OutgoingContent
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

// Hermetic: hand-written fake Chroma v2 responses via MockEngine, no live container required
// (CI does not run podman/Chroma - see AGENTS.md). A one-time manual run against the real
// Chroma instance (577 real "spots" items) is documented in the PR description instead.
class ChromaClientTest {
    private val collectionId = "e14ba1c0-66fb-472e-9dc0-cc9d45842f9c"

    private fun clientWith(mockEngine: MockEngine): ChromaClient =
        ChromaClient(
            config = ChromaConfig(baseUrl = "http://localhost:8000"),
            httpClient =
                HttpClient(mockEngine) {
                    install(ContentNegotiation) {
                        json(Json { ignoreUnknownKeys = true })
                    }
                },
        )

    @Test
    fun findCollectionByNameResolvesIdFromListResponse() =
        runTest {
            val mockEngine =
                MockEngine { request ->
                    assertEquals(
                        "http://localhost:8000/api/v2/tenants/default_tenant/databases/default_database/collections",
                        request.url.toString(),
                    )
                    respond(
                        content = """[{"id":"$collectionId","name":"spots"}]""",
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val collection = clientWith(mockEngine).findCollectionByName("spots")
            assertEquals(collectionId, collection?.id)
            assertEquals("spots", collection?.name)
        }

    @Test
    fun findCollectionByNameReturnsNullWhenAbsent() =
        runTest {
            val mockEngine =
                MockEngine {
                    respond(
                        content = """[{"id":"other-id","name":"not-spots"}]""",
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            assertNull(clientWith(mockEngine).findCollectionByName("spots"))
        }

    @Test
    fun countReportsCollectionSize() =
        runTest {
            val mockEngine =
                MockEngine { request ->
                    assertTrue(request.url.toString().endsWith("/collections/$collectionId/count"))
                    respond(
                        content = "577",
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            assertEquals(577L, clientWith(mockEngine).count(collectionId))
        }

    @Test
    fun getByIdParsesDocumentsAndFlattenedMetadataIntoChromaSpot() =
        runTest {
            val fakeMetadata =
                """
                {
                  "spot_id": "os-3000",
                  "name": "Reilly Playground",
                  "lat": 42.33684500104154,
                  "lon": -71.15295819412574,
                  "has_wifi": false,
                  "is_park": true,
                  "features": "[]",
                  "accessible": "{\"value\": false, \"notes\": null}",
                  "tree_density_nearby": 24,
                  "source_dataset": "{\"name\": \"Open Space\"}"
                }
                """.trimIndent()
            val mockEngine =
                MockEngine { request ->
                    assertTrue(request.url.toString().endsWith("/collections/$collectionId/get"))
                    respond(
                        content =
                            """
                            {
                              "ids": ["os-3000"],
                              "documents": ["Reilly Playground. is a park / open space. 24 trees nearby"],
                              "metadatas": [$fakeMetadata]
                            }
                            """.trimIndent(),
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val response = clientWith(mockEngine).get(collectionId, ids = listOf("os-3000"))
            val spots = ChromaSpot.fromGetResponse(response)

            assertEquals(1, spots.size)
            val spot = spots.single()
            assertEquals("os-3000", spot.spotId)
            assertEquals("Reilly Playground", spot.name)
            assertEquals(false, spot.hasWifi)
            assertEquals(true, spot.isPark)
            assertTrue(spot.features.isEmpty())
            assertEquals(false, spot.accessible.value)
            assertEquals(24, spot.treeDensityNearby)
            assertEquals("Open Space", spot.sourceDataset["name"])
            assertTrue(spot.document?.contains("Reilly Playground") == true)
        }

    @Test
    fun getByMetadataFilterSendsWhereClauseInRequestBody() =
        runTest {
            var capturedBody: String? = null
            val mockEngine =
                MockEngine { request ->
                    capturedBody = String((request.body as OutgoingContent.ByteArrayContent).bytes())
                    respond(
                        content = """{"ids": [], "documents": [], "metadatas": []}""",
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val where = buildJsonObject { put("has_wifi", true) }
            clientWith(mockEngine).get(collectionId, where = where, limit = 2)

            assertTrue(capturedBody!!.contains(""""has_wifi":true"""))
            assertTrue(capturedBody!!.contains(""""limit":2"""))
        }
}
