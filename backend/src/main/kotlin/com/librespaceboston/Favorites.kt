package com.librespaceboston

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insertIgnore
import org.jetbrains.exposed.sql.javatime.timestamp
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import java.time.Instant
import java.util.UUID

@Serializable
data class AddFavoriteRequest(
    val spot_id: String,
)

@Serializable
data class FavoritesResponse(
    val spot_ids: List<String>,
)

object Devices : Table("devices") {
    val deviceId = uuid("device_id")
    val createdAt = timestamp("created_at").clientDefault { Instant.now() }
    override val primaryKey = PrimaryKey(deviceId)
}

// spot_id is a string from data-service's output/spots.json, not a foreign key —
// spots live in that file/Chroma, not Postgres (see AGENTS.md).
object Favorites : Table("favorites") {
    val deviceId = uuid("device_id").references(Devices.deviceId)
    val spotId = varchar("spot_id", 255)
    val createdAt = timestamp("created_at").clientDefault { Instant.now() }
    override val primaryKey = PrimaryKey(deviceId, spotId)
}

interface FavoritesRepository {
    suspend fun registerDevice(deviceId: UUID)

    suspend fun addFavorite(
        deviceId: UUID,
        spotId: String,
    )

    suspend fun removeFavorite(
        deviceId: UUID,
        spotId: String,
    )

    suspend fun listFavorites(deviceId: UUID): List<String>
}

class ExposedFavoritesRepository(private val database: Database) : FavoritesRepository {
    override suspend fun registerDevice(deviceId: UUID) {
        newSuspendedTransaction(db = database) {
            Devices.insertIgnore { it[Devices.deviceId] = deviceId }
        }
    }

    override suspend fun addFavorite(
        deviceId: UUID,
        spotId: String,
    ) {
        newSuspendedTransaction(db = database) {
            Favorites.insertIgnore {
                it[Favorites.deviceId] = deviceId
                it[Favorites.spotId] = spotId
            }
        }
    }

    override suspend fun removeFavorite(
        deviceId: UUID,
        spotId: String,
    ) {
        newSuspendedTransaction(db = database) {
            Favorites.deleteWhere { (Favorites.deviceId eq deviceId) and (Favorites.spotId eq spotId) }
        }
    }

    override suspend fun listFavorites(deviceId: UUID): List<String> =
        newSuspendedTransaction(db = database) {
            Favorites
                .selectAll()
                .where { Favorites.deviceId eq deviceId }
                .map { it[Favorites.spotId] }
        }
}

// Hermetic stand-in for tests and any dev flow that doesn't need a real Postgres —
// CI has no live database access (see ChromaClientTest/SpotsRepository.loadFromResource
// for the same precedent).
class InMemoryFavoritesRepository : FavoritesRepository {
    private val devices = mutableSetOf<UUID>()
    private val favorites = mutableSetOf<Pair<UUID, String>>()

    override suspend fun registerDevice(deviceId: UUID) {
        devices += deviceId
    }

    override suspend fun addFavorite(
        deviceId: UUID,
        spotId: String,
    ) {
        favorites += deviceId to spotId
    }

    override suspend fun removeFavorite(
        deviceId: UUID,
        spotId: String,
    ) {
        favorites -= deviceId to spotId
    }

    override suspend fun listFavorites(deviceId: UUID): List<String> = favorites.filter { it.first == deviceId }.map { it.second }
}
