package com.librespaceboston

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

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

private const val SPOTS_COLLECTION_NAME = "spots"

// Natural-language RAG synthesis (query understanding, translation, LLM-grounded
// `answer`) is out of scope here, hackathon-day core product work. When `query`
// is present we still return the same structured/no-LLM result, with a disclaimer
// noting synthesis isn't implemented yet, instead of calling any LLM. What `query`
// DOES do is re-rank the structurally-filtered spots by semantic relevance (see
// [rankBySemanticRelevance]) - real retrieval, no synthesis.
suspend fun buildQueryResponse(
    request: QueryRequest,
    repository: SpotsRepository,
    chromaClient: ChromaClient = ChromaClient(),
    embeddingClient: EmbeddingClient = EmbeddingClient(),
): QueryResponse {
    val structuralSpots =
        repository.nearby(
            lat = request.location.lat,
            lon = request.location.lon,
            radiusMeters = request.radius_meters.toDouble(),
            amenities = request.amenities,
        )

    val queryText = request.query
    val spots =
        if (!queryText.isNullOrBlank() && structuralSpots.isNotEmpty()) {
            rankBySemanticRelevance(
                queryText = queryText,
                amenities = request.amenities,
                structuralSpots = structuralSpots,
                totalSpotCount = repository.size,
                chromaClient = chromaClient,
                embeddingClient = embeddingClient,
            )
        } else {
            structuralSpots
        }

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

/**
 * Re-ranks [structuralSpots] (already radius + amenity filtered, sorted by distance) by semantic
 * relevance to [queryText]: embeds the query text (EmbeddingClient), runs a Chroma similarity
 * query over the whole "spots" collection ([totalSpotCount] results, so every structurally-valid
 * spot has a chance to be covered regardless of where it falls globally), then reorders
 * [structuralSpots] by that ranking. Spots Chroma didn't return keep their original
 * distance-sorted relative order, appended after every ranked spot.
 *
 * `where` narrows the Chroma-side candidate set using metadata fields that map directly to a
 * boolean column (only `has_wifi` today); the richer amenity logic in [SpotsRepository] already
 * fully filtered [structuralSpots], so this is a targeting optimization, not a correctness
 * requirement.
 */
private suspend fun rankBySemanticRelevance(
    queryText: String,
    amenities: List<String>,
    structuralSpots: List<Spot>,
    totalSpotCount: Int,
    chromaClient: ChromaClient,
    embeddingClient: EmbeddingClient,
): List<Spot> {
    val collection = chromaClient.findCollectionByName(SPOTS_COLLECTION_NAME) ?: return structuralSpots
    val queryEmbedding = embeddingClient.embed(queryText)
    val where = if ("wifi" in amenities) buildJsonObject { put("has_wifi", true) } else null
    val response = chromaClient.query(collection.id, queryEmbedding, where = where, nResults = totalSpotCount)

    val rank = response.matches().withIndex().associate { (index, match) -> match.id to index }
    return structuralSpots.sortedWith(
        compareBy({ rank[it.spot_id] ?: Int.MAX_VALUE }, { it.distance_meters }),
    )
}
