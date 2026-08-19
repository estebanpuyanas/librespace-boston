.PHONY: help setup infra-up infra-down generate ingest backend-dev web-dev mobile-dev test lint clean format

.DEFAULT_GOAL := help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

setup: ## Install everything: npm workspaces + gradle deps + uv sync
	npm install
	cd backend && ./gradlew dependencies
	cd data-service && uv sync
	git config core.hooksPath .githooks

infra-up: ## Start the ramalama + chroma containers (podman-compose up -d)
	podman-compose up -d

infra-down: ## Stop containers, keep volumes (model stays cached)
	podman-compose down

generate: ## Regenerate the shared TS client from backend/openapi.yaml
	npm run generate --workspace=shared

ingest: ## One-time: join the 5 datasets, embed into chroma (see data-service/README.md)
	cd data-service && uv run etl.py && uv run ingest.py

backend-dev: ## Run the Ktor backend with continuous reload (localhost:8081)
	cd backend && ./gradlew run --continuous

web-dev: ## Run the Vite dev server for webclient (localhost:5173)
	npm run dev --workspace=webclient

mobile-dev: ## Run the Expo dev server for mobile (scan QR with Expo Go)
	npm run start --workspace=mobile

test: ## Run backend tests + E2E tests
	cd backend && ./gradlew test
	npm run test:e2e

lint: ## Lint backend (ktlint) + webclient/mobile (eslint)
	cd backend && ./gradlew ktlintCheck
	npm run lint

clean: ## Wipe containers+volumes, gradle build dir, web/mobile build output
	podman-compose down -v
	cd backend && ./gradlew clean
	rm -rf webclient/dist mobile/.expo

format: ## Format backend (ktlint) + webclient/mobile (prettier)
	cd backend && ./gradlew ktlintFormat
	npx prettier --write "webclient/**/*.{ts,tsx,css,scss,md}" "mobile/**/*.{ts,tsx,css,scss,md}"
