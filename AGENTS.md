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

The ETL's output (`data-service/output/spots.json`) is small and read-mostly,
so the backend still loads it into memory rather than storing it in Postgres.
Postgres (Neon, remote-hosted, `DATABASE_URL` in `backend/.env`) exists for
data that isn't ETL output: `devices`, `favorites` (anonymous per-device
saved spots — see `backend/src/main/kotlin/com/librespaceboston/Favorites.kt`),
and `friend_codes`/`friendships`/`shared_spots` (mutual friending by short
code + poll-based spot sharing, no push notifications — see `Friends.kt`).
Schema is created idempotently at startup via Exposed's `SchemaUtils.create`,
not a separate migration step.

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
  services, return state + action handlers.
- **Components** (`webclient/src/components/`): call a hook, render the
  result. No direct API calls. Each folder pairs `index.tsx` + `index.css`.
- There is no auth/user system in this product (spec.md has no accounts) —
  don't reintroduce JWT/login/UserContext patterns from the original
  template; they were deliberately stripped. Identity for favorites is a
  client-generated, persistent per-device UUID sent as `X-Device-Id` and
  trusted as-is (no verification) — not a security boundary, an accepted
  hackathon-demo tradeoff. The backend auto-registers the device on first
  use; there's no separate signup call.

### CSS (webclient)

- `webclient/src/index.css` owns all design tokens as CSS custom properties.
  Never introduce a new hardcoded color, spacing value, or z-index in a
  component file use `var(--...)`.
- Dark theme is `[data-theme='dark']` overrides in `index.css`, toggled via
  `webclient/src/utils/theme.ts`. CSS-only — no conditional rendering for
  theming.
- All dimension tokens in `index.css` (widths, spacing, font sizes) are `rem`,
  not `px`, so the layout scales under browser zoom/text-size increases. Keep
  new tokens in `rem` too.
- Text-size ("larger text") toggle mirrors the theme toggle: `data-text-size`
  attribute on `<html>`, set via `webclient/src/utils/textSize.ts`, with the
  actual font-size bump living in `index.css` (`html[data-text-size='large']`).
- `--fs-green` is for button backgrounds paired with white text; `--fs-green-text`
  is the separate token for green _text/borders_ on a themed surface (filter
  pill "selected" state, alt-number label). They're intentionally split because
  one green can't satisfy both "readable text on a dark surface" and "readable
  white text on top of it" in dark mode — don't collapse them back into one
  token when touching filter/selection styles.
- Interactive elements use `--touch-target` (2.75rem / 44px) for min height/width
  — required for touch accessibility. Any new button/pill/icon-control should
  use it too.

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
  `EmbeddingClient.kt`, which calls a _second_, separate RamaLama container
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
- **`SpotsRepository.nearby()` (`Spots.kt`) falls back to the closest spots when
  the requested radius finds none, rather than returning empty.** The spots
  dataset only covers Boston proper, and `radius_meters` defaults to 800m
  (webclient never overrides it; mobile does, but only up to 3000m — still well
  short of Boston-to-Cambridge), so an origin outside that coverage (e.g.
  Cambridge, across the Charles) would otherwise silently return zero spots on
  both `/api/query` paths. `Query.kt`'s `buildQueryResponse` detects the fallback
  (first spot's distance exceeds the requested radius) and adds
  `OUT_OF_COVERAGE_DISCLAIMER`. Don't reintroduce a hard-cutoff-only version of
  `nearby()` without preserving this fallback.
  Language detection/translation and grounded `answer` synthesis (also in `Query.kt`, via
  `LlmClient.kt`) are layered on top of this retrieval path — see the `LlmClient.kt` entry
  below for the local-model behavior to expect.
- **`LlmClient.kt` calls the `qwen2.5:7b` chat container's OpenAI-compatible
  `/v1/chat/completions` (`RAMALAMA_URL`/`RAMALAMA_MODEL` from `LlmConfig`), used by
  `Query.kt` for two calls per `query`-present request: language detection+translation,
  then grounded answer synthesis.** No hosted/cloud branch — `LlmConfig.hasHostedLlm`/
  `anthropicApiKey` are unused leftovers, not a real fallback. Two behaviors observed
  live against the real container worth knowing before touching this code: (1) a local
  CPU-served 7B model is slow — a synthesis call grounded in several spots' worth of JSON
  took ~40s; CIO's engine-level default request timeout (15s, independent of the
  `HttpTimeout` plugin) is well under that, so `defaultLlmHttpClient()` raises it
  explicitly — don't remove that override. (2) the model doesn't reliably follow a
  "respond with a JSON string" instruction for `answer` and sometimes emits a JSON array
  of sentence fragments instead — parsing goes through `RawSynthesisResult.answer` as a
  `JsonElement` and flattens either shape, rather than trusting the shape the prompt asked
  for. Both LLM calls are wrapped in try/catch (same pattern as `rankBySemanticRelevance`)
  so a slow/unreachable/malformed-output model degrades to `disclaimers` explaining
  synthesis is unavailable, never a 500.
- **Friend codes live in their own `friend_codes` table, not a column on
  `devices`.** `AppDatabase.connect()` only calls `SchemaUtils.create`, which
  creates missing tables but never alters existing ones — adding a column to
  the already-shipped `devices` table wouldn't reach rows created before the
  change on the live Neon DB. `friendships` stores one row per direction
  (both `(a,b)` and `(b,a)`) so `listFriends`/`areFriends` stay plain
  equality lookups instead of needing an OR'd pair comparison.
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
- **`shared/mutator.ts`'s axios `timeout` covers the slow LLM-synthesis path.**
  It's one shared client for every generated call, so its timeout has to
  accommodate `POST /api/query`'s `query`-present path (~25-40s against the
  local CPU-served model, see the `LlmClient.kt` entry above) even though
  every other call is fast — don't lower it back toward a "normal" API
  timeout without giving that path its own per-request override instead.
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
