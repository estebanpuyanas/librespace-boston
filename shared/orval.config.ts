import { defineConfig } from 'orval';

// Generates a typed TS client (types + axios calls) from the Ktor backend's
// OpenAPI contract. Consumed by both webclient and mobile. Never hand-edit
// files under generated/ — re-run `npm run generate --workspace=shared`
// whenever backend/openapi.yaml changes.
export default defineConfig({
  librespace: {
    input: '../backend/openapi.yaml',
    output: {
      target: './generated/index.ts',
      client: 'axios',
      mode: 'single',
    },
  },
});
