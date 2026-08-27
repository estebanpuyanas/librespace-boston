# LibreSpace Boston

A situational, multi-constraint assistant for finding free places to be in
Boston (see `spec.md` for the full product spec, dataset list, and
hackathon constraints). This README covers the infra: how the repo is laid
out and how to run it.

---

## Architecture Overview

```
librespace-boston/
├── Makefile
├── podman-compose.yml   # infra only: ramalama, chroma
├── ramalama/            # Containerfile for the RamaLama LLM container
├── backend/             # Kotlin + Ktor API (its own Gradle root)
├── shared/              # generated TS client (from backend/openapi.yaml), consumed by webclient + mobile
├── webclient/           # React 19 + Vite frontend
├── mobile/              # Expo (React Native + TypeScript), managed workflow
├── data-service/        # Python + uv (one-time ETL + Chroma ingestion, not a running service)
└── package.json         # npm workspaces: webclient, mobile, shared
```

Two build systems, tied together by `Makefile`:

- **npm workspaces** (root `package.json`) for `webclient`, `mobile`, `shared`.
- **Gradle**, rooted inside `backend/` (not at the repo root, since `backend`
  is the only JVM piece, so it owns its own `settings.gradle.kts`).

`data-service` is managed by `uv` and isn't part of either. It's a batch
job you run before the demo, not a live dependency.

---

## Why Kotlin backend + React Native mobile

This deviates from a fully-Kotlin-multiplatform setup on purpose: the team's
mobile experience is React Native, and Expo's managed workflow (Expo Go)
avoids needing a Mac/Xcode build for the demo. Since mobile isn't JVM,
Kotlin Multiplatform's shared-DTO trick doesn't pay off. Instead,
`backend/openapi.yaml` is the single source of truth, and `shared/`
generates a typed TS client from it (via `orval`) for both `webclient` and
`mobile` to consume.

---

## OpenAPI Specification

`backend/openapi.yaml` is the language-agnostic HTTP contract for the API,
with every endpoint and request/response shape described with OpenAPI 3.1.
It's the single source of truth `shared/`'s generated client is built from
(see `shared/README.md`). Add every new endpoint here first, then implement
it in `backend/`, then regenerate:

```bash
npm run generate --workspace=shared
```

`POST /api/query` (spec.md section 8) is fully specified and fully
implemented. The structured path (location + optional radius/amenities →
ranked spots + highlights) never touches an LLM. When `query` is present,
the backend also: embeds it and re-ranks the structurally-filtered spots by
similarity against ChromaDB (see `ChromaClient.kt`, `EmbeddingClient.kt`);
detects its language and translates to English via the local chat LLM; and
synthesizes a grounded `answer`, in the user's language, citing which
retrieved spot/dataset field backs each claim, flagging any requested
attribute the data can't confirm in `disclaimers` (see `LlmClient.kt`,
`backend/src/main/kotlin/com/librespaceboston/Query.kt`).

---

## Data layer

The 5 Analyze Boston source datasets are committed under `data-service/raw/`
(no download step needed). `data-service/etl.py` joins them into
`output/spots.json` (spec.md section 7): a small, read-mostly,
batch-computed index, so the backend still just loads it into memory at
startup rather than storing it in a database. `data-service/ingest.py`
embeds a generated natural-language description per spot into ChromaDB for
the semantic layer (spec.md section 16). See `data-service/README.md` for
how to run both.

Postgres (Neon, remote-hosted, via `DATABASE_URL` in `backend/.env`) backs
data that isn't ETL output: `devices`, `favorites` (anonymous per-device
saved spots; identity is a client-generated `X-Device-Id` header, no
login/signup), and `friend_codes`/`friendships`/`shared_spots` (mutual
friending by short code + poll-based spot sharing). Exposed (Kotlin SQL DSL)
and HikariCP handle the connection; schema is created idempotently at
startup (`SchemaUtils.create`), no separate migration step. See
`backend/src/main/kotlin/com/librespaceboston/Database.kt`, `Favorites.kt`,
and `Friends.kt` (see AGENTS.md's "Common Gotchas" for the friend-code and
friendship table design rationale).

---

## Frontend Architecture (webclient)

```
services/ → hooks/ → components/
```

**`services/`**: thin wrappers around Axios. No state, no React. Returns
typed data or throws.

**`hooks/`**: own all state and side effects for a feature. Call services,
return state + setters to components.

**`components/`**: call a hook, render the result. No direct API calls, no
business logic. Each component folder pairs `index.tsx` + `index.css`.

`mobile/` follows the same `services/` pattern (see `mobile/services/api.ts`)
so both frontends can share the same mental model even though they can't
share component code.

The Home page (`webclient/src/components/Home/`) is mobile-first, single
column by default, with a `min-width: 1024px` layout in its `index.css`
that puts the hero and search side by side and splits results into a
featured-spot column plus a card grid of alternatives, rather than just
stretching the mobile column wider. A `ResultViewToggle` lets results
render as that list or as a Leaflet/OpenStreetMap `SpotMap`
(`webclient/src/components/SpotMap/`) of the same data, with distinct
markers for the search location, the featured spot, and alternatives.

---

## CSS Strategy (webclient)

`webclient/src/index.css` defines the design token system as CSS custom
properties: light/dark themes via `data-theme` on `<html>`, spacing/type/
radius/shadow/z-index tokens, and reusable classes (`.btn`, `.input`,
`.card`, `.badge`, `.spinner`, `.error-message`). Component CSS files add
only component-specific rules, using the tokens via `var(--...)`.

All dimension tokens (widths, spacing, font sizes) are `rem`, not `px`, so
the layout scales correctly under browser zoom or an increased base font
size. Accessibility is handled at the token/global level rather than
per-component: WCAG AA contrast (`--fs-muted`, `--text-muted`,
`--error-color`, border tokens, and a `--fs-green`/`--fs-green-text` split
for legible selected-filter text in dark mode), global `:focus-visible`
outlines, a `prefers-reduced-motion` override for transitions/animations, a
`--touch-target` (2.75rem/44px) token applied to interactive elements, and a
skip-to-content link. An in-header "larger text" toggle
(`webclient/src/utils/textSize.ts`, `data-text-size` on `<html>`) mirrors the
theme toggle and drives the large-text rules in `index.css`.

---

## Backend Architecture (backend/)

Kotlin + Ktor, single Gradle module. `Application.kt` owns server setup,
CORS, and routing (`/health`, `/api/ping`, `POST /api/query`); `LlmConfig.kt`
is env-driven config for the local LLM setup below; `Spots.kt` loads
`data-service/output/spots.json` into memory and ranks by haversine
distance; `Query.kt` holds the `/api/query` request/response models and the
query-handling logic (`buildQueryResponse`): language detection/translation
via `LlmClient.kt`, then semantic re-ranking against the translated text via
`ChromaClient.kt`/`EmbeddingClient.kt`, then grounded `answer` synthesis via
`LlmClient.kt`, all only when `query` is present. Route handlers stay
HTTP-only: no business logic past the route, same layering discipline as
any other backend.

### LLM strategy

RamaLama (local, `qwen2.5:7b`) is the only LLM backend for this event; no
hosted cloud fallback. Served by the `ramalama` container at
`localhost:8080`, OpenAI-compatible API, used for query understanding,
grounded synthesis, and translation. `LlmClient.kt` is a thin wrapper over
its `/v1/chat/completions` endpoint; see AGENTS.md's "Common Gotchas" for
the local-model quirks (slow CPU inference, occasionally malformed JSON
output) worth knowing before changing the synthesis prompts.

RamaLama, not Ollama: this hackathon is Red Hat-hosted, and RamaLama is Red
Hat's own model runner (it requires Podman specifically; Docker can't grant
it the privileges it needs at runtime).

---

## Testing Strategy

Backend tests use Ktor's `testApplication` test host and `kotlin.test`; run them with
`cd backend && ./gradlew test`. Web component tests use Vitest and Testing Library; run
them with `npm test --workspace=webclient`.

---

## Running Locally

**Prerequisites:** JVM 21+ (Gradle itself is _not_ required: `backend/gradlew`
is self-contained and downloads its own pinned Gradle on first run), Node
18+, `uv`, Podman + `podman-compose`.

Run `make help` (or bare `make`) at any point to list every available
target with a one-line description.

### 1. Clone and enter the repo

```bash
git clone <repo-url> && cd librespace-boston
```

### 2. Copy environment files

Copy each `.env.example` to `.env` in the package that needs it, and do this
**before** running anything, since `backend/.env`'s `PORT=8081` is what keeps
the Ktor server off RamaLama's port (8080):

```bash
cp backend/.env.example backend/.env
cp webclient/.env.example webclient/.env
cp mobile/.env.example mobile/.env
cp data-service/.env.example data-service/.env
```

| Variable                            | Where                               | Purpose                                                                   |
| ----------------------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `PORT`                              | `backend/.env`                      | Port the Ktor server listens on (8081, not 8080, which RamaLama uses)     |
| `CLIENT_URL`                        | `backend/.env`                      | CORS origin (default `http://localhost:5173`)                             |
| `RAMALAMA_URL` / `RAMALAMA_MODEL`   | `backend/.env`                      | Local LLM config                                                          |
| `CHROMA_URL`                        | `backend/.env`, `data-service/.env` | Vector search                                                             |
| `EMBEDDING_URL` / `EMBEDDING_MODEL` | `backend/.env`                      | `ramalama-embeddings` container, used to embed `/api/query` text          |
| `SPOTS_DATA_PATH`                   | `backend/.env`                      | Path to `output/spots.json` (default `../data-service/output/spots.json`) |
| `VITE_API_URL`                      | `webclient/.env`                    | Backend URL for Axios                                                     |
| `EXPO_PUBLIC_API_URL`               | `mobile/.env`                       | Backend URL for the RN app                                                |

Note: unlike Node/Vite/Expo/Python, the JVM doesn't auto-load `.env` files.
`backend/`'s `.env` is read via `dotenv-kotlin` (see `Env.kt`), falling back
to it only when a real environment variable isn't already set. If `PORT` is
unset or non-numeric, the backend refuses to start rather than silently
defaulting to 8080 (which would collide with RamaLama); see
`resolvePort()` in `Application.kt`.

### 3. Install dependencies

```bash
make setup   # npm install (webclient/mobile/shared) + gradle deps + uv sync
```

### 4. Start infra containers

```bash
make infra-up   # ramalama (localhost:8080) + ramalama-embeddings (localhost:8180) + chroma (localhost:8000)
```

First run pulls/builds the RamaLama image and, if the model volume doesn't
already exist, downloads `qwen2.5:7b` (~4.5GB); do this on a good connection
before the hackathon, not Saturday morning.

### 5. Run the ETL (one-time, before you need real data)

```bash
make ingest   # joins the 5 datasets, embeds spot descriptions into chroma
```

### 6. Run the app, each in its own terminal

```bash
make backend-dev   # Ktor, http://localhost:8081, continuous reload
make web-dev        # Vite dev server, http://localhost:5173
make mobile-dev      # Expo dev server (scan the QR code with Expo Go)
```

| Service             | URL                     |
| ------------------- | ----------------------- |
| Backend             | `http://localhost:8081` |
| Web                 | `http://localhost:5173` |
| RamaLama            | `http://localhost:8080` |
| RamaLama Embeddings | `http://localhost:8180` |
| Chroma              | `http://localhost:8000` |

### Podman

```bash
make infra-up    # podman-compose up -d
make infra-down  # podman-compose down (keeps the model volume)
make clean       # podman-compose down -v (wipes it; re-downloads qwen2.5:7b next time)
```

`podman-compose.yml` pins an explicit `name: librespace-boston` so
container/volume names stay stable regardless of clone path; without it, a
differently-named clone gets a fresh, empty model volume, which looks like a
silent re-download.

---

## Adding a New Feature

1. **Add the endpoint** to `backend/openapi.yaml` first.
2. **Implement it** in `backend/src/main/kotlin/com/librespaceboston/`.
3. **Regenerate the shared client**: `npm run generate --workspace=shared`.
4. **Add a service** in `webclient/src/services/` and/or `mobile/services/`.
5. **Add a hook** in `webclient/src/hooks/` (webclient only; mobile has no
   hooks layer yet, add one if the pattern is worth carrying over).
6. **Add a component**: `webclient/src/components/<Name>/index.{tsx,css}`,
   or the equivalent screen in `mobile/`.
7. **Add a route** in `webclient/src/App.tsx`.
8. **Add backend tests** in `backend/src/test/kotlin/`.
