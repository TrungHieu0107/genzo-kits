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

**Performance Overhaul (2026)**:
1. **Rust-Powered Parsing**: SQL Log extraction offloaded to Rust backend using parallel regex engines.
2. **Parallel Filesystem Search**: Multi-threaded traversal via `ignore` crate for near-instant folder searching.
3. **Frontend Code-Splitting**: Dynamic `lazy()` imports for tools to ensure fast initial load times.
4. **OOM Protection**: Strict file size limits and efficient buffer management in Rust.
5. **Render Optimization**: `@tanstack/react-virtual` for large lists (Folder Searcher, Property Renamer).
6. **Memory Safety**: Centralized Monaco model disposal via `useMonacoManager` to prevent RAM accumulation.
7. **Modular Backend**: Logic extracted from `lib.rs` into specialized modules for stability and clarity.

**Test Status**: PASS -- April 21, 2026 (Build stability & dependency fix complete).
