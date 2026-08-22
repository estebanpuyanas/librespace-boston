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

@Serializable
data class ChatMessage(
    val role: String,
    val content: String,
)

@Serializable
data class ChatCompletionRequest(
    val model: String,
    val messages: List<ChatMessage>,
    val temperature: Double = 0.0,
)

@Serializable
data class ChatCompletionChoice(
    val message: ChatMessage,
)

@Serializable
data class ChatCompletionResponse(
    val choices: List<ChatCompletionChoice>,
)

// A local, CPU-served 7B chat model is slow: a synthesis call grounded in several spots'
// worth of JSON was observed taking ~40s end to end. CIO's own engine-level default
// (independent of the HttpTimeout plugin) is 15s, well under that, so it must be raised
// explicitly or every real synthesis call times out and silently falls back to no answer.
private const val LLM_REQUEST_TIMEOUT_MILLIS = 120_000L

fun defaultLlmHttpClient(): HttpClient =
    HttpClient(CIO) {
        engine {
            requestTimeout = LLM_REQUEST_TIMEOUT_MILLIS
        }
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
    }

/**
 * Calls RamaLama's OpenAI-compatible `/v1/chat/completions` endpoint against the `qwen2.5:7b`
 * chat container configured by [LlmConfig] — a different container/model/port from
 * [EmbeddingClient]'s `ramalama-embeddings`. Local-only: [LlmConfig] has no hosted/cloud
 * fallback for this event, so there is no branch here for `anthropicApiKey`/`hasHostedLlm`.
 */
class LlmClient(
    private val config: LlmConfig = LlmConfig.fromEnv(),
    private val httpClient: HttpClient = defaultLlmHttpClient(),
) {
    suspend fun chat(
        systemPrompt: String,
        userPrompt: String,
        temperature: Double = 0.0,
    ): String {
        val response: ChatCompletionResponse =
            httpClient
                .post("${config.ramalamaUrl}/v1/chat/completions") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        ChatCompletionRequest(
                            model = config.ramalamaModel,
                            temperature = temperature,
                            messages =
                                listOf(
                                    ChatMessage(role = "system", content = systemPrompt),
                                    ChatMessage(role = "user", content = userPrompt),
                                ),
                        ),
                    )
                }.body()
        return response.choices.first().message.content
    }
}
