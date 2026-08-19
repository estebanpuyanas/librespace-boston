.PHONY: setup infra-up infra-down backend-dev web-dev mobile-dev generate ingest test lint clean

setup:
	npm install
	cd backend && ./gradlew dependencies
	cd data-service && uv sync

infra-up:
	podman-compose up -d

infra-down:
	podman-compose down

# Regenerate the shared TS client from backend/openapi.yaml
generate:
	npm run generate --workspace=shared

# One-time: join the 5 datasets, embed into chroma (see data-service/README.md)
ingest:
	cd data-service && uv run etl.py && uv run ingest.py

backend-dev:
	cd backend && ./gradlew run --continuous

web-dev:
	npm run dev --workspace=webclient

mobile-dev:
	npm run start --workspace=mobile

test:
	cd backend && ./gradlew test
	npm run test:e2e

lint:
	cd backend && ./gradlew ktlintCheck
	npm run lint

clean:
	podman-compose down -v
	cd backend && ./gradlew clean
	rm -rf webclient/dist mobile/.expo
