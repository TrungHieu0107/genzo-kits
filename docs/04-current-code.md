# Current Code

## lib.rs — Rust Backend (SQLite System Cache Manager)
**Dependency**: `rusqlite = { version = "0.31", features = ["bundled"] }`

**Commands:**
- `start_background_index`: Spawns background thread scanning all drives. Writes to `system_index.db` using SQLite with WAL mode, bulk transactions (commit every 10K), and `synchronous = OFF` for max write speed. Creates `idx_name` index on `name` column. Uses `.scanning` flag file.
- `search_index`: Queries SQLite DB directly on disk. Uses SQL `LIKE` for pattern matching + Rust regex for regex mode. Returns `Vec<SearchResultItem>` with computed `base_path`. Zero RAM usage.
- `get_index_status`: Returns scanning/ready/not_found status with COUNT query.
- `fetch_url_content`: Uses `reqwest` to fetch string content from a given URL. Timeout 30s.

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

### FEAT-16: Advanced SQL Filter Operators
- Added `not_contains` and `not_equals` operators to SQL Log Parser.
- Updated `store.ts` types, `SqlLogParser.tsx` filtering logic/UI, and `FilterModal.tsx` dropdown.

### BUG-FIX-02: Log File Reload/Re-upload Fix
- Updated `addFile` in `store.ts` to prevent duplicate file entries and update existing one if path matches.
- Added `isReloading` state and visual feedback (spinning icon, "Reloading..." text) to `handleReload` in `SqlLogParser.tsx`.
- Improved error handling for reload actions.

### FEAT-17: Text Comparator Encoding Selection (March 09, 2026)
- **Store**: Added `leftPath`, `rightPath`, `leftEncoding`, `rightEncoding` states.
- **UI**: Added `<select>` elements for encoding beside FILE 1 / FILE 2 buttons.
- **Backend Sync**: Refactored `loadFile` and added `handleEncodingChange` to use `read_file_encoded` Rust command.

### FEAT-18: Property Renamer Tool (March 09, 2026)
- **Backend**: `collect_files`, `scan_files`, `replace_in_files`, `undo_last_replace` commands in `lib.rs`.
- **Frontend**: `PropertyRenamer.tsx` — 3-column layout (File list | Mapping table | Preview panel).
- **Registration**: Added to `src/tools/index.ts` with `Replace` icon.

### FEAT-19: Note Editor URL Support (March 10, 2026)
- **Backend**: Added `reqwest` and implemented `fetch_url_content` command.
- **UI**: Added Globe icon button to sidebar. Simple prompt for URL entry.
- **Integration**: Fetches content and opens as a new tab with automatic language detection based on URL extension.

### FEAT-20: Note Editor Tab Reordering (March 10, 2024)
- **Store**: Added `reorderFiles` action using `splice` logic.
- **UI**: Added `draggable` and `onDrag*` handlers to file list items.
- **Logic**: Maps `displayFiles` indices back to absolute `files` indices for correct state updates.

### BUG-FIX-03: Touchpad Overscroll "Rubber-Banding" Fix (March 10, 2024)
- **Problem**: Touchpad scrolling on reach limits caused the entire application layout to "bounce" or "rubber-band".
- **Fix**: Added `overscroll-behavior: none` to `html, body` in `src/index.css`.
- **Side Effect**: Prevents the browser-level overscroll effect globally, keeping the IDE-like interface stable.

**Test Status**: PASS -- March 10, 2024 (Touchpad overscroll fixed).
