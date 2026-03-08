# Current Code

## lib.rs — Rust Backend
**New System Cache Manager commands:**
- `start_background_index`: Spawns background thread scanning all drives. Writes `system_index.json` to app data dir. Emits `index-progress` (every 10K entries) and `index-complete` events. Uses `.scanning` flag file to prevent duplicate scans.
- `load_system_index`: Reads and deserializes `system_index.json`.
- `get_index_status`: Returns scanning/ready/not_found status.

**New structs:** `IndexEntry` (name, path, is_dir, modified), `IndexStatus` (status, count).

## App.tsx
- Added `invoke('start_background_index')` call on mount to trigger background indexing on app startup.

## FolderSearcher.tsx
**System Cache Manager lifecycle:**
- On mount: Checks `get_index_status`, loads `load_system_index` into `systemIndex` ref (RAM). Listens for `index-complete` and `index-progress` Tauri events.
- On unmount: Sets `systemIndex.current = null` to free RAM. Unsubscribes from events.
- `filterFromIndex`: Filters in-memory index for instant results (no disk I/O). Supports regex, glob, and mode filtering.
- `handleSearch` fast-path: When no specific rootDirs and system index available → uses `filterFromIndex` instead of `search_system`.
- Header badge: Shows index status (Indexing.../Loading/Ready/No Index).

## Test Results — March 09, 2026: PASS ✅

## Feature Log

### FEAT-14: System Cache Manager
- Background full-system scan on app startup, saved to disk.
- RAM lifecycle: load on mount, clear on unmount.
- Instant search from in-memory index.
- Status badge in header.
