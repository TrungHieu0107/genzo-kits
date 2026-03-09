# Current Code

## lib.rs — Rust Backend (SQLite System Cache Manager)
**Dependency**: `rusqlite = { version = "0.31", features = ["bundled"] }`

**Commands:**
- `start_background_index`: Spawns background thread scanning all drives. Writes to `system_index.db` using SQLite with WAL mode, bulk transactions (commit every 10K), and `synchronous = OFF` for max write speed. Creates `idx_name` index on `name` column. Uses `.scanning` flag file.
- `search_index`: Queries SQLite DB directly on disk. Uses SQL `LIKE` for pattern matching + Rust regex for regex mode. Returns `Vec<SearchResultItem>` with computed `base_path`. Zero RAM usage.
- `get_index_status`: Returns scanning/ready/not_found status with COUNT query.

**Structs:** `IndexStatus` (status, count). Removed `IndexEntry` (no longer needed).

## App.tsx
- Calls `invoke('start_background_index')` on mount to trigger background indexing.

## FolderSearcher.tsx (Refactored for SQLite)
**Removed:** `IndexEntry` interface, `systemIndex` ref, `filterFromIndex` function. No RAM loading.
**Simplified mount effect:** Only checks `get_index_status` and listens for `index-complete`/`index-progress` events.
**New `performIndexSearch`:** Calls `invoke('search_index', ...)` to query SQLite directly.
**`handleSearch` flow:**
1. Cache → show immediately + revalidate (using `search_index` or `search_system`).
2. Fast path → if no rootDirs + index ready → `search_index`.
3. Fallback → `search_system` (live scan).

## Test Results — March 09, 2026: PASS ✅

## Feature Log

### FEAT-15: Refactor System Cache to SQLite
- Replaced JSON + RAM with SQLite DB (WAL, indexed, zero RAM).
- Added `search_index` command.
- Removed `IndexEntry`, `systemIndex`, `filterFromIndex` from frontend.

### BUG-FIX-01: Log SQL Extractor Date Format Fix
- Updated `entryRegex` and `timeMatch` in `parser.ts` to support both `/` and `-` as date separators.
- Enabled compatibility with logs using `YYYY-MM-DD` format (e.g., `stclibApp.log`).
