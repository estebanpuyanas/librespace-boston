# LibreSpace Boston — Project Specification

## 1. Problem statement

**"Where can I exist in Boston for a few hours without having to buy anything?"**

Boston is expensive. Students, teenagers, remote workers, recent immigrants, tourists,
low-income residents, and people between appointments often need somewhere to sit, use
Wi-Fi, cool down, charge a device, or access a restroom without buying a $7 coffee.

The assistant understands a _situational, multi-constraint_ request and combines
multiple independent public datasets into one practical, cited recommendation instead
of requiring a resident to cross-reference five separate city data sources themselves.

## 2. Example queries

- "I need a free place near Downtown where I can sit and use Wi-Fi."
- "Find a wheelchair-accessible outdoor space near Dorchester."
- "Where can I study outside in the shade?"
- "I have two hours before my appointment. Where can I go without spending money?"
- "Find somewhere with Wi-Fi and a playground so I can work while my child plays."
- "Explain my options in Vietnamese."

## 3. Why it stands out

Not a map of parks, not a Wi-Fi finder the assistant fuses five independent datasets
into one situational answer with per-claim source grounding:

> "Malcolm X Park is 0.4 miles away. It has accessible entrances, seating-related park
> features, nearby public Wi-Fi, and greater public-tree coverage than the other nearby
> option."

Boston publishes plenty of public resources; residents shouldn't need to understand five
government datasets to find a free place to sit.

## 4. Datasets (Analyze Boston / data.boston.gov)

| Dataset                                                                                           | Role                                                                                                                                    |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [Wicked Free Wi-Fi Locations](https://data.boston.gov/dataset/wicked-free-wifi-locations)         | Public Wi-Fi node locations                                                                                                             |
| [Open Space](https://data.boston.gov/dataset/open-space)                                          | Park / green-space polygons                                                                                                             |
| [Park Features](https://data.boston.gov/dataset/park-features)                                    | In-park amenities (seating, playgrounds, etc.)                                                                                          |
| [Accessible Park Details](https://data.boston.gov/dataset/bprd-accessible-park-details-augmented) | ADA accessibility attributes per park                                                                                                   |
| [Boston Public Trees](https://data.boston.gov/dataset/bprd-trees)                                 | Tree locations — used as an **approximate shade proxy**, not verified canopy data (flag this assumption explicitly, don't overstate it) |

## 5. Hackathon constraints — "RAG the City Hack," Aug 22, 2026

- Two tracks, one declared at 10:45am with **no switching**: Track A "The Engine" (RAG
  architecture) vs. Track B "The Experience" (UI/UX). Both scored on the same 16-point
  rubric; only one of the four criteria ("Track Excellence") differs by track.
- Shared requirements regardless of track: ingest 2+ Analyze Boston datasets, build a
  natural-language RAG pipeline, ground every answer in cited data, live demo.
- Build window: **10:45am–3:15pm (~4.5 hrs)**. Code freeze 3:15pm. Round 1 demos
  3:30–5:00pm. Top 2 per track advance to a head-to-head final at 5:10pm.
- Submission requires: public repo, 2-minute demo video, declared track, list of ≥2
  datasets used.
- **Track fit:** this project supports either track — the 5-dataset spatial join and
  multi-constraint reasoning is a legitimate Track A "multi-source RAG" story; the
  mobile-first, accessibility-forward, multilingual UX is a strong Track B story.
  Recommend deciding the declaration based on which half of the build is further along
  by roughly 1pm on the day, not in advance.

## 6. Core technical challenge

This is **not** a topic-routing problem (route to 1-of-N datasets based on question
topic). Every query needs the _same_ five datasets fused together, filtered by location
and amenity constraints, then ranked and explained. The architecture is therefore:

1. A **one-time ETL** that joins all five sources into a single "spots" index.
2. A **per-query pipeline** that extracts structured constraints from the question and
   filters/ranks that index reaching for semantic/vector search only on genuinely
   fuzzy attributes (e.g. "quiet," "peaceful") that have no direct field.

## 7. Data layer — one-time ETL

Run once (ideally before Saturday, once datasets are downloaded), not per-query. Output:
a single joined "spots" table, one row per point of interest:

```
spot_id, name, lat, lon
has_wifi          (bool — proximity join to Wicked Free Wi-Fi)
is_park           (bool — from Open Space)
features          (seating / playground / restroom / shade_structure — Park Features)
accessible        (bool + notes — Accessible Park Details)
tree_density_nearby (count within N meters — shade proxy, from Public Trees)
source_dataset    (per field, for citation)
```

Spatial join approach: nearest-neighbor / within-radius joins on lat/lon
(`geopandas` + `shapely`, or JTS if staying entirely on the JVM). Inspect and rerun as
needed this is a batch job, not a live path, so get it right in prep, not on the day.

## 8. Query pipeline (per request)

1. **Query understanding** (one LLM call): detect language, translate to English,
   extract structured constraints location/neighborhood or device geolocation, time
   budget if given, required amenities (Wi-Fi, shade, accessible, playground, restroom,
   free-by-default). Explicitly flag any requested attribute with no matching field
   (e.g. "quiet") as unsupported rather than guessing.
2. **Geo-filter**: resolve location to a radius, filter the joined index to candidates
   within it.
3. **Constraint filter/rank**: hard-filter on boolean amenity flags (structured filter
   no embeddings needed); rank on fuzzy proxies (e.g. "shade" → `tree_density_nearby`).
4. **Grounded synthesis**: generate the answer in English, citing which dataset backs
   each claim, and say plainly when a requested attribute isn't something the data can
   confirm.
5. **Translate back** to the user's detected language, leaving place names, distances,
   and citations untouched.

## 9. Multilingual handling

- Single English-only retrieval/join index; translation happens only at the query and
  answer edges.
- Tier your language support honestly: fully validate English + Spanish before the
  event; treat others (Vietnamese, etc.) as best-effort with a visible
  "machine-translated verify details" disclaimer. An honest tiered approach scores
  better under Track B's "Trust & Transparency" criterion than silent underperformance
  in a less-tested language.
- Test the actual target languages named in your own demo script (Vietnamese) against
  the chosen model before Saturday don't assume quality.

## 10. Repo layout (monorepo)

```
librespace-boston/
├── Makefile
├── docker-compose.yml        # infra only — chroma, ollama
├── settings.gradle.kts       # root Gradle multi-module build
├── backend/                  # Ktor API, client-facing
├── shared/                   # plain Kotlin/JVM: DTOs used by backend + mobile
├── mobile/                   # Android, Kotlin (+ Compose if team is comfortable)
├── webclient/                # React + TypeScript
└── data-service/             # optional — see Section 11, Option B
```

`shared` is included in `settings.gradle.kts` alongside `backend` and `mobile`, so all
three build under one Gradle invocation. `webclient` (and `data-service`, if used) sit
outside Gradle — Make is the top-level layer that ties everything together.

## 11. Language/framework choices

- **Backend:** Kotlin + **Ktor** (not Spring faster cold start, less reflection,
  native fit with `kotlinx.serialization`).
- **Shared module:** plain Kotlin/JVM, not full Kotlin Multiplatform. Android already
  runs JVM bytecode, so a shared `@Serializable` DTO module gives type-safety between
  backend and mobile without KMP tooling. Full KMP would add real complexity for no
  payoff here, since the web client is React/TS, not Kotlin/JS save it for if iOS is
  ever added.
- **Mobile:** Android, Kotlin. Compose is recommended for speed, but only if the
  teammate is already comfortable in it. Use **Ktor Client** for HTTP same library
  and serializer as the backend, one dependency graph instead of two.
- **Web:** React + TypeScript.
- **Data/ETL two viable forks:**
  - **Option A all-Kotlin.** Backend performs the spatial join itself via JTS, calls
    Ollama/Chroma directly over their HTTP APIs. One language, one deploy unit, no
    cross-service boundary during the demo.
  - **Option B split.** A separate `data-service/` (Python + geopandas/shapely +
    LangChain/Chroma) does the one-time ETL and hosts retrieval; the Kotlin backend
    proxies to it. Only worth the extra moving part if someone is meaningfully faster in
    Python specifically for the geospatial join.
  - **Recommendation:** decide based on actual team fluency (Python vs. JTS). The ETL is
    one-time and batch, so Option A's risk is front-loaded into setup, not live during
    the demo it's less risky than it sounds.

## 12. Containers

Use Docker/Podman only for **stateful infra dependencies** ChromaDB and Ollama both
ship official images. Don't containerize actively-edited app code (backend/web/mobile):
it slows the dev loop, and Android emulation inside a container is a real pain.

```yaml
# docker-compose.yml
services:
  chroma:
    image: chromadb/chroma
    ports: ['8000:8000']
    volumes: ['./data-service/chroma-data:/chroma/chroma']
  ollama:
    image: ollama/ollama
    ports: ['11434:11434']
    volumes: ['ollama-data:/root/.ollama']
volumes:
  ollama-data:
```

## 13. Build orchestration (Makefile)

Gradle owns the JVM side (backend, shared, mobile), npm owns web, Python (if used) owns
the ETL service Make is a thin layer tying them together, not a replacement for any of
them.

```makefile
.PHONY: setup infra-up infra-down ingest backend-dev web-dev test lint clean

setup:
	./gradlew :backend:dependencies :shared:dependencies :mobile:dependencies
	cd webclient && npm install
	# cd data-service && pip install -r requirements.txt --break-system-packages

infra-up:
	docker compose up -d
	docker exec ollama ollama pull granite3.1-dense:8b

infra-down:
	docker compose down

ingest:
	# one-time: download + join the 5 datasets, embed into chroma
	cd data-service && python ingest.py

backend-dev:
	./gradlew :backend:run --continuous

web-dev:
	cd webclient && npm run dev

test:
	./gradlew test
	cd webclient && npm test

lint:
	./gradlew ktlintCheck
	cd webclient && npm run lint

clean:
	docker compose down -v
	./gradlew clean
	rm -rf webclient/dist
```

## 14. API contract (backend ↔ web)

React/TS can't share Kotlin types directly. Generate an OpenAPI spec from Ktor and run
`openapi-generator` or `orval` to produce a typed TS client for `webclient` — avoids
type drift without cross-language codegen headaches.

## 15. Pre-hackathon checklist

- [ ] Confirm the 5-dataset spatial join actually resolves sensibly on 10-15 known
      Boston addresses/parks — especially the tree-density shade proxy and the
      Wi-Fi-to-park proximity threshold.
- [ ] Full dry run of `make setup && make infra-up` plus one `./gradlew build` on **each
      teammate's own laptop**, this week — not Saturday morning.
- [ ] Test the actual non-English target languages (Vietnamese, at minimum) against the
      chosen model — don't assume quality.
- [ ] Pre-download all 5 CSVs.
- [ ] Decide Option A vs. B (Section 11) before the day.

## 16. Open risks to stress-test

- **Join key mismatches** across datasets from different city departments a known,
  recurring problem in Boston open data. Verify field-level join keys during ETL
  prototyping, not assume they align.
- **Tree-density-as-shade-proxy is an approximation.** Worth an explicit caveat in the
  demo narrative turns a real limitation into a trust/honesty point rather than an
  unaddressed gap.
- **Unsupported soft attributes** ("quiet," "peaceful") have no dataset field and must
  be explicitly flagged as unsupported by the assistant, never guessed.
- **Track declaration** should be a live decision based on which half of the build
  (RAG/join sophistication vs. UI/mobile polish) is further along, not committed to in
  advance.
