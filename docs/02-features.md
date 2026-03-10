# Features

**Global**:
- Lightweight, fast startup. Dark theme. Custom scrollbars. Modular tools.

**System File & Folder Searcher** (`src/tools/folder-searcher`):
1. **System Cache Manager (SQLite)**: Background system-wide file indexing on app startup, stored in SQLite DB. Search queries DB directly on disk — zero RAM usage.
2. **Index Status Badge**: Header shows "Indexing...", "Loading Index...", "Index Ready (XK entries)", or "No Index".
3. **SQLite-Powered Search**: When no specific folders are set and index is ready, searches query SQLite directly via `search_index` command. SQL LIKE + Rust regex filtering.
4. **Stale-While-Revalidate**: Cached results shown first, background search updates silently.
5. **Cache Control**: Toggleable "Enable Cache".
6. **Collapsible Section**: "Target Directories" collapses to "Options".
7. **Resizable Columns**: Drag column edges to resize.
8. **Full-Width Layout**: Uses all available width.
9. **Row-based Multi-Folder UI** with min 1 row constraint.
10. **Settings Persistence**: All settings saved to disk.
11. **Glob/Regex/Mode Support**: Smart wildcards, regex toggle, file/folder modes.
12. **Sticky Table**: Pinned Name column, pinned headers.
13. **Double-click Open, Click-to-Copy**.

**Text Comparator**: Monaco DiffEditor, bi-directional editing, independent per-pane encoding selection, and Zustand interop.
**Note Editor**: Multi-tab, session auto-save, dynamic encodings, open from URL, drag-and-drop reorder.
**Installer Support**: MSI and NSIS (EXE) setup generation enabled.
**Log SQL Extractor**: Regex parsing, advanced filtering, SQL formatter.
**Property Renamer**: Batch rename properties across JSP, Java, and JS files with scan, map, replace, and undo.

**Test Status**: PASS -- March 10, 2024 (Build installers added).
