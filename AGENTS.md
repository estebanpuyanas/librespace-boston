# AGENTS.md

Guidance for AI agents (and humans) working on this codebase.
Read this before making any changes. See also `spec.md` (product spec,
hackathon constraints) and `README.md` (fuller architecture rationale).

---

## Project at a Glance

| Workspace      | Path            | Role                                                       | Build tool                       |
| -------------- | --------------- | ---------------------------------------------------------- | -------------------------------- |
| `backend`      | `backend/`      | Kotlin + Ktor API                                          | Gradle (own root, not repo-root) |
| `shared`       | `shared/`       | Generated TS client from `backend/openapi.yaml`            | npm                              |
| `webclient`    | `webclient/`    | React 19 + Vite SPA                                        | npm                              |
| `mobile`       | `mobile/`       | Expo (React Native + TS), managed workflow                 | npm                              |
| `data-service` | `data-service/` | One-time Python ETL + Chroma ingestion, not a live service | uv                               |

`webclient`, `mobile`, `shared` are one npm workspace (root `package.json`).
`backend` is a separate Gradle root. `data-service` is a separate `uv`
project. `Makefile` ties all three build tools together.

There is no database. The ETL's output (`data-service/output/spots.json`) is
small and read-mostly, backend loads it into memory rather than standing up
Postgres/Mongo.

---

## Essential Commands

```bash
make setup        # npm install + gradle deps + uv sync
make infra-up     # podman-compose up -d (ramalama + chroma)
make backend-dev  # ./gradlew run --continuous (backend/)
make web-dev      # vite dev server (webclient/)
make mobile-dev   # expo start (mobile/)
make generate     # regenerate shared/ TS client from backend/openapi.yaml
make ingest       # run the one-time ETL + Chroma ingestion (data-service/)
make test         # gradle test
make lint         # ktlintCheck + eslint
```

Type-checking without building:

```bash
cd webclient && npx tsc --noEmit
cd mobile && npx tsc --noEmit
```

---

## Architecture Rules

### The OpenAPI contract comes first

- `backend/openapi.yaml` is the single source of truth. Add every new
  endpoint and schema here **before or alongside** writing the Ktor route.
- After any change to it, regenerate: `npm run generate --workspace=shared`.
- Never hand-edit `shared/generated/` it's gitignored and fully
  reproducible from the spec.
- CI (`.github/workflows/ci.yml`) regenerates the client and typechecks
  `webclient`/`mobile` against it on every push/PR that's the real gate
  against drift. `make setup` also points git at `.githooks/` (pre-commit
  validates the spec parses if it's staged; post-merge auto-regenerates
  after a pull that touches it) as a local convenience, not a substitute
  for CI.

### Backend (Kotlin/Ktor)

- Routes stay HTTP-only, business logic goes in a services layer, no
  `req`/`call` object leaks past the route handler.
- `LlmConfig.kt` encodes local-only LLM config: RamaLama (`RAMALAMA_URL`,
  `RAMALAMA_MODEL`, served by the `ramalama` container) is the only backend
  for this event, no hosted cloud tier. Always route through this config.

### Frontend (webclient + mobile)

- **Services** (`webclient/src/services/`, `mobile/services/`): Axios calls
  only. No state, no hooks, no React/RN. Returns typed data or throws.
- **Hooks** (`webclient/src/hooks/`): own state and side effects. Call
  services, return state + action handlers. (Currently empty post-strip —
  add feature hooks as you build.)
- **Components** (`webclient/src/components/`): call a hook, render the
  result. No direct API calls. Each folder pairs `index.tsx` + `index.css`.
- There is no auth/user system in this product (spec.md has no accounts) —
  don't reintroduce JWT/login/UserContext patterns from the original
  template; they were deliberately stripped.

### CSS (webclient)

- `webclient/src/index.css` owns all design tokens as CSS custom properties.
  Never introduce a new hardcoded color, spacing value, or z-index in a
  component file use `var(--...)`.
- Dark theme is `[data-theme='dark']` overrides in `index.css`, toggled via
  `webclient/src/utils/theme.ts`. CSS-only — no conditional rendering for
  theming.

### data-service (Python/uv)

- One-time batch job (`etl.py` then `ingest.py`), not a live path. Never add
  a live HTTP server here if the backend needs to talk to it at query time,
  that's a design mistake per spec.md section 6 (every query needs the same
  fused index, not a per-request call to a separate service).
- `torch` is pinned as a **direct** dependency in `pyproject.toml` even
  though it's really needed by `sentence-transformers` — `tool.uv.sources`
  overrides only apply to direct dependencies, and the override is what
  forces the CPU-only build (see the comment in `pyproject.toml`). If you add
  a new dependency that pulls torch back in as CUDA, re-check
  `.venv` size (`du -sh data-service/.venv` should be ~1.5GB, not ~5GB).

---

## Style Guide

### TypeScript

- Prefer `interface` over `type` for object shapes; `type` for unions,
  aliases, primitives.
- No `any`. Use `unknown` and narrow, or specific generics.
- Prefix unused function parameters with `_`.
- Cast with `as SomeType` only at trust boundaries. Never cast through `any`.

### Kotlin

- `ktlintCheck` (`./gradlew ktlintCheck` inside `backend/`) is the formatting
  authority — don't hand-tune formatting against it.
- Prefer `data class` for DTOs, `@Serializable` (kotlinx.serialization) for
  anything crossing the HTTP boundary.

### Naming

- TS files: `kebab-case.ts` for utilities/services; `PascalCase/index.tsx`
  for React components. Hooks: `useCamelCase`.
- Kotlin files: `PascalCase.kt`, one primary class/object per file matching
  the filename.
- CSS classes: `kebab-case`, prefixed with the component name.

### Comments

- Write a comment only when the **why** is non-obvious. Never multi-line
  docblocks, one short line max. Don't comment out code and commit it.

### React

- Function components only (exception: `ErrorBoundary`, must stay a class).
- Always clean up `useEffect` side effects.
- `useEffect` is not for deriving state from other state, compute inline or
  `useMemo`.

---

## Adding a New Feature — Checklist

1. `backend/openapi.yaml` add paths and schemas first.
2. `backend/src/main/kotlin/com/librespaceboston/` implement the route +
   whatever service/model layer it needs.
3. `npm run generate --workspace=shared` regenerate the TS client.
4. `webclient/src/services/` and/or `mobile/services/` typed wrappers.
5. `webclient/src/hooks/use<Feature>.ts` state + side effects (webclient).
6. `webclient/src/components/<Feature>/` index.tsx`+`index.css`.
7. `webclient/src/App.tsx` add the route.
8. `backend/src/test/kotlin/` test the new route.

---

## Common Gotchas

- **Two build systems, two "roots."** `backend/` has its own Gradle root
  (`settings.gradle.kts` lives there, not at the repo root) `cd backend`
  before any `./gradlew` command, or use the `Makefile` targets.
- **`shared/generated/` doesn't exist until you generate it.** Fresh clone →
  `npm install` does **not** auto-generate it. Run
  `npm run generate --workspace=shared` (needs `backend/openapi.yaml` to
  exist, which it does just needs to be current for whatever you're
  building against).
- **RamaLama vs Ollama.** The `ramalama` container pulls
  `ollama://qwen2.5:7b` — that's RamaLama's syntax for sourcing a model from
  Ollama's library, not Ollama itself. Don't add an `ollama` service; RamaLama
  already serves an OpenAI-compatible API on port 8080.
- **Mobile is pinned to port 8082.** The Ktor backend listens on 8081
  (`backend/openapi.yaml`'s `servers` entry) and Expo also defaults to 8081,
  so running `make backend-dev` and `make mobile-dev` together collides.
  `mobile/package.json`'s `start`/`android`/`ios`/`web` scripts pass
  `--port 8082` to avoid the interactive "use another port?" prompt.
- **`chromadb` client and the `chroma` container image must be version-matched.**
  `data-service/pyproject.toml` pins the `chromadb` Python client; `podman-compose.yml`
  pins the `chroma` server image to the same version (currently `1.5.9`). A mismatch
  (e.g. client `1.5.x` against server `0.5.x`) fails collection creation with
  `KeyError('_type')` — bump both together.
- **`ChromaClient.kt` (`backend/src/main/kotlin/com/librespaceboston/`) talks to Chroma's
  v2 REST API and is wired into `POST /api/query`'s semantic path (`Query.kt`'s
  `buildQueryResponse`).** Collection lookup, `count`, `get` (by id or metadata `where`
  filter), and similarity `query` are all supported. Query embeddings come from
  `EmbeddingClient.kt`, which calls a *second*, separate RamaLama container
  (`ramalama-embeddings` in `podman-compose.yml`, `ollama://all-minilm`, port 8180,
  `EMBEDDING_URL`/`EMBEDDING_MODEL` in `.env.example`) — not the `qwen2.5:7b` chat
  container. That model needs `--runtime-args=--embeddings` (the `=` form; a separate
  `--runtime-args --embeddings` token pair gets misparsed) or its `/v1/embeddings`
  endpoint 501s. Its 384-dim output is empirically confirmed compatible with what
  `data-service/ingest.py` (sentence-transformers `all-MiniLM-L6-v2`) already pushed into
  Chroma. When `query` is absent from the request, none of this runs — the endpoint stays
  on the pure structured geo/amenity path over `SpotsRepository`, unchanged. Tests
  (`ChromaClientTest.kt`, `ApplicationTest.kt`) use Ktor's `MockEngine` against
  hand-written fake Chroma/RamaLama responses — same hermetic-fixture precedent as
  `SpotsRepository.loadFromResource`, since CI doesn't run podman/Chroma/RamaLama.
  LLM-synthesized answers (translation, grounded citation) are still not implemented —
  that's separate follow-up work layered on top of this retrieval path.
- **Podman project name is pinned.** `podman-compose.yml` has an explicit
  `name: librespace-boston`. Don't remove it — without it, container/volume
  names derive from the clone directory name, and the model volume silently
  becomes a new (empty) one on a differently-named clone.
- **`data-service/` is not a running service.** Despite the name, it's a
  batch job (`make ingest`). Nothing else depends on it being "up."
- **Backend refuses to start with an unset/invalid `PORT`.** No silent
  fallback to 8080 (that's RamaLama's port) — `resolvePort()` in
  `Application.kt` fails loudly and points at `backend/.env.example`.
- **Dark theme is CSS-only.** `webclient/src/utils/theme.ts` just sets
  `data-theme` on `<html>` — everything else is CSS variable overrides in
  `index.css`.
- **The generated client is routed through `shared/mutator.ts`, not bare
  axios.** `orval.config.ts` configures every generated call to go through
  `customInstance`, which reads its base URL from a module-level axios
  instance. Each app calls `setApiBaseUrl(...)` once at startup
  (`webclient/src/services/axios.ts`, `mobile/services/api.ts`) don't
  create a second, parallel axios instance for API calls; import
  `getLibreSpaceBostonAPI` from `shared` instead.
- **Mobile resolves the backend host automatically on a physical device.**
  `EXPO_PUBLIC_API_URL` defaults to `localhost`, which on a real phone means
  the phone itself, not your laptop. `mobile/services/api.ts` falls back to
  deriving the LAN IP from Expo's own dev-server host
  (`Constants.expoConfig.hostUri`) when the env var isn't set explicitly
  no manual `.env` editing needed per teammate/laptop.
- **If venue wifi blocks phone-to-laptop LAN traffic** (AP isolation is
  common on campus/conference networks), `npx expo start --tunnel` routes
  through Expo's relay instead of the LAN — slower, but works when direct
  connection doesn't.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
