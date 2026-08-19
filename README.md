# FreeSpace Boston

A situational, multi-constraint assistant for finding free places to be in
Boston — see `spec.md` for the full product spec, dataset list, and
hackathon constraints. This README covers the infra: how the repo is laid
out and how to run it.

---

## Architecture Overview

```
freespace-boston/
├── Makefile
├── podman-compose.yml   # infra only: ramalama, chroma
├── ramalama/            # Containerfile for the RamaLama LLM container
├── backend/             # Kotlin + Ktor API — its own Gradle root
├── shared/              # generated TS client (from backend/openapi.yaml), consumed by webclient + mobile
├── webclient/           # React 19 + Vite frontend
├── mobile/              # Expo (React Native + TypeScript), managed workflow
├── data-service/        # Python + uv — one-time ETL + Chroma ingestion, not a running service
├── testing/
│   └── cypress/         # Cypress E2E tests for the full stack
└── package.json         # npm workspaces: webclient, mobile, shared
```

Two build systems, tied together by `Makefile`:
- **npm workspaces** (root `package.json`) for `webclient`, `mobile`, `shared`.
- **Gradle**, rooted inside `backend/` (not at the repo root — `backend` is
  the only JVM piece, so it owns its own `settings.gradle.kts`).

`data-service` is managed by `uv` and isn't part of either — it's a batch
job you run before the demo, not a live dependency.

---

## Why Kotlin backend + React Native mobile

This deviates from a fully-Kotlin-multiplatform setup on purpose. Mobile
needs both iOS and Android; the team's existing mobile experience is React
Native, and RN + Expo (managed workflow, Expo Go) avoids needing a Mac/Xcode
build at all for the demo. Since mobile isn't JVM, there's no payoff to
Kotlin Multiplatform's shared-DTO trick — instead, `backend/openapi.yaml` is
the single source of truth, and `shared/` generates a typed TS client from
it (via `orval`) for both `webclient` and `mobile` to consume. Backend stays
Kotlin/Ktor regardless, for JVM performance and because that's the
preferred language for this side of the stack.

---

## OpenAPI Specification

`backend/openapi.yaml` is the language-agnostic HTTP contract for the API —
every endpoint, request/response shape, described with OpenAPI 3.1. It's
the single source of truth `shared/`'s generated client is built from (see
`shared/README.md`). Add every new endpoint here first, then implement it in
`backend/`, then regenerate:

```bash
npm run generate --workspace=shared
```

The real `/api/query` contract (spec.md section 8) is intentionally not
defined yet — that's part of Saturday's build, once the joined spots index
and the query pipeline's shape are settled. Only `/health` exists so far,
proving the full pipeline (backend route → openapi.yaml → generated client →
webclient/mobile import) end-to-end.

---

## Data layer

There's no database in this stack. `data-service/etl.py` joins the 5
Analyze Boston datasets into `output/spots.json` (spec.md section 7) — a
small, read-mostly, batch-computed index — so the backend just loads it into
memory at startup rather than standing up Postgres/Mongo for a few hundred
rows. `data-service/ingest.py` embeds a generated natural-language
description per spot into ChromaDB for the semantic layer (spec.md section
16). See `data-service/README.md` for how to run both.

---

## Frontend Architecture (webclient)

```
services/ → hooks/ → components/
```

**`services/`**: thin wrappers around Axios. No state, no React. Returns
typed data or throws.

**`hooks/`**: own all state and side effects for a feature. Call services,
return state + setters to components. (Currently empty — the posts/auth
example hooks were stripped; add feature hooks here as you build.)

**`components/`**: call a hook, render the result. No direct API calls, no
business logic. Each component folder pairs `index.tsx` + `index.css`.

`mobile/` follows the same `services/` pattern (see `mobile/services/api.ts`)
so both frontends can share the same mental model even though they can't
share component code.

---

## CSS Strategy (webclient)

`webclient/src/index.css` defines the design token system as CSS custom
properties — light/dark themes via `data-theme` on `<html>`, spacing/type/
radius/shadow/z-index tokens, and reusable classes (`.btn`, `.input`,
`.card`, `.badge`, `.spinner`, `.error-message`). Component CSS files add
only component-specific rules, using the tokens via `var(--...)`.

---

## Backend Architecture (backend/)

Kotlin + Ktor, single Gradle module. Currently just `Application.kt` (server
setup, CORS, `/health`) and `LlmConfig.kt` (env-driven config for the
hosted/local LLM split below) — the `routing/ → services/ → models/`
layering from spec.md's query pipeline (section 8) gets built out Saturday
once the endpoint contracts exist.

### LLM strategy

Two backends, tried in order (`LlmConfig.kt`):
1. **Hosted (Claude API)** — primary, for query understanding, grounded
   synthesis, and translation quality. Set `ANTHROPIC_API_KEY`.
2. **RamaLama (local, `llama3.2:3b`)** — fallback when there's no API key or
   the venue connection drops. Served by the `ramalama` container at
   `localhost:8080`, OpenAI-compatible API.

RamaLama, not Ollama: this hackathon is Red Hat-hosted, and RamaLama is Red
Hat's own model runner (it requires Podman specifically — Docker can't grant
it the privileges it needs at runtime).

---

## Testing Strategy

### E2E — `testing/cypress/`

Cypress, against the real running app. `e2e/auth.cy.ts` and `e2e/posts.cy.ts`
are leftover from the template's example domain and need real specs once
there's an actual UI to test — not touched in this infra pass.

### Backend

`backend/src/test/kotlin/` — Ktor's `testApplication` test host + `kotlin.test`.
Run: `cd backend && ./gradlew test`.

---

## Running Locally

**Prerequisites:** JVM 21+, Node 18+, `uv`, Podman + `podman-compose`.

```bash
make setup       # npm install + gradle deps + uv sync
make infra-up    # start ramalama + chroma containers
make backend-dev # ./gradlew run --continuous
make web-dev     # vite dev server
make mobile-dev  # expo start
```

Backend: `http://localhost:8081`
Web: `http://localhost:5173`
RamaLama: `http://localhost:8080`
Chroma: `http://localhost:8000`

### Environment Variables

Copy each `.env.example` to `.env` in the package that needs it:

| Variable | Where | Purpose |
|---|---|---|
| `PORT` | `backend/.env` | Port the Ktor server listens on (8081) |
| `CLIENT_URL` | `backend/.env` | CORS origin (default `http://localhost:5173`) |
| `ANTHROPIC_API_KEY` | `backend/.env` | Hosted LLM (primary) — leave blank to force RamaLama |
| `RAMALAMA_URL` / `RAMALAMA_MODEL` | `backend/.env` | Local LLM fallback |
| `CHROMA_URL` | `backend/.env`, `data-service/.env` | Vector search |
| `VITE_API_URL` | `webclient/.env` | Backend URL for Axios |
| `EXPO_PUBLIC_API_URL` | `mobile/.env` | Backend URL for the RN app |

### Podman

```bash
make infra-up    # podman-compose up -d
make infra-down  # podman-compose down (keeps the model volume)
make clean       # podman-compose down -v (wipes it — re-downloads llama3.2:3b next time)
```

`podman-compose.yml` pins an explicit `name: freespace-boston` so container
and volume names stay stable regardless of clone path or directory name on
either teammate's machine — without it, podman-compose derives that prefix
from the working directory, which is why porting a RamaLama container
between differently-named project dirs looks like it silently re-downloads
the model: it's actually just a fresh, differently-named volume.

---

## Adding a New Feature

1. **Add the endpoint** to `backend/openapi.yaml` first.
2. **Implement it** in `backend/src/main/kotlin/com/freespaceboston/`.
3. **Regenerate the shared client**: `npm run generate --workspace=shared`.
4. **Add a service** in `webclient/src/services/` and/or `mobile/services/`.
5. **Add a hook** in `webclient/src/hooks/` (webclient only — mobile has no
   hooks layer yet, add one if the pattern is worth carrying over).
6. **Add a component** — `webclient/src/components/<Name>/index.{tsx,css}`,
   or the equivalent screen in `mobile/`.
7. **Add a route** in `webclient/src/App.tsx`.
8. **Add backend tests** in `backend/src/test/kotlin/`.
9. **Add an E2E spec** in `testing/cypress/e2e/`.
