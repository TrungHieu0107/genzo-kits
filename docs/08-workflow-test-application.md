# Genzo-Kit Workflow: Test Application

**Test Matrix (March 10, 2026):**

| Feature | Status |
| :--- | :--- |
| Global Theme | PASS |
| Sidebar | PASS |
| Text Comparator | PASS |
| Folder Searcher | PASS |
| Advanced SQL Filters | PASS |
| Smart Log Reload | PASS |
| Note Editor URL Fetch | PASS |

**System Cache Manager (SQLite):**
1. App startup → `start_background_index` called → `.scanning` flag → SQLite DB created with bulk inserts. PASS.
2. Navigate to Folder Searcher → `get_index_status` checked → badge shows "Index Ready (XK entries)". PASS.
3. Search without rootDirs → `search_index` queries SQLite directly → fast results. PASS.
4. Search with rootDirs → `search_system` used → live backend search. PASS.
5. Navigate away → No RAM cleanup needed (zero RAM usage). PASS.
6. During scan → badge shows "Indexing... XK". PASS.
7. `index-complete` event → status updated to "ready". PASS.
8. Regex search → SQL LIKE pre-filter + Rust regex post-filter. PASS.
9. Glob wildcards → Converted to SQL LIKE pattern. PASS.

**Text Comparator Encoding Selection:**
1. Open file with Shift_JIS encoding → Corrupted characters shown. PASS.
2. Select "Shift_JIS" from drop-down → File reloads and characters are correct. PASS.
3. Switch back to "UTF-8" → Corrupted characters return. PASS.
4. Repeat for File 2 independently. PASS.

**Note Editor URL Feature:**
1. Click Globe icon → Prompt appears. PASS.
2. Enter valid text URL (github readme) → Content loads in new tab. PASS.
3. Extension detection → `.md` detected as markdown. PASS.
4. Error handling → Invalid URL shows toast error. PASS.

Added using Workflow 05.

**Test Status**: PASS -- March 10, 2026 (Note Editor URL feature added).
