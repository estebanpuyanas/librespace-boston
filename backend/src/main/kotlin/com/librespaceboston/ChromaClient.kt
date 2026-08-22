package com.librespaceboston

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement

/** Configures the reusable Chroma v2 REST client used by [ChromaClient], wired into POST /api/query's semantic path (Query.kt). */
data class ChromaConfig(
    val baseUrl: String,
    val tenant: String = "default_tenant",
    val database: String = "default_database",
) {
    companion object {
        fun fromEnv(): ChromaConfig = ChromaConfig(baseUrl = envVar("CHROMA_URL") ?: "http://localhost:8000")
    }
}

@Serializable
data class ChromaCollection(
    val id: String,
    val name: String,
)

@Serializable
data class ChromaGetRequest(
    val ids: List<String>? = null,
    val where: JsonElement? = null,
    val limit: Int? = null,
    val include: List<String> = listOf("documents", "metadatas"),
)

@Serializable
data class ChromaGetResponse(
    val ids: List<String>,
    val documents: List<String?>? = null,
    val metadatas: List<Map<String, JsonElement>?>? = null,
)

@Serializable
data class ChromaQueryRequest(
    val query_embeddings: List<List<Double>>,
    val n_results: Int,
    val where: JsonElement? = null,
    val include: List<String> = listOf("documents", "metadatas", "distances"),
)

// Chroma nests results by query embedding (`query_embeddings` accepts a batch); we always send
// exactly one, so every field here has exactly one outer entry.
@Serializable
data class ChromaQueryResponse(
    val ids: List<List<String>>,
    val documents: List<List<String?>>? = null,
    val metadatas: List<List<Map<String, JsonElement>?>>? = null,
    val distances: List<List<Double>>? = null,
)

/** One ranked match, flattened out of [ChromaQueryResponse]'s single-query-embedding batch shape. */
data class ChromaQueryMatch(
    val id: String,
    val document: String?,
    val metadata: Map<String, JsonElement>?,
    val distance: Double?,
)

fun ChromaQueryResponse.matches(): List<ChromaQueryMatch> {
    val matchedIds = ids.firstOrNull() ?: return emptyList()
    val matchedDocuments = documents?.firstOrNull()
    val matchedMetadatas = metadatas?.firstOrNull()
    val matchedDistances = distances?.firstOrNull()
    return matchedIds.mapIndexed { index, id ->
        ChromaQueryMatch(
            id = id,
            document = matchedDocuments?.getOrNull(index),
            metadata = matchedMetadatas?.getOrNull(index),
            distance = matchedDistances?.getOrNull(index),
        )
    }
}

fun defaultChromaHttpClient(): HttpClient =
    HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
    }

/**
 * Thin client over Chroma's v2 REST API: collection lookup, count, get-by-id/metadata, and
 * similarity `query` (via a query embedding produced by [EmbeddingClient], the same embedding
 * space data-service/ingest.py used to populate the collection).
 */
class ChromaClient(
    private val config: ChromaConfig = ChromaConfig.fromEnv(),
    private val httpClient: HttpClient = defaultChromaHttpClient(),
) {
    private fun collectionsUrl(): String = "${config.baseUrl}/api/v2/tenants/${config.tenant}/databases/${config.database}/collections"

    suspend fun findCollectionByName(name: String): ChromaCollection? {
        val collections: List<ChromaCollection> = httpClient.get(collectionsUrl()).body()
        return collections.find { it.name == name }
    }

    suspend fun count(collectionId: String): Long = httpClient.get("${collectionsUrl()}/$collectionId/count").body()

    suspend fun get(
        collectionId: String,
        ids: List<String>? = null,
        where: JsonElement? = null,
        limit: Int? = null,
    ): ChromaGetResponse =
        httpClient
            .post("${collectionsUrl()}/$collectionId/get") {
                contentType(ContentType.Application.Json)
                setBody(ChromaGetRequest(ids = ids, where = where, limit = limit))
            }.body()

    /**
     * Similarity/vector search (Chroma's `query` endpoint, as opposed to `get`). [queryEmbedding]
     * must come from the same embedding space as what's stored in the collection (see
     * [EmbeddingClient]). [where] is the same metadata filter shape [get] accepts, for combining
     * semantic search with structured amenity filters.
     */
    suspend fun query(
        collectionId: String,
        queryEmbedding: List<Double>,
        where: JsonElement? = null,
        nResults: Int = 10,
    ): ChromaQueryResponse =
        httpClient
            .post("${collectionsUrl()}/$collectionId/query") {
                contentType(ContentType.Application.Json)
                setBody(
                    ChromaQueryRequest(
                        query_embeddings = listOf(queryEmbedding),
                        n_results = nResults,
                        where = where,
                    ),
                )
            }.body()
}
