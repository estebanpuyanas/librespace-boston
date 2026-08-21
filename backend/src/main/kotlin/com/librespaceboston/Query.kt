package com.librespaceboston

import kotlinx.serialization.Serializable

/**
 * @Serializable is required for Ktor's ContentNegotiation plugin to serialize/deserialize JSON request/response bodies.
 */

@Serializable
data class Coordinates(
    val lat: Double,
    val lon: Double,
    val source: String? = null,
)

@Serializable
data class QueryRequest(
    val query: String? = null,
    val location: Coordinates,
    val radius_meters: Int = 800,
    val amenities: List<String> = emptyList(),
    val language: String? = null,
)

@Serializable
data class Highlights(
    val closest_wifi: String? = null,
    val closest_park: String? = null,
    val closest_restroom: String? = null,
)

@Serializable
data class QueryResponse(
    val detected_language: String? = null,
    val translated_query: String? = null,
    val answer: String? = null,
    val disclaimers: List<String> = emptyList(),
    val spots: List<Spot>,
    val highlights: Highlights? = null,
)

// Natural-language RAG synthesis (query understanding, translation, LLM-grounded
// `answer`) is out of scope here, hackathon-day core product work. When `query`
// is present we still return the same structured/no-LLM result, with a disclaimer
// noting synthesis isn't implemented yet, instead of calling any LLM.
fun buildQueryResponse(
    request: QueryRequest,
    repository: SpotsRepository,
): QueryResponse {
    val spots =
        repository.nearby(
            lat = request.location.lat,
            lon = request.location.lon,
            radiusMeters = request.radius_meters.toDouble(),
            amenities = request.amenities,
        )

    val highlights =
        Highlights(
            closest_wifi = spots.firstOrNull { it.has_wifi }?.spot_id,
            closest_park = spots.firstOrNull { it.is_park }?.spot_id,
            closest_restroom = spots.firstOrNull { it.features.contains("restroom") }?.spot_id,
        )

    val disclaimers =
        if (request.query != null) {
            listOf("Natural-language answer synthesis isn't implemented yet, showing nearby spots only.")
        } else {
            emptyList()
        }

    return QueryResponse(
        detected_language = null,
        translated_query = null,
        answer = null,
        disclaimers = disclaimers,
        spots = spots,
        highlights = highlights,
    )
}
