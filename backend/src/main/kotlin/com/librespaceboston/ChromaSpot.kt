package com.librespaceboston

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.jsonPrimitive

// Chroma stores this flattened, per-spot metadata alongside a plain-text "document" description
// (data-service/ingest.py). `features`, `accessible`, and `source_dataset` are pushed as
// JSON-encoded strings rather than native Chroma types, so they need a nested decode on the way
// back out - see `ChromaSpot.fromMetadata`.
@Serializable
data class ChromaSpot(
    val id: String,
    val document: String?,
    val spotId: String,
    val name: String,
    val lat: Double,
    val lon: Double,
    val hasWifi: Boolean,
    val isPark: Boolean,
    val features: List<String>,
    val accessible: Accessible,
    val treeDensityNearby: Int,
    val sourceDataset: Map<String, String>,
) {
    companion object {
        private val json = Json { ignoreUnknownKeys = true }

        /** Decodes one entry of a [ChromaGetResponse] (matched by index) into a [ChromaSpot]. */
        fun fromMetadata(
            id: String,
            document: String?,
            metadata: Map<String, JsonElement>,
        ): ChromaSpot {
            fun field(key: String): JsonPrimitive = requireNotNull(metadata[key]?.jsonPrimitive) { "missing metadata field: $key" }

            return ChromaSpot(
                id = id,
                document = document,
                spotId = field("spot_id").content,
                name = field("name").content,
                lat = field("lat").content.toDouble(),
                lon = field("lon").content.toDouble(),
                hasWifi = field("has_wifi").boolean,
                isPark = field("is_park").boolean,
                features = json.decodeFromString(field("features").content),
                accessible = json.decodeFromString(field("accessible").content),
                treeDensityNearby = field("tree_density_nearby").content.toInt(),
                sourceDataset = json.decodeFromString(field("source_dataset").content),
            )
        }

        /** Decodes an entire `get` response, zipping ids/documents/metadatas by index. */
        fun fromGetResponse(response: ChromaGetResponse): List<ChromaSpot> {
            val documents = response.documents ?: List(response.ids.size) { null }
            val metadatas = response.metadatas ?: List(response.ids.size) { null }
            return response.ids.indices.map { index ->
                val metadata = requireNotNull(metadatas[index]) { "missing metadata for id: ${response.ids[index]}" }
                fromMetadata(response.ids[index], documents[index], metadata)
            }
        }
    }
}
