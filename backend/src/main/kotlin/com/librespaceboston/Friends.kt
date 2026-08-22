package com.librespaceboston

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.inList
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insertIgnore
import org.jetbrains.exposed.sql.javatime.timestamp
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import java.security.SecureRandom
import java.time.Instant
import java.util.UUID

@Serializable
data class FriendCodeResponse(
    val friend_code: String,
)

@Serializable
data class AddFriendRequest(
    val friend_code: String,
)

@Serializable
data class Friend(
    val device_id: String,
    val friend_code: String? = null,
)

@Serializable
data class FriendsResponse(
    val friends: List<Friend>,
)

@Serializable
data class ShareSpotRequest(
    val spot_id: String,
)

@Serializable
data class SharedSpot(
    val spot_id: String,
    val from_device_id: String,
    val shared_at: String,
)

@Serializable
data class SharedWithMeResponse(
    val shared_spots: List<SharedSpot>,
)

// Excludes visually ambiguous characters (0/O, 1/I/L) since these are meant to be read
// aloud or typed by hand off a friend's screen.
private const val FRIEND_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
private const val FRIEND_CODE_LENGTH = 6

fun generateFriendCode(): String {
    val random = SecureRandom()
    return (1..FRIEND_CODE_LENGTH)
        .map { FRIEND_CODE_ALPHABET[random.nextInt(FRIEND_CODE_ALPHABET.length)] }
        .joinToString("")
}

// Separate table rather than a column on Devices — SchemaUtils.create doesn't alter
// existing tables, and Devices already shipped in lsb-db-favorites (see AGENTS.md).
object FriendCodes : Table("friend_codes") {
    val deviceId = uuid("device_id").references(Devices.deviceId)
    val code = varchar("code", FRIEND_CODE_LENGTH)
    val createdAt = timestamp("created_at").clientDefault { Instant.now() }
    override val primaryKey = PrimaryKey(deviceId)

    init {
        uniqueIndex(code)
    }
}

// Stored as one row per direction so listFriends(deviceId) is a plain equality lookup —
// addFriend() writes both directions atomically to keep the relation symmetric.
object Friendships : Table("friendships") {
    val deviceId = uuid("device_id").references(Devices.deviceId)
    val friendDeviceId = uuid("friend_device_id").references(Devices.deviceId)
    val createdAt = timestamp("created_at").clientDefault { Instant.now() }
    override val primaryKey = PrimaryKey(deviceId, friendDeviceId)
}

// spot_id is a string from data-service's output/spots.json, not a foreign key — same
// rationale as Favorites.
object SharedSpots : Table("shared_spots") {
    val fromDevice = uuid("from_device_id").references(Devices.deviceId)
    val toDevice = uuid("to_device_id").references(Devices.deviceId)
    val spotId = varchar("spot_id", 255)
    val createdAt = timestamp("created_at").clientDefault { Instant.now() }
    override val primaryKey = PrimaryKey(fromDevice, toDevice, spotId)
}

interface FriendsRepository {
    suspend fun getOrCreateFriendCode(deviceId: UUID): String

    suspend fun findDeviceIdByCode(code: String): UUID?

    suspend fun addFriend(
        deviceId: UUID,
        friendDeviceId: UUID,
    )

    suspend fun areFriends(
        deviceId: UUID,
        otherDeviceId: UUID,
    ): Boolean

    suspend fun listFriends(deviceId: UUID): List<Friend>

    suspend fun shareSpot(
        fromDevice: UUID,
        toDevice: UUID,
        spotId: String,
    )

    suspend fun listSharedWithMe(deviceId: UUID): List<SharedSpot>
}

class ExposedFriendsRepository(private val database: Database) : FriendsRepository {
    override suspend fun getOrCreateFriendCode(deviceId: UUID): String =
        newSuspendedTransaction(db = database) {
            FriendCodes
                .selectAll()
                .where { FriendCodes.deviceId eq deviceId }
                .singleOrNull()
                ?.get(FriendCodes.code)
                ?: run {
                    var code = generateFriendCode()
                    while (!FriendCodes.selectAll().where { FriendCodes.code eq code }.empty()) {
                        code = generateFriendCode()
                    }
                    // insertIgnore, not insert - two concurrent first-time requests for the
                    // same device both reach here; the loser's insert is a race-safe no-op
                    // instead of a unique-constraint 500, and the re-select below picks up
                    // whichever code actually won.
                    FriendCodes.insertIgnore {
                        it[FriendCodes.deviceId] = deviceId
                        it[FriendCodes.code] = code
                    }
                    FriendCodes
                        .selectAll()
                        .where { FriendCodes.deviceId eq deviceId }
                        .single()
                        .get(FriendCodes.code)
                }
        }

    override suspend fun findDeviceIdByCode(code: String): UUID? =
        newSuspendedTransaction(db = database) {
            val normalized = code.trim().uppercase()
            FriendCodes.selectAll().where { FriendCodes.code eq normalized }.singleOrNull()?.get(FriendCodes.deviceId)
        }

    override suspend fun addFriend(
        deviceId: UUID,
        friendDeviceId: UUID,
    ) {
        newSuspendedTransaction(db = database) {
            Friendships.insertIgnore {
                it[Friendships.deviceId] = deviceId
                it[Friendships.friendDeviceId] = friendDeviceId
            }
            Friendships.insertIgnore {
                it[Friendships.deviceId] = friendDeviceId
                it[Friendships.friendDeviceId] = deviceId
            }
        }
    }

    override suspend fun areFriends(
        deviceId: UUID,
        otherDeviceId: UUID,
    ): Boolean =
        newSuspendedTransaction(db = database) {
            !Friendships
                .selectAll()
                .where { (Friendships.deviceId eq deviceId) and (Friendships.friendDeviceId eq otherDeviceId) }
                .empty()
        }

    override suspend fun listFriends(deviceId: UUID): List<Friend> =
        newSuspendedTransaction(db = database) {
            val friendIds =
                Friendships
                    .selectAll()
                    .where { Friendships.deviceId eq deviceId }
                    .map { it[Friendships.friendDeviceId] }
            val codesByFriendId =
                FriendCodes
                    .selectAll()
                    .where { FriendCodes.deviceId inList friendIds }
                    .associate { it[FriendCodes.deviceId] to it[FriendCodes.code] }
            friendIds.map { friendId ->
                Friend(device_id = friendId.toString(), friend_code = codesByFriendId[friendId])
            }
        }

    override suspend fun shareSpot(
        fromDevice: UUID,
        toDevice: UUID,
        spotId: String,
    ) {
        newSuspendedTransaction(db = database) {
            SharedSpots.insertIgnore {
                it[SharedSpots.fromDevice] = fromDevice
                it[SharedSpots.toDevice] = toDevice
                it[SharedSpots.spotId] = spotId
            }
        }
    }

    override suspend fun listSharedWithMe(deviceId: UUID): List<SharedSpot> =
        newSuspendedTransaction(db = database) {
            SharedSpots
                .selectAll()
                .where { SharedSpots.toDevice eq deviceId }
                .map {
                    SharedSpot(
                        spot_id = it[SharedSpots.spotId],
                        from_device_id = it[SharedSpots.fromDevice].toString(),
                        shared_at = it[SharedSpots.createdAt].toString(),
                    )
                }
        }
}

// Hermetic stand-in for tests and any dev flow that doesn't need a real Postgres —
// same precedent as InMemoryFavoritesRepository.
class InMemoryFriendsRepository : FriendsRepository {
    private val codesByDevice = mutableMapOf<UUID, String>()
    private val deviceByCode = mutableMapOf<String, UUID>()
    private val friendships = mutableSetOf<Pair<UUID, UUID>>()
    private val sharedSpots = linkedMapOf<Triple<UUID, UUID, String>, SharedSpot>()

    override suspend fun getOrCreateFriendCode(deviceId: UUID): String =
        codesByDevice.getOrPut(deviceId) {
            var code = generateFriendCode()
            while (deviceByCode.containsKey(code)) {
                code = generateFriendCode()
            }
            deviceByCode[code] = deviceId
            code
        }

    override suspend fun findDeviceIdByCode(code: String): UUID? = deviceByCode[code.trim().uppercase()]

    override suspend fun addFriend(
        deviceId: UUID,
        friendDeviceId: UUID,
    ) {
        friendships += deviceId to friendDeviceId
        friendships += friendDeviceId to deviceId
    }

    override suspend fun areFriends(
        deviceId: UUID,
        otherDeviceId: UUID,
    ): Boolean = (deviceId to otherDeviceId) in friendships

    override suspend fun listFriends(deviceId: UUID): List<Friend> =
        friendships
            .filter { it.first == deviceId }
            .map { (_, friendId) -> Friend(device_id = friendId.toString(), friend_code = codesByDevice[friendId]) }

    override suspend fun shareSpot(
        fromDevice: UUID,
        toDevice: UUID,
        spotId: String,
    ) {
        val key = Triple(fromDevice, toDevice, spotId)
        sharedSpots.getOrPut(key) {
            SharedSpot(spot_id = spotId, from_device_id = fromDevice.toString(), shared_at = Instant.now().toString())
        }
    }

    override suspend fun listSharedWithMe(deviceId: UUID): List<SharedSpot> =
        sharedSpots.filterKeys { it.second == deviceId }.values.toList()
}
