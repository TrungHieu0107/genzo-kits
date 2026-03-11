# Genzo-Kit Workflow: Test Application

**Test Matrix (March 10, 2024):**

| Feature | Status |
| :--- | :--- |
| Global Theme | PASS |
| Sidebar | PASS |
| Text Comparator | PASS |
| Folder Searcher | PASS |
| Advanced SQL Filters | PASS |
| Smart Log Reload | PASS |
| Note Editor URL Fetch | PASS |
| Note Editor Tab Reorder | PASS |
| Global Layout Stability | PASS |
| Production Bundle (MSI/EXE) | PASS |
| Documentation Accuracy | PASS |

**System Cache Manager (SQLite):**
1. Navigate to Folder Searcher → Status: No Index. PASS.
2. Click "Scan System Now" → Status: Indexing... PASS.
3. Search while indexing → Results appearing. PASS.
4. Index complete → Status: Index Ready. PASS.
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

**Note Editor Open by Path:**
1. Click Link icon → Prompt appears. PASS.
2. Enter valid local path (e.g. `D:\note.txt`) → Content loads in new tab. PASS.
3. Extension detection → Correct language assigned. PASS.
4. Error handling → Invalid path shows toast error. PASS.

**Note Editor Tab Reordering:**
1. Click and hold tab name in sidebar. PASS.
2. Drag to new position → drop. PASS.
3. Order updates in UI immediately. PASS.
4. Verify correct mapping with pinned/unpinned mixed tabs. PASS.

**Global Layout Stability (Touchpad):**
1. Scroll to the bottom of any tool (e.g. Note Editor) using touchpad. PASS.
2. Attempt to scroll past the limit → Layout remains locked (no rubber-banding). PASS.
3. Repeat for top limit. PASS.

**Production Bundle Packaging:**
1. Run `cargo tauri build` with bundle config. PASS.
2. Verify `.msi` output in `bundle\msi` folder. PASS.
3. Verify `-setup.exe` output in `bundle\nsis` folder. PASS.
4. Verify standalone `.exe` in `release` folder. PASS.

Done using Workflow 06.

**Test Status**: PASS -- March 11, 2026 (Manual indexing refactor completed).
