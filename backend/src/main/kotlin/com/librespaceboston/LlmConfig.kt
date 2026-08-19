package com.librespaceboston

/**
 * Two LLM backends, tried in order: a hosted API for quality (query understanding,
 * grounded synthesis, translation), falling back to a local RamaLama container when
 * no API key is configured or the venue connection drops. See spec.md sections 8-9.
 */
data class LlmConfig(
    val anthropicApiKey: String?,
    val ramalamaUrl: String,
    val ramalamaModel: String,
) {
    val hasHostedLlm: Boolean get() = !anthropicApiKey.isNullOrBlank()

    companion object {
        fun fromEnv(): LlmConfig =
            LlmConfig(
                anthropicApiKey = envVar("ANTHROPIC_API_KEY"),
                ramalamaUrl = envVar("RAMALAMA_URL") ?: "http://localhost:8080",
                ramalamaModel = envVar("RAMALAMA_MODEL") ?: "llama3.2:3b",
            )
    }
}
