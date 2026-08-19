# AGENTS.md

Guidance for AI agents (and humans) working on this codebase.
Read this before making any changes.

---

## Project at a Glance

Full-stack TypeScript monorepo with three workspaces:

| Workspace | Path | Role |
|---|---|---|
| `shared` | `shared/` | TypeScript type definitions — the API contract |
| `server` | `server/` | Node.js + Express REST API + Socket.io |
| `client` | `client/` | React 19 + Vite SPA |

Tests live in `testing/backend/` (Jest) and `testing/cypress/` (Cypress E2E).

---

## Essential Commands

Always run from the **repo root** unless specified otherwise.

```bash
# Install everything (all workspaces)
npm install

# Build shared types (required before client or server will compile)
npm run build --workspace=shared

# Start server + client in parallel (requires shared to be built first)
npm run dev

# Backend unit tests
npm run test:unit

# E2E tests (client + server must be running)
npm run test:e2e

# Lint the whole monorepo
npm run lint

# Auto-fix lint errors
npm run lint:fix

# Format with Prettier
npm run format

# Seed the local database
cd server && npm run seed

# Wipe the local database
cd server && npm run seed:delete

# Start everything via Docker (no local Node needed)
npm run docker:up
npm run docker:down
```

Type-checking without building:
```bash
npx tsc --noEmit          # server
npm run type-check --workspace=client
```

---

## Architecture Rules

These are invariants. Do not break them.

### Shared types
- Every new domain entity needs a type file in `shared/types/`.
- Follow the `Base → Database → Populated → Request → Response` hierarchy.
- `Populated*` types are what the API returns — nested objects, never raw ObjectIds.
- `SafeDatabaseUser` (no password) is the only user type that ever leaves the server.
- After adding or changing a shared type, rebuild: `npm run build --workspace=shared`.

### OpenAPI spec
- `server/openapi.yaml` must stay in sync with the actual controllers.
- Add every new endpoint and schema to the spec **before or alongside** writing the controller.
- `express-openapi-validator` validates all `/api/*` requests at runtime — the spec is enforced, not just documentation.
- Test routes (`/api/test/*`) and `/health` are excluded from validation via `ignorePaths`.

### Backend layers
- **Controllers** (`server/src/controllers/`) — HTTP only. Parse `req`, call one or more services, emit socket events, return `res`. Zero business logic.
- **Services** (`server/src/services/`) — business logic only. No `req`, no `res`, no socket references. Pure functions that take typed arguments and return typed data.
- **Models** (`server/src/models/`) — Mongoose schema + model export. No logic.
- If you need to add logic that touches a model, it goes in a service, not a controller and not a model file.

### Frontend layers
- **Services** (`client/src/services/`) — Axios calls only. No state, no hooks, no React. Returns typed data or throws.
- **Hooks** (`client/src/hooks/`) — own state and side effects. Call services, set up socket listeners, return state + action handlers.
- **Components** (`client/src/components/`) — call a hook, render the result. No direct API calls.
- Never fetch data inside a component body — always go through a hook.

### CSS
- `client/src/index.css` owns all design tokens as CSS custom properties. Never introduce a new hardcoded color, spacing value, or z-index in a component file — use a `var(--...)` instead.
- Each component folder gets its own `index.css` scoped to that component's class names.
- Dark theme is handled entirely via `[data-theme='dark']` overrides in `index.css`. No JS-in-CSS, no inline styles for theming.

---

## Style Guide

### TypeScript
- Prefer `interface` over `type` for object shapes; use `type` for unions, aliases, and primitives.
- Do not use `any`. Use `unknown` and narrow, or use specific generics.
- Prefix unused function parameters with `_` (`_req`, `_res`) to satisfy the no-unused-vars rule.
- Use `as const` for literal objects and arrays that shouldn't be widened.
- Cast with `as SomeType` only at trust boundaries (e.g. Mongoose `.lean()` return values). Never cast through `any`.

### Naming
- Files: `kebab-case.ts` for utilities and services; `PascalCase/index.tsx` for React components.
- React components: `PascalCase`.
- Hooks: `useCamelCase`.
- Services: `camelCase` functions in a `camelCase.service.ts` file.
- Controllers: `camelCaseController` factory function in `camelCase.controller.ts`.
- CSS classes: `kebab-case`, prefixed with the component name (e.g. `.post-card-header`).
- Types: `PascalCase`. Enums: `SCREAMING_SNAKE_CASE` values.

### Async / error handling
- Prefer `async/await` over raw Promise chains everywhere.
- In controllers, wrap every route handler body in `try/catch` and return a typed error response.
- In services, let errors propagate — the controller catches and converts them to HTTP responses.
- Fire-and-forget calls (activity tracker, non-critical side effects) use `.catch(() => {})` to silence unhandled rejections — this is intentional, not a bug.

### Comments
- Write a comment only when the **why** is non-obvious. "What" is expressed by names.
- Never write multi-line docblocks. One short line is the maximum.
- Do not comment out code and commit it. Delete it.

### React
- Function components only (exception: `ErrorBoundary`, which must be a class).
- Always clean up `useEffect` side effects — return a cleanup function to remove socket listeners, clear intervals, and abort fetch requests.
- Do not use `useEffect` to derive state from other state — compute it inline or use `useMemo`.
- `useCallback` is only needed when passing a function as a prop to a memoised child or as a `useEffect` dependency.

---

## Adding a New Feature — Checklist

Follow this order; CI will catch you if you skip a step.

1. `shared/types/<domain>.d.ts` — base, database, populated, request, response types
2. `server/openapi.yaml` — add paths and schemas for every new endpoint
3. `server/src/models/schema/<domain>.schema.ts` — Mongoose schema
4. `server/src/models/<domain>.model.ts` — Mongoose model
5. `server/src/services/<domain>.service.ts` — business logic
6. `server/src/controllers/<domain>.controller.ts` — HTTP handlers
7. `server/src/app.ts` — register the new controller
8. `shared/types/socket.d.ts` — add event types if using real-time
9. `client/src/services/<domain>Service.ts` — Axios wrappers
10. `client/src/hooks/use<Domain>.ts` — state + socket listeners
11. `client/src/components/<Domain>/` — `index.tsx` + `index.css`
12. `client/src/App.tsx` — add route
13. `testing/backend/tests/` — controller spec + service spec
14. `testing/cypress/e2e/<domain>.cy.ts` — E2E spec
15. `server/src/seedData/populateDB.ts` — add seed data
16. `server/src/controllers/test.controller.ts` — seed the new collection

---

## Testing Conventions

### Backend (Jest)
- All mock data lives in `testing/backend/tests/mockData.models.ts`. Never define fixtures inline in a spec.
- Controller specs mock `auth.middleware` and `activityTracker.middleware` so they test HTTP wiring only.
- Service specs mock Mongoose models with `jest.spyOn(Model, 'method')`. No HTTP, no middleware.
- Middleware, jobs, and utils have their own spec files.
- Use `jest.useFakeTimers()` for any test involving `setInterval` or `setTimeout`.

### E2E (Cypress)
- Call `setupTest()` in `beforeEach` and `teardownTest()` in `afterEach`. This calls `POST /api/test/seed` and `POST /api/test/cleanup` — only available when `NODE_ENV=test`.
- Use `cy.login()` (the custom command, not the UI helper) for tests that don't specifically test authentication.
- Data-cy attributes (`data-cy="post-title"`) are the preferred selectors. Avoid selecting by text when the element is interactive.

---

## Key Files Quick Reference

| What you want to change | File |
|---|---|
| Add/modify a shared type | `shared/types/<domain>.d.ts` |
| Add an API endpoint | `server/openapi.yaml` + `server/src/controllers/<domain>.controller.ts` |
| Add business logic | `server/src/services/<domain>.service.ts` |
| Change a DB schema | `server/src/models/schema/<domain>.schema.ts` |
| Add a background job | `server/src/jobs/<name>.job.ts` + register in `server/src/server.ts` |
| Add Express middleware | `server/src/middleware/<name>.middleware.ts` + mount in `server/src/app.ts` |
| Add a frontend page | `client/src/components/<Page>/index.tsx` + route in `client/src/App.tsx` |
| Change the global design token | `client/src/index.css` under `:root` |
| Change the dark theme | `client/src/index.css` under `[data-theme='dark']` |
| Add a shared socket event | `shared/types/socket.d.ts` |
| Add a seed user or post | `server/src/seedData/populateDB.ts` + `server/src/controllers/test.controller.ts` |
| Change CI behaviour | `.github/workflows/ci.yml` |

---

## Common Gotchas

- **Build order matters.** `shared` must be compiled before `client` or `server` will typecheck. Run `npm run build --workspace=shared` after any change to `shared/types/`.
- **`express-openapi-validator` rejects before your handler runs.** If a request returns 400 unexpectedly, check the spec first — the body or query params may not match `openapi.yaml`. Validation errors have an `errors` array in the response body.
- **Test routes only exist in `NODE_ENV=test`.** If Cypress tests fail with 404 on `/api/test/seed`, make sure the server was started with `NODE_ENV=test`.
- **Socket listeners must be cleaned up.** Every `socket.on(...)` in a `useEffect` must have a matching `socket.off(...)` in the cleanup function, or you'll accumulate duplicate listeners on re-mount.
- **`lean()` strips Mongoose document methods.** After `.lean<T>()`, the result is a plain object typed as `T`. This is intentional — it's faster and safe for read paths. Do not call `.save()` on a lean result.
- **`ErrorBoundary` is a class component.** This is a React constraint, not a bug. Do not convert it to a function component.
- **Dark theme is CSS-only.** `applyTheme()` sets `data-theme` on `<html>`. Everything else is handled by CSS variable overrides in `index.css`. Do not conditionally render different components for light/dark.
