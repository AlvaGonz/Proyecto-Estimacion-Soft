# Implementation Plan: Fix Docker Mongo & Stabilize Structure

Fixing the MongoDB container startup error and synchronizing the project structure.

## 1. Environment Synchronization
- **File:** `.env.docker`
- **Action:** Add `MONGO_INITDB_ROOT_USERNAME=admin` and `MONGO_INITDB_ROOT_PASSWORD=secret123`.
- **Action:** Ensure `MONGODB_URI` uses these credentials correctly.

## 2. Docker Compose Simplification
- **File:** `docker-compose.yml`
- **Action:** Remove the redundant `environment` keys for root user/pass in the `mongo` service.
- **Action:** Keep ONLY `MONGO_INITDB_DATABASE` in the `environment` section for mapping purposes if needed, but the image will now pick up the root credentials directly from `env_file` via the standard names.
- **Action:** Update the `healthcheck` to use these standard variable names.

## 3. Structural Stability
- **Action:** Stage the directory move in Git.
- **Action:** Verify imports.

## 4. Verification
- **Command:** `docker compose config`
- **Command:** `docker compose up -d mongo` to verify it starts.
