# FreeSpace Boston — Proposed Track B Roadmap

## Track decision

**We are building for Track B: The Experience.**

Our primary demo surface is the native Expo mobile app. The web app remains a helpful laptop/testing companion, but it must not take priority over a reliable, delightful phone experience.

## Product goal

Make the answer to this question feel immediate and trustworthy:

> “I need somewhere free to go right now.”

FreeSpace should turn a resident’s situation into a clear, grounded recommendation: where to go, why it fits, how far away it is, and which Boston public data supports each claim.

## Current foundation

- Five Analyze Boston datasets are fused into a real index of **577 public spaces**.
- The backend already supports nearby search, distance ranking, and factual amenity filtering.
- The web and mobile clients have a polished starting experience.
- The remaining product work is natural-language RAG, reliable mobile connectivity, trust details, and progressive disclosure.

---

## Phase 1 — Make the live demo reliable

**Goal:** A phone can retrieve and display real nearby places from the backend.

- [ ] Keep Android emulator → Expo → backend connectivity stable.
- [ ] Connect mobile search to the live `/api/query` response.
- [ ] Confirm the backend loads the generated 577-space index every time it starts.
- [ ] Verify three rehearsed live queries near known Boston locations.
- [ ] Preserve the mobile demo-data fallback, but visibly label it as demo data.

**Done when:** A teammate can open the Android app and get real nearby results without manual debugging.

---

## Phase 2 — Build the grounded RAG answer

**Goal:** The user can ask naturally; FreeSpace answers only from retrieved city data.

- [ ] Extract structured needs from a request: location, Wi-Fi, seating, shade, accessibility, playground, restroom, time, language, and unsupported attributes.
- [ ] Retrieve factual matches before generating text.
- [ ] Rank by distance, required amenities, and tree-density shade signal.
- [ ] Generate a short answer from the top matches only.
- [ ] Return a clear “we cannot verify that from available data” response for unsupported asks such as quietness.
- [ ] Add citations for Wi-Fi, park features, accessibility, open space, and tree-based shade context.
- [ ] State clearly that public-tree counts are an approximate shade proxy, not verified canopy coverage.

**Done when:** “I need Wi-Fi and a place to sit near Downtown” returns a readable, cited recommendation rather than only a raw list.

---

## Phase 3 — Deliver the Track B experience

**Goal:** The app feels like something a Boston resident would want on their phone.

### Mobile result experience

- [ ] Lead with one simple best-match answer.
- [ ] Let users expand details, citations, accessibility notes, and alternatives.
- [ ] Show distance and walking time, not only straight-line distance.
- [ ] Add a small matched-results map with numbered pins after the written recommendation works.
- [ ] Add “share this answer.”
- [ ] Add a visible “Based on Boston public data” and freshness label.

### Accessibility first

- [ ] Screen-reader labels for every interactive control and result card.
- [ ] Minimum 44×44px touch targets.
- [ ] Large-text and high-contrast option.
- [ ] Never rely on color alone to communicate a result state.
- [ ] Reduced-motion support.
- [ ] Run and document a short accessibility audit.

### Multilingual support

- [ ] Test English + Spanish end-to-end.
- [ ] Support Vietnamese as best-effort with a machine-translation disclaimer.
- [ ] Keep place names, distances, and citation names unchanged across translations.

**Done when:** A non-technical resident can understand the answer, see why it is trustworthy, and use it without explanation.

---

## Phase 4 — Lightweight personalization

**Goal:** Make FreeSpace feel personal without spending hackathon time on authentication.

Store preferences locally on the device; do not build accounts/login.

- [ ] Onboarding: favorite needs (Wi-Fi, seating, shade, accessible routes, playground, restroom).
- [ ] Onboarding: preferred language.
- [ ] Ask for location permission with a clear explanation of the benefit.
- [ ] Always offer manual neighborhood/address search instead of requiring location.
- [ ] Save favorite spaces locally.
- [ ] Add a lightweight Saved/Profile section.
- [ ] Optional saved-space notes and collections: Study, With kids, Cooling off, Between appointments.

**Done when:** A returning user can find a saved or preference-matched place faster than a first-time user.

---

## Phase 5 — Only if time remains

- [ ] Opt-in notification preference screen.
- [ ] One contextual notification demo, such as “A saved free Wi-Fi spot is 8 minutes away.”
- [ ] Small UI language switcher.
- [ ] Web map and responsive polish.
- [ ] PWA installability, if the native mobile demo is already solid.

**Do not build for the first demo:** background location tracking, geofencing, full user accounts, calendar integration, turn-by-turn navigation, or voice features.

---

## Web companion — last priority

- [ ] Keep the redesigned web page functioning as a laptop demo and API test surface.
- [x] Live-data/testing panel removed post-hackathon (#39).
- [ ] Reuse the same citations, freshness text, and shade disclaimer from mobile.
- [ ] Do not introduce web-only features before the mobile flow is complete.

---

## Demo script to rehearse

1. A resident asks for a free place near Downtown with Wi-Fi and seating.
2. FreeSpace uses their location and returns a best match from real city data.
3. The user opens details to see amenities, accessibility, source citations, and the shade caveat.
4. The user views the small map, saves the place, and shares the answer.
5. Repeat a short answer in Spanish; show Vietnamese with the translation disclaimer if ready.

## Team decisions still needed

1. Which three exact live queries will we rehearse?
2. Which two languages are fully tested before the demo?
3. Who owns RAG/backend, mobile UX, and demo/presentation prep?
4. Do we build the simple map before saved places? **Recommended: yes, after reliable live results.**
