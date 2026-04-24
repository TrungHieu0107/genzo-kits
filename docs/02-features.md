# Features

**Global**:
- Lightweight, fast startup. Dark theme. Custom scrollbars. Modular tools.

**Genzo XML Filter** (`src/tools/xml-filter`): [NEW]
1. **Shift_JIS Decoding**: Correctly handles Japanese characters in XML files.
2. **High-Performance Parser**: Rust-based `quick-xml` engine for near-instant processing of large files.
3. **Advanced Filtering**: Multi-field search (Tag, Attr Name, Attr Value, Text) with recursive matching.
4. **Visualization Modes**:
   - **Spreadsheet Grid**: Dynamic table with parameter columns (like CSV) for Batch records.
   - **Tree View**: Full XML structure navigation with visual highlights for matches.
   - **Standard List**: Fallback flat list for non-batch elements with expansion support.
5. **Node Context**: Shows attributes and inner text inline for quick inspection.
6. **CSV Export**: Dynamic pipe-separated export for Batch nodes with intelligent parameter mapping and header merging.

**Live Folder Searcher** (`src/tools/folder-searcher`):
1. **Live Scanning**: Real-time recursive scanning of target directories using Rust.
2. **Glob/Regex/Mode Support**: Smart wildcards (*, ?), regex toggle, and file/folder/all modes.
3. **Stale-While-Revalidate**: Cached results shown instantly while background scan re-validates data.
4. **Multi-folder Targets**: Row-based UI for multiple search roots.
5. **Multi-tool Integration**: Select results to open in Note Editor or add to Property Renamer.

**Text Comparator**: Monaco DiffEditor, bi-directional editing, independent per-pane encoding selection, and Zustand interop.
**Note Editor**: Multi-tab VS Code style editor with modular architecture, session auto-save, dynamic encodings, premium animations (Framer Motion), glassmorphism sidebar, and custom command pallet.
**Installer Support**: MSI and NSIS (EXE) setup generation enabled.
**Property Renamer**: Batch rename properties across JSP, Java, and JS files with scan, map, replace, and undo.

**Performance & Architecture Overhaul (2026)**:
1. **Rust-Powered Parsing**: SQL Log extraction and XML filtering offloaded to Rust backend.
2. **Parallel Processing**: Multi-threaded traversal via `ignore` crate and `rayon` for near-instant operations.
3. **Frontend Code-Splitting**: Dynamic `lazy()` imports for tools to ensure fast initial load times.
4. **OOM Protection & Memory Safety**: Strict file limits and centralized Monaco model disposal.
5. **Universal Virtualization**: Performance-grade rendering standard applied to all tools via `@tanstack/react-virtual`.
6. **Modular Hook Architecture**: Business logic extracted into specialized hooks (e.g. `useFolderSearch`).
7. **Decomposed Components**: Monolithic UIs split into focused, reusable components.
8. **Premium UI Standard**: Unified aesthetic with Glassmorphism and Framer Motion fluid animations.
36. **Dynamic UI Scaling**: Global font-size controller in Settings that scales the entire application interface proportionally via root rem-scaling.
37. **Premium Interface Design**: Redesigned Settings UI with "Interface Design" section, pro-level sliders, and typography previews.

**Test Status**: PASS -- April 24, 2026 (XML Filter Dynamic Spreadsheet Grid implemented and tested).
