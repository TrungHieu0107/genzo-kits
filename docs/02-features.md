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
2. **Granular Highlighting**: Modern `diffAlgorithm: 'advanced'` enabling character-level string visualization mapping differences perfectly side by side.
3. **Whitespace Configurator**: Built in "Include Whitespace" visual toggle.
4. **Interactive Panels**: Full support for manual typing, editing, and pasting within both original and modified panels.
5. **Editor Interop**: Directly linked to Note Editor context menus (`Alt+1/2`) via Zustand cross-store hydration.

**Note Editor** (\`src/tools/note-editor\`):
1. **Universal File Explorer**: VS Code-style left "OPEN EDITORS" sidebar. Resizable and fully collapsible.
2. **Multi-Tab Execution**: Streamlined single-window rendering.
3. **Session Auto-saving**: 100% loss-free crash-proof architecture utilizing `load_note_session` on initialization.
4. **Monaco Editor Integration**: Powerful code editing experience.
5. **Rust Binary Safe Checking**: Verify file byte safety natively before crashing the UI.
6. **Dynamic Encodings**: Bottom status bar encoding dropdown.
7. **Native Context Diffing**: Integrated Context Menu actions inside the Editor ("Set as First to Compare" and "Set as Second to Compare").
8. **Modern Keybindings**: `Ctrl+S`, `Ctrl+W`, `Ctrl+N`, `Ctrl+O`.

**Log SQL Extractor** (\`src/tools/sql-log-parser\`):
1. **Backend parsing**: Regex processing over any valid structure.
2. **Dynamic Encoding Selection**: Top-bar toggle.
3. **Advanced Filtering**: Combine queries, daos, and timestamps using specific targeted operators (`equals ==`, `contains`, `greater_than >`, `less_than <`).
4. **Time Order**: Realtime visualization sorting based on chronological sequence (Ascending / Descending toggler).
5. **Aliases**: Customizable human-readable tabs injected by Context Menus.
6. **Sql Formatter**: Modal-based query expansion.

**System File & Folder Searcher** (\`src/tools/folder-searcher\`):
1. **Target Modes**: Select from `All` (Files & Folders), `Files Only`, or `Folders Only`.
2. **Regex Support**: Toggleable Regular Expression matching for precise name/pattern lookups. Includes real-time error reporting for invalid regex syntax.
3. **Native OS File Browsing**: User-defined search scope via `open({ directory: true })`.
4. **Multi-threaded Lookups**: Uses Rust `spawn_blocking` with the `regex` crate to decouple heavy processing from the UI thread.
5. **Safety Restrictors**: Built in depth limit boundaries (500 match limit) to prevent system bottlenecks.
6. **Path Bridging**: Fast click-to-copy handler for clipboard integration.
