# Features

**Global**:
- Lightweight, fast startup. Dark theme. Custom scrollbars. Modular tools.

**Live Folder Searcher** (`src/tools/folder-searcher`):
1. **Live Scanning**: Real-time recursive scanning of target directories using Rust.
2. **Glob/Regex/Mode Support**: Smart wildcards (*, ?), regex toggle, and file/folder/all modes.
3. **Stale-While-Revalidate**: Cached results shown instantly while background scan re-validates data.
4. **Multi-folder Targets**: Row-based UI for multiple search roots.
5. **Multi-tool Integration**: Select results to open in Note Editor or add to Property Renamer.
6. **Resizable Columns**: Drag column edges to adjust Name, Path, and Modified width.
7. **Double-click Open, Click-to-Copy**.
8. **Settings Persistence**: All filters and target directories saved to disk.

**Text Comparator**: Monaco DiffEditor, bi-directional editing, independent per-pane encoding selection, and Zustand interop.
**Note Editor**: Multi-tab, session auto-save, dynamic encodings, open by path, drag-and-drop reorder.
**Installer Support**: MSI and NSIS (EXE) setup generation enabled.
**Documentation Suite**: Generated FEATURES.md, USER_FLOWS.md, ARCHITECTURE.md, and COMPONENTS.md.
**Searcher Indexing**: Manual trigger for system-wide indexing; removes background overhead on startup.
**Property Renamer**: Batch rename properties across JSP, Java, and JS files with scan, map, replace, and undo.

**Test Status**: PASS -- March 12, 2026 (Column sort in search results implemented).
