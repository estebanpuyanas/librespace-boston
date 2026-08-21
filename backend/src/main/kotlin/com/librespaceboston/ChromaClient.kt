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

/**
 * Not referenced anywhere in backend/src today - CHROMA_URL was dead in .env.example before
 * this. Configures the reusable Chroma v2 REST client; wiring it into a live route (e.g.
 * POST /api/query) is separate follow-up work.
 */
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

fun defaultChromaHttpClient(): HttpClient =
    HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
    }

/**
 * Thin client over Chroma's v2 REST API (collection lookup, count, get-by-id/metadata).
 * Deliberately does NOT implement Chroma's similarity/vector `query` endpoint - that needs a
 * query embedding generated the same way data-service/ingest.py does (sentence-transformers'
 * all-MiniLM-L6-v2, 384-dim), and there's no JVM-native equivalent wired up. See the comment
 * on `query` below for where that plugs in.
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

    // Similarity/vector search (Chroma's `query` endpoint, as opposed to `get`) is out of
    // scope here - it requires a query embedding vector generated the same way
    // data-service/ingest.py does (sentence-transformers' all-MiniLM-L6-v2, 384-dim), and
    // choosing how to produce a compatible embedding from Kotlin (call out to a small
    // embedding service, port the model via ONNX Runtime, etc.) is a real RAG-architecture
    // decision for hackathon day. It would plug in here as a POST to
    // "${collectionsUrl()}/$collectionId/query" with a body of
    // {"query_embeddings": [[<384 floats>]], "n_results": N}.
}
