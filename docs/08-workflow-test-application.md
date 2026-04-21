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

**Live Folder Searcher:**
1. Navigate to Folder Searcher → Mode: Live Search Mode. PASS.
2. Search without roots → Error prompt shown. PASS.
3. Search with roots → `search_system` used → live backend search. PASS.
4. Regex search → Rust regex filtering on live scan. PASS.
5. Glob wildcards → Converted to regex pattern. PASS.

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

**Fast Parallel Search (Backend):**
1. Invoke `search_files("C:\\", "report", 100, false)`. PASS.
2. Verify parallel processing via threads config. PASS.
3. Ranking check: Lowercase/Uppercase scoring matches expectation. PASS.
4. Metadata check: ISO 8601 modified date present. PASS.

**Shortcut Integrity (BUG-FIX-04):**
1. Select text and press `Ctrl+C` → Verify text is copied to clipboard. PASS.
2. Navigate to Note Editor and press `Ctrl+N` → Verify it DOES NOT switch tool unless `Alt` is held. PASS.
3. Press `Ctrl+Alt+N` → Verify switches to Note Editor. PASS.
4. Press `Ctrl+Alt+C` → Verify switches to Text Comparator. PASS.
5. Press `Ctrl+Shift+S` → Verify opens Settings. PASS.

**Note Editor Integration & Crash Fix (BUG-FIX-05):**
1. Open Folder Searcher, select 2-3 files, click "Open trong Note tool".
2. Verify screen DOES NOT go black (no React crash). PASS.
3. Verify Note Editor mounts and shows ALL selected files in the sidebar and tabs. PASS.
4. Verify files are not overwritten by previous session after 1 second. PASS.

**Test Status**: PASS -- April 21, 2026 (Build stability & dependency fix complete).
