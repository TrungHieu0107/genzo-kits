# Features

**Global**:
- Lightweight, fast startup. Dark theme. Custom scrollbars. Modular tools.

**System File & Folder Searcher** (`src/tools/folder-searcher`):
1. **System Cache Manager**: Background system-wide file indexing on app startup. Index saved to disk, loaded into RAM when tool is active, freed when navigating away.
2. **Index Status Badge**: Header shows "Indexing...", "Loading Index...", "Index Ready (XK entries)", or "No Index".
3. **Instant Search from Index**: When no specific folders are set and index is available, searches filter from RAM (no disk I/O needed).
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
