package com.librespaceboston

import kotlinx.coroutines.CancellationException
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonPrimitive
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
    val location: Coordinates? = null,
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
data class ResolvedLocation(
    val lat: Double,
    val lon: Double,
    val source: String,
    val label: String,
    val approximate: Boolean,
)

@Serializable
data class LocationRequiredError(
    val code: String = "location_required",
    val message: String = "Choose a Boston neighborhood to find nearby places.",
)

@Serializable
data class QueryResponse(
    val detected_language: String? = null,
    val translated_query: String? = null,
    val answer: String? = null,
    val disclaimers: List<String> = emptyList(),
    val spots: List<Spot>,
    val highlights: Highlights? = null,
    val resolved_location: ResolvedLocation? = null,
)

private const val SPOTS_COLLECTION_NAME = "spots"
private const val MAX_SPOTS_FOR_SYNTHESIS = 8
private val TIER_ONE_LANGUAGES = setOf("en", "es")
private val json = Json { ignoreUnknownKeys = true }

// Natural-language RAG synthesis: when `query` is present, one LLM call detects the query's
// language and translates it to English (retrieval + synthesis both run in English — the
// embedding model and the dataset are English-only, per spec.md section 9), then a second LLM
// call grounds an answer in the actual retrieved spot data and flags any requested attribute the
// data can't confirm. `query`-absent requests never touch the LLM (see the early return below) —
// that's the whole reason the structured bento-grid path exists.
suspend fun buildQueryResponse(
    request: QueryRequest,
    repository: SpotsRepository,
    location: ResolvedLocation,
    chromaClient: ChromaClient = ChromaClient(),
    embeddingClient: EmbeddingClient = EmbeddingClient(),
    llmClient: LlmClient = LlmClient(),
): QueryResponse {
    val structuralSpots =
        repository.nearby(
            lat = location.lat,
            lon = location.lon,
            radiusMeters = request.radius_meters.toDouble(),
            amenities = request.amenities,
        )

    val queryText = request.query
    if (queryText.isNullOrBlank()) {
        return QueryResponse(
            spots = structuralSpots,
            highlights = buildHighlights(structuralSpots),
            resolved_location = location,
            disclaimers =
                buildList {
                    if (location.approximate) add("Using an approximate area based on your network connection.")
                },
        )
    }

    if (structuralSpots.isEmpty()) {
        return QueryResponse(
            spots = structuralSpots,
            highlights = buildHighlights(structuralSpots),
            resolved_location = location,
            disclaimers =
                buildList {
                    if (location.approximate) add("Using an approximate area based on your network connection.")
                    add("No nearby spots matched your search, try a larger radius or fewer filters.")
                },
        )
    }

    val languageResult = detectAndTranslate(llmClient, queryText)
    val retrievalText = languageResult?.translated_query ?: queryText

    val spots =
        rankBySemanticRelevance(
            queryText = retrievalText,
            amenities = request.amenities,
            structuralSpots = structuralSpots,
            totalSpotCount = repository.size,
            chromaClient = chromaClient,
            embeddingClient = embeddingClient,
        )

    val synthesis =
        synthesizeAnswer(
            llmClient = llmClient,
            englishQuery = retrievalText,
            detectedLanguage = languageResult?.detected_language ?: "en",
            spots = spots.take(MAX_SPOTS_FOR_SYNTHESIS),
        )

    val disclaimers =
        buildList {
            if (location.approximate) add("Using an approximate area based on your network connection.")
            addAll(buildDisclaimers(languageResult, synthesis))
        }

    return QueryResponse(
        detected_language = languageResult?.detected_language,
        translated_query = languageResult?.translated_query,
        answer = synthesis?.answer,
        disclaimers = disclaimers,
        spots = spots,
        highlights = buildHighlights(spots),
        resolved_location = location,
    )
}

fun Coordinates.toResolvedLocation(): ResolvedLocation {
    val source = source?.takeIf { it in setOf("device", "manual") } ?: "device"
    return ResolvedLocation(
        lat = lat,
        lon = lon,
        source = source,
        label = if (source == "manual") "Selected neighborhood" else "Your location",
        approximate = false,
    )
}

private fun buildHighlights(spots: List<Spot>): Highlights =
    Highlights(
        closest_wifi = spots.firstOrNull { it.has_wifi }?.spot_id,
        closest_park = spots.firstOrNull { it.is_park }?.spot_id,
        closest_restroom = spots.firstOrNull { it.features.contains("restroom") }?.spot_id,
    )

private fun buildDisclaimers(
    languageResult: LanguageDetectionResult?,
    synthesis: SynthesisResult?,
): List<String> {
    val disclaimers = mutableListOf<String>()

    if (languageResult == null) {
        disclaimers.add("Language detection is unavailable right now, showing nearby spots without a translated answer.")
    } else if (languageResult.detected_language.substringBefore('-').lowercase() !in TIER_ONE_LANGUAGES) {
        // spec.md section 9: only English + Spanish are fully validated; every other language is
        // best-effort machine translation and must say so, rather than silently underperforming.
        disclaimers.add("This answer was machine-translated and hasn't been fully validated in this language, verify details.")
    }

    if (synthesis == null) {
        disclaimers.add("Natural-language answer synthesis is unavailable right now, showing nearby spots only.")
    } else {
        for (attribute in synthesis.unsupported_attributes) {
            disclaimers.add("\"$attribute\" isn't something our data can confirm, it wasn't evaluated.")
        }
    }

    return disclaimers
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
): List<Spot> =
    try {
        val collection = chromaClient.findCollectionByName(SPOTS_COLLECTION_NAME) ?: return structuralSpots
        val queryEmbedding = embeddingClient.embed(queryText)
        val where = if ("wifi" in amenities) buildJsonObject { put("has_wifi", true) } else null
        val response = chromaClient.query(collection.id, queryEmbedding, where = where, nResults = totalSpotCount)

        val rank = response.matches().withIndex().associate { (index, match) -> match.id to index }
        structuralSpots.sortedWith(
            compareBy({ rank[it.spot_id] ?: Int.MAX_VALUE }, { it.distance_meters }),
        )
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        structuralSpots
    }

@Serializable
data class LanguageDetectionResult(
    val detected_language: String,
    val translated_query: String? = null,
)

private const val LANGUAGE_DETECTION_SYSTEM_PROMPT =
    """You are a language detection and translation service for LibreSpace Boston, an app that
helps people find free public spaces in Boston. You will be given a user's free-text request.

Respond with strict JSON only, no markdown fences, no commentary, in exactly this shape:
{"detected_language": "<lowercase BCP-47 code, e.g. \"en\", \"es\", \"vi\">", "translated_query": "<English translation, or null if the input is already English>"}
"""

private suspend fun detectAndTranslate(
    llmClient: LlmClient,
    queryText: String,
): LanguageDetectionResult? =
    try {
        val raw = llmClient.chat(systemPrompt = LANGUAGE_DETECTION_SYSTEM_PROMPT, userPrompt = queryText)
        json.decodeFromString<LanguageDetectionResult>(extractJsonObject(raw))
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        null
    }

@Serializable
data class SynthesisResult(
    val answer: String,
    val unsupported_attributes: List<String> = emptyList(),
)

/** Trimmed, LLM-facing view of [Spot] — only the fields the synthesis prompt should cite from. */
@Serializable
private data class SpotForLlm(
    val spot_id: String,
    val name: String,
    val distance_meters: Int,
    val has_wifi: Boolean,
    val is_park: Boolean,
    val features: List<String>,
    val accessible: Boolean,
    val tree_density_nearby: Int,
    val source_dataset: Map<String, String>,
)

private fun Spot.toLlmView() =
    SpotForLlm(
        spot_id = spot_id,
        name = name,
        distance_meters = distance_meters.toInt(),
        has_wifi = has_wifi,
        is_park = is_park,
        features = features,
        accessible = accessible.value,
        tree_density_nearby = tree_density_nearby,
        source_dataset = source_dataset,
    )

private const val SYNTHESIS_SYSTEM_PROMPT =
    """You are LibreSpace Boston's assistant. You help people find free public spaces in Boston
(parks, plazas, and similar spots) that match their needs. You will be given the user's request,
already translated to English, and a JSON array of candidate spots with verified fields:
spot_id, name, distance_meters, has_wifi, is_park, features (list of strings),
accessible (boolean), tree_density_nearby (a proxy for shade, higher = more trees),
source_dataset (which city dataset backs each field).

Rules:
- Only use the fields given. Never invent a spot, a distance, or an amenity not present in the data.
- When you claim a spot has an amenity, name the spot and cite the dataset field backing it, e.g.
  "Boston Common has Wi-Fi (Wicked Free Wi-Fi Locations)".
- If the user asked for something with no matching field in the data (e.g. "quiet", "safe", "cozy"),
  do not guess whether any spot satisfies it. Instead list it verbatim in "unsupported_attributes".
- Recommend at most 3 spots, best match first.
- Write "answer" in the language with BCP-47 code {{detected_language}}. Keep spot names,
  distances, and dataset citations exactly as given, do not translate them.
- Respond with strict JSON only, no markdown fences, no commentary, in exactly this shape:
  {"answer": "<a single plain-text string of normal prose, NOT a list or array>", "unsupported_attributes": ["..."]}
  "answer" must be one JSON string value, never a JSON array.
"""

// qwen2.5:7b (local, 7B) doesn't always follow the "answer must be a string" instruction above -
// observed live it sometimes emits a JSON array of sentence fragments instead. Parse "answer" as
// a JsonElement and flatten either shape into plain text rather than failing the whole call.
@Serializable
private data class RawSynthesisResult(
    val answer: JsonElement,
    val unsupported_attributes: List<String> = emptyList(),
)

private fun JsonElement.flattenToText(): String =
    when (this) {
        is JsonArray -> joinToString(" ") { it.flattenToText() }
        is JsonPrimitive -> content
        else -> toString()
    }

private suspend fun synthesizeAnswer(
    llmClient: LlmClient,
    englishQuery: String,
    detectedLanguage: String,
    spots: List<Spot>,
): SynthesisResult? =
    try {
        val systemPrompt = SYNTHESIS_SYSTEM_PROMPT.replace("{{detected_language}}", detectedLanguage)
        val spotsJson = json.encodeToString(spots.map { it.toLlmView() })
        val userPrompt = "User's request: $englishQuery\n\nCandidate spots (JSON):\n$spotsJson"
        val raw = llmClient.chat(systemPrompt = systemPrompt, userPrompt = userPrompt, temperature = 0.2)
        val parsed = json.decodeFromString<RawSynthesisResult>(extractJsonObject(raw))
        SynthesisResult(answer = parsed.answer.flattenToText(), unsupported_attributes = parsed.unsupported_attributes)
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        null
    }

/** Local models sometimes wrap JSON in markdown fences or add stray commentary; strip to the outermost object. */
private fun extractJsonObject(text: String): String {
    val start = text.indexOf('{')
    val end = text.lastIndexOf('}')
    require(start >= 0 && end > start) { "No JSON object found in LLM response: $text" }
    return text.substring(start, end + 1)
}
