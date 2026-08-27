package com.librespaceboston

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.File
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

@Serializable
data class Accessible(
    val value: Boolean,
    val notes: String? = null,
)

// Matches the per-field shape written by data-service/etl.py to output/spots.json,
// minus `distance_meters` which is computed per-request against the caller's location.
@Serializable
data class SpotRecord(
    val spot_id: String,
    val name: String,
    val lat: Double,
    val lon: Double,
    val has_wifi: Boolean,
    val is_park: Boolean,
    val features: List<String>,
    val accessible: Accessible,
    val tree_density_nearby: Int,
    val source_dataset: Map<String, String>,
)

@Serializable
data class Spot(
    val spot_id: String,
    val name: String,
    val lat: Double,
    val lon: Double,
    val distance_meters: Double,
    val has_wifi: Boolean,
    val is_park: Boolean,
    val features: List<String>,
    val accessible: Accessible,
    val tree_density_nearby: Int,
    val source_dataset: Map<String, String>,
)

private const val EARTH_RADIUS_METERS = 6_371_000.0
private const val FALLBACK_SPOT_LIMIT = 5

fun haversineMeters(
    lat1: Double,
    lon1: Double,
    lat2: Double,
    lon2: Double,
): Double {
    val dLat = Math.toRadians(lat2 - lat1)
    val dLon = Math.toRadians(lon2 - lon1)
    val a =
        sin(dLat / 2) * sin(dLat / 2) +
            cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(dLon / 2) * sin(dLon / 2)
    val c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return EARTH_RADIUS_METERS * c
}

class SpotsRepository(private val records: List<SpotRecord>) {
    val size: Int get() = records.size

    // If nothing falls within radiusMeters (e.g. an origin outside Boston, where the dataset's
    // Boston-only coverage begins well past any reasonable radius), fall back to the closest
    // FALLBACK_SPOT_LIMIT spots regardless of distance rather than a bare empty result - Query.kt
    // detects this (the first spot's distance exceeds the requested radius) and adds a disclaimer.
    fun nearby(
        lat: Double,
        lon: Double,
        radiusMeters: Double,
        amenities: List<String>,
    ): List<Spot> {
        val withinRadius = spotsWithin(lat, lon, radiusMeters, amenities)
        if (withinRadius.isNotEmpty()) return withinRadius
        return spotsWithin(lat, lon, Double.MAX_VALUE, amenities).take(FALLBACK_SPOT_LIMIT)
    }

    private fun spotsWithin(
        lat: Double,
        lon: Double,
        radiusMeters: Double,
        amenities: List<String>,
    ): List<Spot> {
        return records
            .asSequence()
            .map { it to haversineMeters(lat, lon, it.lat, it.lon) }
            .filter { (_, distance) -> distance <= radiusMeters }
            .filter { (record, _) -> amenities.all { amenity -> matchesAmenity(amenity, record) } }
            .sortedBy { (_, distance) -> distance }
            .map { (record, distance) ->
                Spot(
                    spot_id = record.spot_id,
                    name = record.name,
                    lat = record.lat,
                    lon = record.lon,
                    distance_meters = distance,
                    has_wifi = record.has_wifi,
                    is_park = record.is_park,
                    features = record.features,
                    accessible = record.accessible,
                    tree_density_nearby = record.tree_density_nearby,
                    source_dataset = record.source_dataset,
                )
            }
            .toList()
    }

    private fun matchesAmenity(
        amenity: String,
        record: SpotRecord,
    ): Boolean =
        when (amenity) {
            "wifi" -> record.has_wifi
            "accessible" -> record.accessible.value
            "playground" -> record.features.contains("playground")
            "restroom" -> record.features.contains("restroom")
            "shade" -> record.features.contains("shade_structure")
            // Every dataset here is a free public amenity — there's no
            // dataset field to filter on, so `free` never excludes a spot.
            "free" -> true
            else -> true
        }

    companion object {
        private val json = Json { ignoreUnknownKeys = true }

        fun loadFromFile(path: String): SpotsRepository {
            val file = File(path)
            if (!file.exists()) {
                return SpotsRepository(emptyList())
            }
            val records = json.decodeFromString<List<SpotRecord>>(file.readText())
            return SpotsRepository(records)
        }

        // For tests: loads a small checked-in fixture from the classpath instead of
        // data-service's real (gitignored, ETL-generated) output/spots.json, so tests
        // are hermetic and don't depend on the ETL having been run.
        fun loadFromResource(resourceName: String): SpotsRepository {
            val text =
                requireNotNull(SpotsRepository::class.java.classLoader.getResourceAsStream(resourceName)) {
                    "Missing test fixture resource: $resourceName"
                }.bufferedReader().readText()
            return SpotsRepository(json.decodeFromString<List<SpotRecord>>(text))
        }
    }
}
