package com.librespaceboston

import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import kotlinx.serialization.json.Json
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals

private const val DEVICE_HEADER = "X-Device-Id"

class FavoritesTest {
    private val json = Json { ignoreUnknownKeys = true }

    private fun runFavoritesTest(
        favoritesRepository: FavoritesRepository = InMemoryFavoritesRepository(),
        block: suspend ApplicationTestBuilder.() -> Unit,
    ) = testApplication {
        application {
            module(
                spotsRepository = SpotsRepository.loadFromResource("fixtures/spots.json"),
                favoritesRepository = lazyOf(favoritesRepository),
            )
        }
        block()
    }

    @Test
    fun listFavoritesReturnsEmptyForANewDevice() =
        runFavoritesTest {
            val response =
                client.get("/api/favorites") {
                    header(DEVICE_HEADER, UUID.randomUUID().toString())
                }
            assertEquals(HttpStatusCode.OK, response.status)
            val body = json.decodeFromString<FavoritesResponse>(response.bodyAsText())
            assertEquals(emptyList(), body.spot_ids)
        }

    @Test
    fun addingAFavoriteMakesItShowUpInListFavorites() =
        runFavoritesTest {
            val deviceId = UUID.randomUUID().toString()

            val addResponse =
                client.post("/api/favorites") {
                    header(DEVICE_HEADER, deviceId)
                    contentType(ContentType.Application.Json)
                    setBody("""{"spot_id": "boston-common-1"}""")
                }
            assertEquals(HttpStatusCode.NoContent, addResponse.status)

            val listResponse =
                client.get("/api/favorites") {
                    header(DEVICE_HEADER, deviceId)
                }
            val body = json.decodeFromString<FavoritesResponse>(listResponse.bodyAsText())
            assertEquals(listOf("boston-common-1"), body.spot_ids)
        }

    @Test
    fun addingTheSameFavoriteTwiceIsIdempotent() =
        runFavoritesTest {
            val deviceId = UUID.randomUUID().toString()

            repeat(2) {
                val response =
                    client.post("/api/favorites") {
                        header(DEVICE_HEADER, deviceId)
                        contentType(ContentType.Application.Json)
                        setBody("""{"spot_id": "boston-common-1"}""")
                    }
                assertEquals(HttpStatusCode.NoContent, response.status)
            }

            val listResponse =
                client.get("/api/favorites") {
                    header(DEVICE_HEADER, deviceId)
                }
            val body = json.decodeFromString<FavoritesResponse>(listResponse.bodyAsText())
            assertEquals(listOf("boston-common-1"), body.spot_ids)
        }

    @Test
    fun removingAFavoriteTakesItOutOfListFavorites() =
        runFavoritesTest {
            val deviceId = UUID.randomUUID().toString()
            client.post("/api/favorites") {
                header(DEVICE_HEADER, deviceId)
                contentType(ContentType.Application.Json)
                setBody("""{"spot_id": "boston-common-1"}""")
            }

            val deleteResponse =
                client.delete("/api/favorites/boston-common-1") {
                    header(DEVICE_HEADER, deviceId)
                }
            assertEquals(HttpStatusCode.NoContent, deleteResponse.status)

            val listResponse =
                client.get("/api/favorites") {
                    header(DEVICE_HEADER, deviceId)
                }
            val body = json.decodeFromString<FavoritesResponse>(listResponse.bodyAsText())
            assertEquals(emptyList(), body.spot_ids)
        }

    @Test
    fun removingAFavoriteThatWasNeverSetIsANoOpSuccess() =
        runFavoritesTest {
            val response =
                client.delete("/api/favorites/never-favorited") {
                    header(DEVICE_HEADER, UUID.randomUUID().toString())
                }
            assertEquals(HttpStatusCode.NoContent, response.status)
        }

    @Test
    fun favoritesAreScopedPerDevice() =
        runFavoritesTest {
            val deviceA = UUID.randomUUID().toString()
            val deviceB = UUID.randomUUID().toString()

            client.post("/api/favorites") {
                header(DEVICE_HEADER, deviceA)
                contentType(ContentType.Application.Json)
                setBody("""{"spot_id": "boston-common-1"}""")
            }

            val listForB =
                client.get("/api/favorites") {
                    header(DEVICE_HEADER, deviceB)
                }
            val body = json.decodeFromString<FavoritesResponse>(listForB.bodyAsText())
            assertEquals(emptyList(), body.spot_ids)
        }

    @Test
    fun missingDeviceIdHeaderIsRejected() =
        runFavoritesTest {
            val response = client.get("/api/favorites")
            assertEquals(HttpStatusCode.BadRequest, response.status)
        }

    @Test
    fun malformedDeviceIdHeaderIsRejected() =
        runFavoritesTest {
            val response =
                client.get("/api/favorites") {
                    header(DEVICE_HEADER, "not-a-uuid")
                }
            assertEquals(HttpStatusCode.BadRequest, response.status)
        }
}
