# User Flows & Use Cases

This document traces common workflows in Genzo-Kit from the UI trigger to the backend response.

---

## 📋 Text Comparison Flow
**Actor:** Developer
**Trigger:** User pastes text or opens files in the Text Comparator.
**Steps:**
1. User interacts with "File 1" or "File 2" panes.
2. Component reads input or calls `read_file_encoded()` via Tauri if a file is opened.
3. User selects encoding from the dropdown.
4. `read_file_encoded(path, encoding)` returns decoded content.
5. Monaco Diff Editor calculates and displays differences.
**Outcome:** Visual representation of differences between two text sources.
**Components involved:** `TextComparator`, `useTextCompareStore`
**Tauri commands:** `read_file_encoded()`

---

## 📝 Note Management Flow
**Actor:** User
**Trigger:** Opening the Note Editor or clicking "New File".
**Steps:**
1. `App.tsx` calls `load_note_session()` on startup to restore state.
2. User clicks "Open by Path".
3. User enters a local file path (e.g. `C:\temp\note.txt`).
4. UI calls `read_file_encoded(path, encoding)`.
5. Backend returns string content.
6. User edits content; `save_note_session()` is called periodically (debounced).
7. User clicks "Save"; `save_file_encoded()` is called.
**Outcome:** Files are edited, synced to the backend session, and saved locally.
**Components involved:** `NoteEditor`, `useNoteEditorStore`
**Tauri commands:** `load_note_session()`, `save_note_session()`, `read_file_encoded()`, `save_file_encoded()`

---

## 🔍 Fast System Search Flow
**Actor:** User
**Trigger:** Clicking "Scan System Now" or typing in the search bar.
**Steps:**
1. User navigates to Folder Searcher.
2. User clicks "Scan System Now" to initiate or update the index.
3. UI calls `start_background_index()`.
4. User enters query in `FolderSearcher.tsx`.
5. If index is ready, UI calls `search_index(query, mode, use_regex)`.
6. Backend queries SQLite `system_index.db`.
7. Results are mapped and displayed in a virtualized list.
8. User clicks "Open Folder" -> `open_path(path)` is called.
**Outcome:** User finds files/folders instantly across the whole system after manual indexing.
**Components involved:** `FolderSearcher`, `StatusBar`
**Tauri commands:** `start_background_index()`, `search_index()`, `get_index_status()`, `open_path()`

---

## 🛠️ Property Refactoring Flow
**Actor:** Senior Developer/Maintainer
**Trigger:** Clicking "Scan Files" in Property Renamer.
**Steps:**
1. User selects a directory or adds individual files.
2. UI calls `scan_files(paths)`.
3. Backend performs multi-threaded regex matching on JSP/Java/JS files.
4. UI displays a list of detected property names and their occurrences.
5. User enters "New Name" for specific properties.
6. User clicks "Replace & Save" -> `replace_in_files(mappings, paths, encodings)` is called.
7. Backend creates `.bak` files and overwrites originals with new content.
**Outcome:** Properties are renamed consistently across multiple legacy files.
**Components involved:** `PropertyRenamer`
**Tauri commands:** `scan_files()`, `replace_in_files()`, `undo_last_replace()`
