package com.librespaceboston

/**
 * RamaLama (local, `qwen2.5:7b`) is the only LLM backend for this event — no hosted
 * cloud fallback — used for query understanding, grounded synthesis, and translation.
 * See spec.md sections 8-9.
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
                ramalamaModel = envVar("RAMALAMA_MODEL") ?: "qwen2.5:7b",
            )
    }
}
