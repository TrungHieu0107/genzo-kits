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

**Text Comparator**: Monaco DiffEditor, bi-directional editing, Zustand interop.
**Note Editor**: Multi-tab, session auto-save, dynamic encodings.
**Log SQL Extractor**: Regex parsing, advanced filtering, SQL formatter.

**Test Status**: PASS -- March 09, 2026 (Fixed SQLite Background Indexer logic bug + SQLite Regex matching).
