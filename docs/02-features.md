# Features

**Global**:
- Extremely lightweight and fast startup.
- Modular tool architecture for easy expansion.
- Dark theme only.
- Utility scripts (`build.bat`, `run.bat`) for fast development and deployment.
- *Tested and verified on March 08, 2026 (Fixed: Alt+Shift+S shortcut in production builds via tauri-plugin-global-shortcut)*

**Settings & Preferences** (`src/tools/settings`):
- **Universal Context Menus:** Toggle Whitespace and Change Language right from the editor.
- **Global Settings Persistence:** Universal settings like Theme, Tab Size, Word Wrap, and Whitespace Rendering persist across sessions on disk.
- Centralized UI for application-wide and tool-specific configurations.
- Hierarchical editor settings (Font Size, Wrap, Minimap).
- App-Wide UI Preferences (**Global Configurable Toast Notification System**).
- Tool-specific defaults (Encoding for Note Editor, Whitespace for Comparator).
- **Shortcut**: `Ctrl+Shift+S` to open Settings instantly from anywhere.
- "Reset All" functionality for easy troubleshooting.

**Tool Management Menu** (`src/tools/tool-manager`):
- Fixed sidebar layout integrating smoothly with main content
- **Collapsible sidebar**: Collapse to icon-only mode to save screen real estate.
- Dynamic tool list populated directly from `src/tools/index.ts`
- Selected state and collapsed state retention using `localStorage`
- Smooth, aesthetic tool switching without full app reload

**Text Comparator** (`src/tools/text-comparator`):
**Text Comparator** (`src/tools/text-comparator`):
1. **Raw String Diffing**: Complete adherence to initial source input mapping through to a natively configured `Monaco Editor`.
2. **Granular Highlighting**: Modern `diffAlgorithm: 'advanced'` enabling character-level string visualization mapping differences perfectly side by side instead of full line rewriting logic.
3. **Whitespace Configurator**: Built in "Include Whitespace" visual toggle enabling `<DiffEditor ignoreTrimWhitespace={!toggle} />` to natively track newline variations, space padding anomalies, or tab conversion mutations securely.
4. **Interactive Panels**: Full support for manual typing, editing, and pasting within both original and modified panels with real-time state bridge.
5. **Editor Interop**: Directly linked to Note Editor context menus (`Alt+1/2`) via Zustand cross-store hydration.

**Note Editor** (`src/tools/note-editor`):
1. **Universal File Explorer**: VS Code-style left sidebar with "New File" and "Open File" actions. Resizable and fully collapsible.
2. **Multi-Tab Execution**: Streamlined single-window rendering focusing purely on the active file via Explorer.
3. **Session Auto-saving**: 100% loss-free crash-proof architecture utilizing `load_note_session` on initialization. "Untitled" disk-less files are automatically persisted.
4. **Monaco Editor Integration**: Powerful code editing experience powered by `@monaco-editor/react`. Automatic language detection via file extensions.
5. **Rust Binary Safe Checking**: Verify file byte safety natively before crashing the UI.
6. **Dynamic Encodings**: Bottom status bar encoding dropdown to quickly toggle and reload files in `UTF-8`, `Shift_JIS`, `Windows-1252`, and `UTF-16LE` using `encoding_rs`.
7. **Native Context Diffing**: Integrated Context Menu actions inside the Editor ("Set as First to Compare" and "Set as Second to Compare") that pipe string data securely and cross-navigate values instantly into the Text Comparator tool.
8. **Modern Keybindings**: `Ctrl+S` (Save), `Ctrl+W` (Close Tab), `Ctrl+N` (New Untitled File), and `Ctrl+O` (Open System Match).
9. **Tabs Context Menu**: Right-click tabs to Pin/Unpin, Close All, or Close Others.

**Log SQL Extractor** (`src/tools/sql-log-parser`):
1. **Multi-File Library**: The left sidebar acts as a library of opened log files. Users can open multiple files and switch between them instantly.
2. **DAO Tree Navigation**: Each log file in the sidebar expands to show its detected DAO sessions (Thread & DAO Name).
3. **Focused SQL View**: Clean 4-column data table showing **Time**, **DAO Name**, **Reconstructed SQL Query**, and a **Copy Action**.
4. **Encoding Selector**: Dedicated toolbar dropdown to select log encoding (Shift_JIS, UTF-8, etc.) with automatic file reload.
5. **Session Persistence**: Automatically saves and restores all opened log files and their encodings when the application is restarted.
6. **SQL Formatter Modal**: Clicking any query cell opens a VSCode-style modal with a full Monaco Editor (read-only, syntax-highlighted, with minimap, line numbers, and code folding). Includes a **Dialect Selector** to switch between PostgreSQL, MySQL, T-SQL, PL/SQL, etc.
7. **Reload Feature**: Dedicated button to refresh the active log file from disk, allowing for real-time analysis as log files grow.
8. **Robust Parsing**: Advanced regex detection for DAO sessions that handles mixed Japanese characters and complex log formats.
9. **Multi-Condition Filtering**: Tag-based filtering system allowing users to combine (AND logic) conditions by Query Content, DAO Name, or Timestamp via a dedicated modal UI.

*Tested and verified on 2026-03-08 (Added: Filtering System. Fixed: UI Pollution & ID Normalization BUG-7/8).*
