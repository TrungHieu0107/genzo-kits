# Features

**Global**:
- Lightweight, fast startup. Dark theme. Custom scrollbars. Modular tools.

**Genzo XML Filter** (`src/tools/xml-filter`): [NEW]
1. **Shift_JIS Decoding**: Correctly handles Japanese characters in XML files.
2. **High-Performance Parser**: Rust-based `quick-xml` engine for near-instant processing of large files.
3. **Advanced Filtering**: Multi-field search (Tag, Attr Name, Attr Value, Text) with recursive matching.
4. **Dual View Modes**:
   - **Table View**: Flat list of matches with "matched-by-child" indicators and expandable children.
   - **Tree View**: Full XML structure navigation with visual highlights for matches.
5. **Node Context**: Shows attributes and inner text inline for quick inspection.

**Live Folder Searcher** (`src/tools/folder-searcher`):
1. **Live Scanning**: Real-time recursive scanning of target directories using Rust.
2. **Glob/Regex/Mode Support**: Smart wildcards (*, ?), regex toggle, and file/folder/all modes.
3. **Stale-While-Revalidate**: Cached results shown instantly while background scan re-validates data.
4. **Multi-folder Targets**: Row-based UI for multiple search roots.
5. **Multi-tool Integration**: Select results to open in Note Editor or add to Property Renamer.

**Text Comparator**: Monaco DiffEditor, bi-directional editing, independent per-pane encoding selection, and Zustand interop.
**Note Editor**: Multi-tab, session auto-save, dynamic encodings, open by path, drag-and-drop reorder.
**Installer Support**: MSI and NSIS (EXE) setup generation enabled.
**Property Renamer**: Batch rename properties across JSP, Java, and JS files with scan, map, replace, and undo.

**Performance Overhaul (2026)**:
1. **Rust-Powered Parsing**: SQL Log extraction and XML filtering offloaded to Rust backend.
2. **Parallel Filesystem Search**: Multi-threaded traversal via `ignore` crate.
3. **Frontend Code-Splitting**: Dynamic `lazy()` imports for tools.
4. **OOM Protection**: Strict file size limits and efficient buffer management in Rust.
5. **Render Optimization**: `@tanstack/react-virtual` for large lists.
6. **Memory Safety**: Centralized Monaco model disposal via `useMonacoManager`.

**Test Status**: PASS -- April 23, 2026 (XML Filter TableView TypeError fixed).
