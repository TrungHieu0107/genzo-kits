# Genzo-Kit Workflow: Test Application

**Test Matrix (April 24, 2026):**

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
| Genzo XML Filter | PASS |
| Global Layout Stability | PASS |
| Production Bundle (MSI/EXE) | PASS |
| Documentation Accuracy | PASS |

**Genzo XML Filter:**
1. Open XML Filter tool from sidebar. PASS.
2. Select XML file with Japanese characters (Shift_JIS) ↁEParse successful. PASS.
3. Filter by Tag Name (e.g. "Parameter") ↁEFiltered results shown in Table/Tree. PASS.
4. Filter by Attribute Value ↁE"matched-by-child" highlight works. PASS.
5. Expand Table row ↁEChildren match list shown correctly. PASS.
6. Switch to Tree View ↁERecursive highlights and expansion work. PASS.
7. Clear Filter ↁEFull tree restored. PASS.

**Live Folder Searcher:**
1. Navigate to Folder Searcher ↁEMode: Live Search Mode. PASS.
2. Search without roots ↁEError prompt shown. PASS.
3. Search with roots ↁE`search_system` used ↁElive backend search. PASS.

**Text Comparator Encoding Selection:**
1. Open file with Shift_JIS encoding ↁECorrupted characters shown. PASS.
2. Select "Shift_JIS" from drop-down ↁEFile reloads and characters are correct. PASS.

**Shortcut Integrity (BUG-FIX-04):**
1. Select text and press `Ctrl+C` ↁEVerify text is copied to clipboard. PASS.
2. Press `Ctrl+Alt+N` ↁEVerify switches to Note Editor. PASS.
3. Press `Ctrl+Alt+C` ↁEVerify switches to Text Comparator. PASS.
4. Press `Ctrl+Shift+S` ↁEVerify opens Settings. PASS.

**Test Status**: PASS -- April 24, 2026 (Sticky Scroll Integration & Semantic Typography verified).


