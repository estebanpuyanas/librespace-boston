# shared

Generated TypeScript client for the Kotlin/Ktor backend. Nothing in this
package is hand-authored except `orval.config.ts` and this file.

The backend is not TypeScript, so there's no ambient-type-sharing trick
available here instead, `backend/openapi.yaml` is the single source of
truth, and `orval` generates a typed axios client (types + call functions)
from it. `webclient` and `mobile` both depend on `shared` and import
directly from the generated output.

## Regenerating

```bash
npm run generate --workspace=shared
```

Run this after any change to `backend/openapi.yaml`. `generated/` is
gitignored — it's fully reproducible from the committed spec file, so it's
never committed itself.
