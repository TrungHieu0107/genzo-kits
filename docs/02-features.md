# Features

**Global**:
- Extremely lightweight and fast startup.
- Modular tool architecture for easy expansion.
- Dark theme only.
- Utility scripts (\`build.bat\`, \`run.bat\`) for fast development and deployment.
- *Tested and verified on March 08, 2026*

**Tool Management Menu** (\`src/tools/tool-manager\`):
- Fixed sidebar layout integrating smoothly with main content
- **Collapsible sidebar**: Collapse to icon-only mode to save screen real estate.
- Dynamic tool list populated directly from \`src/tools/index.ts\`
- Selected state and collapsed state retention using \`localStorage\`
- Smooth, aesthetic tool switching without full app reload

**Text Comparator** (\`src/tools/text-comparator\`):
1. **Raw String Diffing**: Complete adherence to initial source input mapping through to a natively configured `Monaco Editor`.
2. **Granular Highlighting**: Modern `diffAlgorithm: 'advanced'` enabling character-level string visualization mapping differences perfectly side by side instead of full line rewriting logic.
3. **Whitespace Configurator**: Built in "Include Whitespace" visual toggle enabling `<DiffEditor ignoreTrimWhitespace={!toggle} />` to natively track newline variations, space padding anomalies, or tab conversion mutations securely.
4. **Interactive Panels**: Full support for manual typing, editing, and pasting within both original and modified panels with real-time state bridge.
5. **Editor Interop**: Directly linked to Note Editor context menus (`Alt+1/2`) via Zustand cross-store hydration.

**Note Editor** (\`src/tools/note-editor\`):
1. **Universal File Explorer**: VS Code-style left "OPEN EDITORS" sidebar. Resizable and fully collapsible.
2. **Multi-Tab Execution**: Streamlined single-window rendering focusing purely on the active file via Explorer.
3. **Session Auto-saving**: 100% loss-free crash-proof architecture utilizing `load_note_session` on initialization. "Untitled" disk-less files are automatically persisted.
4. **Monaco Editor Integration**: Powerful code editing experience powered by `@monaco-editor/react`. Automatic language detection via file extensions.
5. **Rust Binary Safe Checking**: Verify file byte safety natively before crashing the UI.
6. **Dynamic Encodings**: Bottom status bar encoding dropdown to quickly toggle and reload files in `UTF-8`, `Shift_JIS`, `Windows-1252`, and `UTF-16LE` using `encoding_rs`.
7. **Native Context Diffing**: Integrated Context Menu actions inside the Editor ("Set as First to Compare" and "Set as Second to Compare") that pipe string data securely and cross-navigate values instantly into the Text Comparator tool.
8. **Modern Keybindings**: `Ctrl+S` (Save), `Ctrl+W` (Close Tab), `Ctrl+N` (New Untitled File), and `Ctrl+O` (Open System Match).

**Log SQL Extractor** (\`src/tools/sql-log-parser\`):
1. **Backend parsing**: Regex processing over any valid structure returning sequence-perfect logs.
2. **Dynamic Encoding Selection**: Top-bar toggle to rebuild file encoding on the fly.
3. **Advanced Filtering**: Combine queries, daos, and timestamps using specific targeted operators (`equals ==`, `contains`, `greater_than >`, `less_than <`).
4. **Time Order**: Realtime visualization sorting based on chronological sequence (Ascending / Descending toggler)
5. **Aliases**: Customizable human-readable tabs injected by Context Menus.
6. **Sql Formatter**: Modal-based query expansion rendering beautiful code via `sql-formatter`.

**System File & Folder Searcher** (\`src/tools/folder-searcher\`):
1. **Target Modes**: Select from `All` (Files & Folders), `Files Only`, or `Folders Only` dynamically before executing searches. Distinct visual `lucide-react` icons are mapped to corresponding results.
2. **Native OS File Browsing**: Ask the user to limit recursion through Dialog APIs `open({ directory: true })`.
3. **Multi-threaded Lookups**: Uses Rust `spawn_blocking` to decouple heavy File System BFS mapping algorithms from the main Tauri Window payload avoiding freezes. Returns structured `SearchResultItem` structs parsing directories correctly.
4. **Safety Restrictors**: Built in depth limit boundaries to prevent system out-of-memory queries against hyper-directories (e.g. `C:\`).
5. **Path Bridging**: Includes a fast click-to-copy handler directly porting target coordinates into the user's OS Clipboard manager.
