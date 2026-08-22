package com.librespaceboston

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/**
 * Config for the `ramalama-embeddings` container (podman-compose.yml) — a second, separate
 * RamaLama instance serving `ollama://all-minilm` with `--runtime-args=--embeddings`. Distinct
 * from LlmConfig/RAMALAMA_URL: different container, different model, different port, used only
 * to embed retrieval text, never for chat/synthesis.
 */
data class EmbeddingConfig(
    val baseUrl: String,
    val model: String,
) {
    companion object {
        fun fromEnv(): EmbeddingConfig =
            EmbeddingConfig(
                baseUrl = envVar("EMBEDDING_URL") ?: "http://localhost:8180",
                model = envVar("EMBEDDING_MODEL") ?: "all-minilm",
            )
    }
}

@Serializable
data class EmbeddingRequest(
    val model: String,
    val input: String,
)

@Serializable
data class EmbeddingDatum(
    val embedding: List<Double>,
)

@Serializable
data class EmbeddingResponse(
    val data: List<EmbeddingDatum>,
)

fun defaultEmbeddingHttpClient(): HttpClient =
    HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
    }

/**
 * Calls RamaLama's OpenAI-compatible `/v1/embeddings` endpoint (same request family as the
 * chat completions call in LlmConfig, but a different container/model). Produces 384-dim
 * vectors empirically confirmed compatible with what data-service/ingest.py already pushed
 * into Chroma (sentence-transformers all-MiniLM-L6-v2) — cosine similarity 0.9999989 between
 * a stored embedding and a fresh embedding of the same text via this model.
 */
class EmbeddingClient(
    private val config: EmbeddingConfig = EmbeddingConfig.fromEnv(),
    private val httpClient: HttpClient = defaultEmbeddingHttpClient(),
) {
    suspend fun embed(text: String): List<Double> {
        val response: EmbeddingResponse =
            httpClient
                .post("${config.baseUrl}/v1/embeddings") {
                    contentType(ContentType.Application.Json)
                    setBody(EmbeddingRequest(model = config.model, input = text))
                }.body()
        return response.data.first().embedding
    }
}
