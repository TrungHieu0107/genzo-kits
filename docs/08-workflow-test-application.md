# Genzo-Kit Workflow: Test Application

**Test Matrix (April 23, 2026):**

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
2. Select XML file with Japanese characters (Shift_JIS) → Parse successful. PASS.
3. Filter by Tag Name (e.g. "Parameter") → Filtered results shown in Table/Tree. PASS.
4. Filter by Attribute Value → "matched-by-child" highlight works. PASS.
5. Expand Table row → Children match list shown correctly. PASS.
6. Switch to Tree View → Recursive highlights and expansion work. PASS.
7. Clear Filter → Full tree restored. PASS.

**Live Folder Searcher:**
1. Navigate to Folder Searcher → Mode: Live Search Mode. PASS.
2. Search without roots → Error prompt shown. PASS.
3. Search with roots → `search_system` used → live backend search. PASS.

**Text Comparator Encoding Selection:**
1. Open file with Shift_JIS encoding → Corrupted characters shown. PASS.
2. Select "Shift_JIS" from drop-down → File reloads and characters are correct. PASS.

**Shortcut Integrity (BUG-FIX-04):**
1. Select text and press `Ctrl+C` → Verify text is copied to clipboard. PASS.
2. Press `Ctrl+Alt+N` → Verify switches to Note Editor. PASS.
3. Press `Ctrl+Alt+C` → Verify switches to Text Comparator. PASS.
4. Press `Ctrl+Shift+S` → Verify opens Settings. PASS.

**Test Status**: PASS -- April 23, 2026 (XML Filter TableView TypeError fixed).
