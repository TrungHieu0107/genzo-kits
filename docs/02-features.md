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
**Note Editor**: Multi-tab VS Code style editor with modular architecture, session auto-save, dynamic encodings, premium animations (Framer Motion), glassmorphism sidebar, and custom command pallet.
**Installer Support**: MSI and NSIS (EXE) setup generation enabled.
**Documentation Suite**: Generated FEATURES.md, USER_FLOWS.md, ARCHITECTURE.md, and COMPONENTS.md.
**Searcher Indexing**: Manual trigger for system-wide indexing; removes background overhead on startup.
**Property Renamer**: Batch rename properties across JSP, Java, and JS files with scan, map, replace, and undo.

**Performance & Architecture Overhaul (2026)**:
1. **Rust-Powered Parsing**: SQL Log extraction and filesystem traversal offloaded to Rust backend.
2. **Parallel Processing**: Multi-threaded traversal via `ignore` crate and `rayon` for near-instant operations.
3. **Frontend Code-Splitting**: Dynamic `lazy()` imports for tools to ensure fast initial load times.
4. **OOM Protection & Memory Safety**: Strict file limits and centralized Monaco model disposal.
5. **Universal Virtualization**: Performance-grade rendering standard applied to all tools via `@tanstack/react-virtual`.
6. **Modular Hook Architecture**: Business logic extracted into specialized hooks (e.g. `useFolderSearch`).
7. **Decomposed Components**: Monolithic UIs split into focused, reusable components.
8. **Premium UI Standard**: Unified aesthetic with Glassmorphism and Framer Motion fluid animations.

**Test Status**: PASS -- April 21, 2026 (Build stability & dependency fix complete).
