package com.librespaceboston

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
import kotlin.test.assertTrue

private const val DEVICE_HEADER = "X-Device-Id"

class FriendsTest {
    private val json = Json { ignoreUnknownKeys = true }

    private fun runFriendsTest(
        friendsRepository: FriendsRepository = InMemoryFriendsRepository(),
        block: suspend ApplicationTestBuilder.() -> Unit,
    ) = testApplication {
        application {
            module(
                spotsRepository = SpotsRepository.loadFromResource("fixtures/spots.json"),
                favoritesRepository = lazyOf(InMemoryFavoritesRepository()),
                friendsRepository = lazyOf(friendsRepository),
            )
        }
        block()
    }

    private suspend fun ApplicationTestBuilder.friendCodeFor(deviceId: String): String {
        val response =
            client.get("/api/me/friend-code") {
                header(DEVICE_HEADER, deviceId)
            }
        return json.decodeFromString<FriendCodeResponse>(response.bodyAsText()).friend_code
    }

    @Test
    fun friendCodeIsGeneratedAndStable() =
        runFriendsTest {
            val deviceId = UUID.randomUUID().toString()
            val first = friendCodeFor(deviceId)
            val second = friendCodeFor(deviceId)
            assertEquals(first, second)
            assertTrue(first.isNotBlank())
        }

    @Test
    fun differentDevicesGetDifferentCodes() =
        runFriendsTest {
            val codeA = friendCodeFor(UUID.randomUUID().toString())
            val codeB = friendCodeFor(UUID.randomUUID().toString())
            assertTrue(codeA != codeB)
        }

    @Test
    fun addingAFriendByCodeIsMutual() =
        runFriendsTest {
            val deviceA = UUID.randomUUID().toString()
            val deviceB = UUID.randomUUID().toString()
            val codeB = friendCodeFor(deviceB)

            val addResponse =
                client.post("/api/friends") {
                    header(DEVICE_HEADER, deviceA)
                    contentType(ContentType.Application.Json)
                    setBody("""{"friend_code": "$codeB"}""")
                }
            assertEquals(HttpStatusCode.NoContent, addResponse.status)

            val friendsOfA =
                json.decodeFromString<FriendsResponse>(
                    client.get("/api/friends") { header(DEVICE_HEADER, deviceA) }.bodyAsText(),
                )
            assertEquals(listOf(deviceB), friendsOfA.friends.map { it.device_id })

            val friendsOfB =
                json.decodeFromString<FriendsResponse>(
                    client.get("/api/friends") { header(DEVICE_HEADER, deviceB) }.bodyAsText(),
                )
            assertEquals(listOf(deviceA), friendsOfB.friends.map { it.device_id })
        }

    @Test
    fun addingTheSameFriendTwiceIsIdempotent() =
        runFriendsTest {
            val deviceA = UUID.randomUUID().toString()
            val deviceB = UUID.randomUUID().toString()
            val codeB = friendCodeFor(deviceB)

            repeat(2) {
                val response =
                    client.post("/api/friends") {
                        header(DEVICE_HEADER, deviceA)
                        contentType(ContentType.Application.Json)
                        setBody("""{"friend_code": "$codeB"}""")
                    }
                assertEquals(HttpStatusCode.NoContent, response.status)
            }

            val friendsOfA =
                json.decodeFromString<FriendsResponse>(
                    client.get("/api/friends") { header(DEVICE_HEADER, deviceA) }.bodyAsText(),
                )
            assertEquals(listOf(deviceB), friendsOfA.friends.map { it.device_id })
        }

    @Test
    fun addingAFriendWithAnUnknownCodeIsRejected() =
        runFriendsTest {
            val response =
                client.post("/api/friends") {
                    header(DEVICE_HEADER, UUID.randomUUID().toString())
                    contentType(ContentType.Application.Json)
                    setBody("""{"friend_code": "NOTREAL"}""")
                }
            assertEquals(HttpStatusCode.NotFound, response.status)
        }

    @Test
    fun addingYourOwnCodeIsRejected() =
        runFriendsTest {
            val deviceId = UUID.randomUUID().toString()
            val ownCode = friendCodeFor(deviceId)

            val response =
                client.post("/api/friends") {
                    header(DEVICE_HEADER, deviceId)
                    contentType(ContentType.Application.Json)
                    setBody("""{"friend_code": "$ownCode"}""")
                }
            assertEquals(HttpStatusCode.BadRequest, response.status)
        }

    @Test
    fun sharingWithANonFriendIsRejected() =
        runFriendsTest {
            val deviceA = UUID.randomUUID().toString()
            val deviceB = UUID.randomUUID().toString()

            val response =
                client.post("/api/friends/$deviceB/share") {
                    header(DEVICE_HEADER, deviceA)
                    contentType(ContentType.Application.Json)
                    setBody("""{"spot_id": "boston-common-1"}""")
                }
            assertEquals(HttpStatusCode.Forbidden, response.status)
        }

    @Test
    fun sharingWithAFriendShowsUpInSharedWithMe() =
        runFriendsTest {
            val deviceA = UUID.randomUUID().toString()
            val deviceB = UUID.randomUUID().toString()
            val codeB = friendCodeFor(deviceB)
            client.post("/api/friends") {
                header(DEVICE_HEADER, deviceA)
                contentType(ContentType.Application.Json)
                setBody("""{"friend_code": "$codeB"}""")
            }

            val shareResponse =
                client.post("/api/friends/$deviceB/share") {
                    header(DEVICE_HEADER, deviceA)
                    contentType(ContentType.Application.Json)
                    setBody("""{"spot_id": "boston-common-1"}""")
                }
            assertEquals(HttpStatusCode.NoContent, shareResponse.status)

            val sharedWithB =
                json.decodeFromString<SharedWithMeResponse>(
                    client.get("/api/shared-with-me") { header(DEVICE_HEADER, deviceB) }.bodyAsText(),
                )
            assertEquals(1, sharedWithB.shared_spots.size)
            assertEquals("boston-common-1", sharedWithB.shared_spots.first().spot_id)
            assertEquals(deviceA, sharedWithB.shared_spots.first().from_device_id)

            val sharedWithA =
                json.decodeFromString<SharedWithMeResponse>(
                    client.get("/api/shared-with-me") { header(DEVICE_HEADER, deviceA) }.bodyAsText(),
                )
            assertEquals(emptyList(), sharedWithA.shared_spots)
        }

    @Test
    fun sharingTheSameSpotTwiceIsIdempotent() =
        runFriendsTest {
            val deviceA = UUID.randomUUID().toString()
            val deviceB = UUID.randomUUID().toString()
            val codeB = friendCodeFor(deviceB)
            client.post("/api/friends") {
                header(DEVICE_HEADER, deviceA)
                contentType(ContentType.Application.Json)
                setBody("""{"friend_code": "$codeB"}""")
            }

            repeat(2) {
                client.post("/api/friends/$deviceB/share") {
                    header(DEVICE_HEADER, deviceA)
                    contentType(ContentType.Application.Json)
                    setBody("""{"spot_id": "boston-common-1"}""")
                }
            }

            val sharedWithB =
                json.decodeFromString<SharedWithMeResponse>(
                    client.get("/api/shared-with-me") { header(DEVICE_HEADER, deviceB) }.bodyAsText(),
                )
            assertEquals(1, sharedWithB.shared_spots.size)
        }

    @Test
    fun missingDeviceIdHeaderIsRejected() =
        runFriendsTest {
            val response = client.get("/api/friends")
            assertEquals(HttpStatusCode.BadRequest, response.status)
        }
}
