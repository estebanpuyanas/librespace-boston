# Roadmap — Track B (Experience/Accessibility)

Prioritization for hackathon day. Every item below is scored on:

- **Impact** how much it moves the Track B rubric (conversational UX,
  visual answers, progressive disclosure, multilingual, accessibility,
  personalization, trust/transparency, mobile-first) or product quality.
- **Complexity** implementation effort given the current stack
  (React 19/Vite webclient, Expo mobile, Ktor backend, no database, no
  auth system, ~4.5hr build window).

Sorted into four quadrants. On hacking day: clear **Quick Wins** first,
then pull from **Major Projects** as time allows, use **Fill-ins** as
gap-filler polish, and only reach for **Cut First** if there's spare
capacity don't start there.

---

## Quick Wins — High impact, low complexity (do these first)

| Item                                                                          | Rubric tie-in                                  | Why it's cheap                                                                                                                                                |
| ----------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Semantic HTML, logical heading order, full tab order, skip-to-content link    | Accessibility ("full keyboard navigation")     | Structural discipline while building components, not a bolt-on                                                                                                |
| Visible focus indicators everywhere                                           | Accessibility                                  | Just don't strip `outline` in CSS resets                                                                                                                      |
| Never encode meaning by color alone (icons/text alongside up/down, red/green) | Accessibility, Trust                           | Add a label/icon next to existing color-coded stats                                                                                                           |
| In-app text-size control                                                      | Accessibility ("large text options")           | One toggle driving a root font-size CSS variable                                                                                                              |
| `prefers-reduced-motion` support                                              | Accessibility                                  | One media query wrapping existing chart/transition animations                                                                                                 |
| Layout survives 200% zoom (relative units)                                    | Accessibility                                  | Cheap if done from the start; expensive to retrofit — do it now                                                                                               |
| Touch target sizing (≥44×44px), thumb-reach spacing                           | Mobile-First, Accessibility                    | CSS sizing pass on interactive elements                                                                                                                       |
| ARIA live region on the chat feed (throttled, not per-token)                  | Conversational UX, Accessibility               | One wrapper component around the message list                                                                                                                 |
| PWA manifest + basic service worker (installable web app)                     | Mobile-First, bonus ("responsive or PWA")      | Vite has first-party PWA plugin support                                                                                                                       |
| "Share this answer" via clipboard/native share sheet of formatted text        | Bonus                                          | No persisted link needed — no DB, so don't build a link-shortener                                                                                             |
| Source + "last updated" badge on every answer                                 | Trust & Transparency (explicit rubric example) | Requires the ETL to carry dataset name + freshness per record — decide the `spots.json` schema early, surfacing it in the UI is trivial once the data's there |
| Accessibility audit (axe-core/Lighthouse run) + one-page findings doc         | Bonus ("accessibility audit documentation")    | Automated tools do the work; just commit the report                                                                                                           |

---

## Major Projects. High impact, high complexity (do next, as time allows)

| Item                                                                               | Rubric tie-in                                           | Why it's expensive                                                                                                                                         |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conversational UX: follow-ups, clarifications, "tell me more about that"           | Conversational UX (explicit #1 ask)                     | Needs multi-turn context handling in the query pipeline, not just a chat-styled single-shot Q&A                                                            |
| Visual answers: charts/maps generated from query results (e.g. 311 heatmap)        | Visual Answers (explicit rubric example)                | Mapping library integration + geodata handling + chart generation from arbitrary query shapes                                                              |
| Text-equivalent / data table alongside every chart or map                          | Accessibility + Visual Answers together                 | Every new visualization needs a parallel non-visual representation — doubles the work per chart type                                                       |
| Progressive disclosure: simple answer first, tap for details/breakdown             | Progressive Disclosure (explicit rubric example)        | Requires structuring every answer as summary + expandable detail, which shapes the response schema                                                         |
| i18n scaffolding for UI chrome + language switcher (2+ languages)                  | Multilingual, bonus ("supporting at least 2 languages") | Touches every component with hardcoded strings; CJK font fallback needed if Chinese is one of the languages                                                |
| Personalization: "My neighborhood" (client-side saved address, "what's near me")   | Personalization (explicit rubric example)               | No auth/user system by design (`AGENTS.md`) — must be a localStorage-only preference, plus geolocation/address input UI and location-based filtering logic |
| Mobile-first responsive pass across the whole app (not just individual components) | Mobile-First (explicit rubric category)                 | A full layout/interaction rethink, not a single CSS tweak — bottom-anchored input, safe-area insets, etc.                                                  |

---

## Fill-ins — Lower impact, low complexity (gap-filler polish)

| Item                                                     | Rubric tie-in                        | Notes                                                                                           |
| -------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| CJK font fallback check                                  | Multilingual                         | Only matters if Chinese is one of the demoed languages — verify the font stack doesn't tofu-box |
| No keyboard traps in modals/panels, `Escape` closes them | Accessibility                        | Quick to fix once any modal exists                                                              |
| Visible transcript for any voice output                  | Accessibility (deaf/hard-of-hearing) | Only relevant once voice output exists — see Cut First below                                    |

---

## Cut First — Lower impact relative to cost, or dependent on other work (skip if short on time)

| Item                                                        | Rubric tie-in                           | Why it's lower priority                                                                                                                                                                                                   |
| ----------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Voice input/output (Web Speech API)                         | Bonus ("voice input/output capability") | Browser support is inconsistent (notably Firefox), needs mic permission flows, and mobile (Expo) needs a separate implementation path — high effort for a bonus-only item                                                 |
| Full native Expo mobile parity/polish alongside the web app | Mobile-First                            | A well-built responsive PWA satisfies the "mobile-first"/"works on a phone" ask more cheaply than maintaining true native parity in the build window — treat native mobile as a stretch demo, not the primary deliverable |
