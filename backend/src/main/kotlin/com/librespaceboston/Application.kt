package com.librespaceboston

import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.calllogging.CallLogging
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.routing
import kotlinx.serialization.json.Json

/**
 * `PORT` has no safe fallback: `podman-compose.yml` maps the `ramalama` container to host port
 * 8080, so silently defaulting to 8080 here just moves the failure to whichever process binds
 * second, surfacing as a bare `BindException` with no hint of the real cause. Fail loudly
 * instead and point at the fix.
 */
fun resolvePort(rawPortValue: String?): Int =
    rawPortValue?.toIntOrNull() ?: error(
        "PORT is not set or not a valid integer (got: ${rawPortValue ?: "<unset>"}). " +
            "Run `cp backend/.env.example backend/.env` and keep PORT=8081 - the unset/default " +
            "value of 8080 collides with the ramalama container's host port in podman-compose.yml.",
    )

fun main() {
    val port = resolvePort(envVar("PORT"))
    embeddedServer(Netty, port = port, host = "0.0.0.0", module = Application::module).start(wait = true)
}

fun Application.module(
    spotsRepository: SpotsRepository =
        SpotsRepository.loadFromFile(
            envVar("SPOTS_DATA_PATH")?.takeIf { it.isNotBlank() } ?: "../data-service/output/spots.json",
        ),
    chromaClient: ChromaClient = ChromaClient(),
    embeddingClient: EmbeddingClient = EmbeddingClient(),
) {
    install(ContentNegotiation) {
        json(Json { ignoreUnknownKeys = true })
    }
    install(CallLogging)
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respondText(
                text = "Internal error: ${cause.message}",
                status = HttpStatusCode.InternalServerError,
            )
        }
    }
    install(CORS) {
        val clientUrl = envVar("CLIENT_URL") ?: "http://localhost:5173"
        allowHost(clientUrl.removePrefix("http://").removePrefix("https://"))
        allowMethod(io.ktor.http.HttpMethod.Get)
        allowMethod(io.ktor.http.HttpMethod.Post)
        allowHeader(io.ktor.http.HttpHeaders.ContentType)
    }

    routing {
        get("/health") {
            call.respondText("""{"status":"ok"}""", ContentType.Application.Json)
        }
        // Scaffolding smoke test for the openapi -> Kotlin route -> generated client round trip.
        // Remove once a real /api endpoint exists.
        get("/api/ping") {
            call.respondText("""{"message":"Hello, world!"}""", ContentType.Application.Json)
        }
        post("/api/query") {
            val request = call.receive<QueryRequest>()
            call.respond(buildQueryResponse(request, spotsRepository, chromaClient, embeddingClient))
        }
    }
}
