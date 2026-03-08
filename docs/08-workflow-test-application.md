# Genzo-Kit Workflow: Test Application

**Test Matrix (March 09, 2026):**

| Feature | Status |
| :--- | :--- |
| Global Theme | PASS |
| Sidebar | PASS |
| Text Comparator | PASS |
| Folder Searcher | PASS |

**System Cache Manager:**
1. App startup → `start_background_index` called → `.scanning` flag created → scan runs in background. PASS.
2. Navigate to Folder Searcher → `get_index_status` checked → `load_system_index` called → index loaded into RAM → badge shows "Index Ready (XK entries)". PASS.
3. Search without rootDirs → `filterFromIndex` used → instant results from RAM. PASS.
4. Search with rootDirs → `search_system` used → live backend search. PASS.
5. Navigate away → `systemIndex.current = null` → RAM freed. PASS.
6. During scan → badge shows "Indexing... XK". PASS.
7. `index-complete` event received → index reloaded automatically. PASS.

Added using Workflow 05.
