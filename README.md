# webapp-bootstrap

A production-grade full-stack web application template. Clone it, swap out the domain models (the "posts" example), and you have a working architecture ready to build on.

---

## Architecture Overview

```
webapp-bootstrap/
├── client/          React 19 + Vite frontend
├── server/          Node.js + Express backend (see "Backend Language" section to swap)
├── shared/          TypeScript types: a single source of truth for client + server
├── testing/
│   ├── backend/     Jest unit + integration tests for the server
│   └── cypress/     Cypress E2E tests for the full stack
├── docker-compose.yml
└── package.json     npm workspaces monorepo root
```

The monorepo uses **npm workspaces**. Running `npm install` at the root installs all packages. The `shared` workspace is built first because both `client` and `server` depend on its compiled types.

---

## OpenAPI Specification

`server/openapi.yaml` is the language-agnostic HTTP contract for the entire API. It describes every endpoint, query parameter, request body, and response shape using OpenAPI 3.1.

**Two uses:**

1. **Runtime validation** — mount `express-openapi-validator` in `app.ts` before your routers to reject malformed requests automatically:
   ```bash
   npm install express-openapi-validator --workspace=server
   ```
   ```ts
   // server/src/app.ts
   import { middleware as openApiValidator } from 'express-openapi-validator';
   app.use(openApiValidator({ apiSpec: './openapi.yaml', validateRequests: true, validateResponses: false }));
   ```

2. **Backend swap contract** — when you replace Node.js with another language, this file is the single source of truth. Generate server stubs from it:
   - Python: `openapi-generator-cli generate -i openapi.yaml -g python-fastapi`
   - Go: `oapi-codegen -generate gin -package api openapi.yaml`
   - Java: `openapi-generator-cli generate -i openapi.yaml -g spring`
   - Or generate a JSON Schema for runtime validation in any language:
     `npx ts-json-schema-generator --path 'shared/types/*.d.ts' --type '*'`

---

## Shared Types

`shared/types/` is the contract between frontend and backend. Every domain entity follows this hierarchy:

| Layer | Purpose | Example |
|---|---|---|
| `Base` | Plain data shape, no DB concerns | `Post` |
| `Database` | Stored document, ObjectId references | `DatabasePost` |
| `Populated` | API response, full nested objects | `PopulatedDatabasePost` |
| `Request` | Typed Express request | `CreatePostRequest` |
| `Response` | Union of success \| error | `PostResponse` |

**Rule:** the server returns `Populated*` types. Clients never see raw ObjectIds or password fields.

Socket events are typed via `ClientToServerEvents` and `ServerToClientEvents`, the same interfaces are applied to both `socket.io-client` (frontend) and `socket.io Server` (backend), so mismatched event names are caught at compile time.

---

## Frontend Architecture

```
services/ → hooks/ → components/
```

Each layer has exactly one responsibility:

**`services/`**: thin wrappers around Axios. No state, no React. Returns typed data or throws.

```ts
// postService.ts
export const getPosts = async (order: PostOrderType): Promise<PopulatedDatabasePost[]>
```

**`hooks/`**: own all state and side effects for a feature. Call services, manage socket listeners, return state + setters to components.

```ts
// usePosts.ts
const { posts, loading, setOrder, handleLike } = usePosts()
```

**`components/`**: call a hook, render the result. No direct API calls, no business logic.

```ts
// PostList/index.tsx
const { posts, loading } = usePosts()
return <ul>{posts.map(p => <PostCard post={p} />)}</ul>
```

Each component folder contains a paired `index.tsx` + `index.css`. The TSX is logic-free; the CSS is scoped to that component's class names.

**Context** (`contexts/UserContext.ts`) holds cross-cutting data, the authenticated user and the shared socket instance. Access it via the `useUserContext()` hook, never via prop drilling.

---

## CSS Strategy

`client/src/index.css` defines the entire design token system as CSS custom properties:

- **Light and dark themes**: swap by setting `data-theme="dark"` on `<html>`
- **Spacing, typography, border-radius, shadows, z-index layers**: all tokens, never magic numbers
- **Reusable classes**: `.btn`, `.input`, `.card`, `.badge`, `.spinner`, `.error-message` cover 90% of common UI needs
- **Responsive breakpoints**: documented at the bottom of `index.css` as comments; apply per-component with `@media`

Component-level CSS files add only component-specific rules. They use the global tokens via `var(--...)`.

---

## Backend Architecture

```
controllers/ → services/ → models/
```

**`controllers/`** handle HTTP only: parse `req`, call a service, emit a socket event, return `res`. No business logic.

**`services/`** contain all business logic. They take plain arguments and return typed data. No `req`/`res` objects anywhere.

**`models/`** define the Mongoose schema (`schema/*.ts`) and export the typed Model (`*.model.ts`). See `models/examples/` for equivalent schemas in SQL (Prisma) and GraphQL.

**Middleware** (`middleware/`) runs before protected route handlers:
- `auth.middleware.ts`: validates JWT, attaches `req.username / req.userId / req.role`
- `activityTracker.middleware.ts`: throttled last-seen updates (fire-and-forget, non-blocking)
- `rateLimit.middleware.ts`: in-memory sliding window; swap the store for Redis in production

**Jobs** (`jobs/`) are long-running background tasks started in `server.ts`. Each job returns a cleanup function called on `SIGTERM`. Jobs are skipped in `NODE_ENV=test` to avoid dangling timers.

**SeedData** (`seedData/`) bootstraps the database for local development:
- `populateDB.ts`: creates users, posts, etc. in dependency order
- `deleteDB.ts`: clears all collections
- `resolvers/`: translate string references (e.g. `authorUsername`) to ObjectIds after the referenced collection has been inserted
- `utils.ts` — `computeImportOrder()` does a topological sort of the dependency graph

**Scripts** (`scripts/`) are one-off tools: run once after a migration, then delete or archive.

---

## Testing Strategy

### Backend unit tests — `testing/backend/`

Uses **Jest** + **Supertest** + **ts-jest**. Two categories:

| Type | File pattern | Tools |
|---|---|---|
| Controller | `tests/controllers/*.spec.ts` | `supertest(app)` for real HTTP, `jest.spyOn(service)` to mock the service layer |
| Service | `tests/services/*.spec.ts` | `jest.spyOn(Model, 'find')` to mock Mongoose, no HTTP |


**Mock data** lives entirely in `tests/mockData.models.ts`. Never define fixtures inline in spec files, shared mocks keep IDs stable and relationships obvious.

Controller tests mock out `auth.middleware` so they test HTTP wiring, not JWT logic. Auth is tested in `tests/middleware/auth.middleware.spec.ts`.

Run: `cd testing/backend && npm test`

### E2E tests via `testing/cypress/`

Uses **Cypress**. Specs interact with the real running app (both client and server must be up).

- `helpers.ts` — `setupTest()` / `teardownTest()` hit a `/api/test/seed` endpoint (add one gated by `NODE_ENV=test`); `loginViaUI()`, `createPost()` drive the UI
- `commands.js` — `cy.login()` logs in via API request to bypass the UI for tests that aren't testing auth

Run: `cd testing && npm run test:open`

---

## Running Locally

**Prerequisites:** Node 18+, Docker

### Without Docker

```bash
# Install all workspace dependencies
npm install

# Build shared types first
npm run build --workspace=shared

# Start server and client in parallel
npm run dev
```

Server: `http://localhost:8000`  
Client: `http://localhost:5173`

Seed the database:
```bash
cd server && npm run seed
```

### With Docker

```bash
npm run docker:up
```

This starts MongoDB, the server, and the client. Data is persisted in a named Docker volume (`mongodb_data`).

```bash
npm run docker:down       # stop containers
docker volume rm webapp-bootstrap_mongodb_data  # wipe DB volume
```

### Environment Variables

Copy `.env.example` to `.env` in each package that needs it. Required variables:

| Variable | Where | Purpose |
|---|---|---|
| `MONGODB_URI` | `server/.env` | MongoDB connection string |
| `JWT_SECRET` | `server/.env` | Signing key for JWTs — use a strong random string in production |
| `CLIENT_URL` | `server/.env` | CORS origin (default: `http://localhost:5173`) |
| `VITE_API_URL` | `client/.env` | Backend URL for Axios |
| `VITE_SOCKET_URL` | `client/.env` | Backend URL for Socket.io |

---

## Adapting to a Different Backend Language

The backend is intentionally isolated, the frontend talks to it only over HTTP and WebSockets, and the contract is fully specified in `shared/types/`. Replacing the Node.js server with Python, Go, Java, or any other language requires only these changes:

### 1. Keep the shared type contract

`server/openapi.yaml` is the primary contract. Use it to generate server stubs in your target language (see the OpenAPI section above). The `shared/types/*.d.ts` files remain useful as TypeScript documentation for the frontend regardless of which backend you run.

### 2. Replicate the architectural layers

| Node layer | Python equivalent | Go equivalent |
|---|---|---|
| `controllers/` | FastAPI routers / Django views | `net/http` handlers or Gin routes |
| `services/` | Service classes / modules | Service structs with methods |
| `models/schema/` | SQLAlchemy models / Pydantic schemas | GORM structs / sqlc queries |
| `middleware/` | FastAPI dependencies / Django middleware | `http.Handler` wrappers |
| `jobs/` | APScheduler / Celery Beat | `time.Ticker` goroutines |
| `seedData/` | Alembic + seed fixtures | DB migration + seed script |

### 3. Replace Socket.io

Socket.io has clients for most languages. If your backend doesn't support it:
- Use plain WebSockets, the client already wraps socket events cleanly in hooks, so swapping the transport only touches `client/src/services/` and `client/src/App.tsx`
- Use SSE (Server-Sent Events) for one-way server→client pushes if you don't need bidirectional comms

### 4. Replace Mongoose schemas

See `server/src/models/examples/`:
- `prisma-sql/schema.prisma`, PostgreSQL via Prisma (works with any SQL DB)
- `graphql/schema.graphql`, GraphQL schema; also replaces the REST controllers

### 5. Update Docker

Replace `server/Dockerfile` and the `server` block in `docker-compose.yml` with your new runtime. The `client` and `mongodb` services remain unchanged.

### 6. Update backend tests

`testing/backend/` is Jest/Supertest — Node-specific. Replace it with your language's equivalent:
- Python: `pytest` + `httpx` (for async) or `requests` + `pytest-mock`
- Go: `testing` package + `net/http/httptest`
- Java: JUnit 5 + MockMvc / RestAssured

The E2E tests in `testing/cypress/` need no changesas they're fully language-agnostic.

---

## Adding a New Feature

Follow this checklist to keep the architecture consistent:

1. **Add types** to `shared/types/` — base, database, populated, request, response
2. **Add Mongoose schema + model** in `server/src/models/`
3. **Add service** in `server/src/services/` — pure functions, no HTTP
4. **Add controller** in `server/src/controllers/` — wire routes, call service, emit socket events
5. **Register controller** in `server/src/app.ts`
6. **Add socket events** to `shared/types/socket.d.ts` if needed
7. **Add service file** in `client/src/services/`
8. **Add hook** in `client/src/hooks/`
9. **Add component** folder with `index.tsx` + `index.css`
10. **Add route** in `client/src/App.tsx`
11. **Add backend tests** in `testing/backend/tests/`
12. **Add E2E tests** in `testing/cypress/e2e/`
13. **Add seed data** to `server/src/seedData/populateDB.ts`
