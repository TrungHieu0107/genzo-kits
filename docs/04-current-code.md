# Current Code

## App.tsx
Contains the primary layout combining \`ToolSidebar\` and the dynamically active component retrieved from \`src/tools/index.ts\`. Orchestrates the \`isSidebarCollapsed\` state to manage the sidebar's visual expansion.

## index.ts
Exports a \`tools\` array dictating the entire layout of available sidebars. Now includes `TextComparator`, `NoteEditor`, `SqlLogParser`, `FolderSearcher`, and `Settings`.

## ToolSidebar.tsx
Contains the main logic for rendering the fixed left-side menu, holding mapped buttons for every tool inside \`index.ts\`. Remembers active tab and collapsed state via \`localStorage\` synced down from \`App\`.

## TextComparator.tsx
Contains the overhauled Advanced Text Comparator leveraging Monaco's native `DiffEditor`. Hooked natively via `useTextCompareStore` (`store.ts`) to toggle `includeWhitespace` states (`ignoreTrimWhitespace`) and set advanced character-level tracking logic. Supports **bi-directional editing** on both original and modified panels with real-time state synchronization.

## NoteEditor.tsx
A full-featured Universal Note-taking application powered by Monaco Editor (`@monaco-editor/react`), Zustand (`store.ts`), and Tauri's native `fs` plugin. Includes a VS Code style "OPEN EDITORS" tab system for managing files simultaneously that is resizable and collapsible. Features safe parsing of binaries through custom Rust back-end functions. Built-in Auto-save caches all states globally directly mapping `serde_json`. Includes custom Context Menu actions to capture blocks of code into memory (`useTextCompareStore`) allowing seamless bridging directly into the Text Comparator tool for diffing.

## SqlLogParser.tsx
Parses generic Java backend .log and .txt files looking specifically for Database Access Object (DAO) sessions. Maps reconstructed SQL queries sequentially by stripping noise. Features advanced filtering combinations over Query string, DAO Name, or Timestamps using explicit operators (`Contains`, `Equals`, `>`, `<`). Includes a Top-Bar Toolbar toggle to dynamically sort mapped logs chronologically (Time: Ascending / Descending). Includes a context menu in the explorer to map custom human-readable Alias names to files. Features built-in SQL code formatter via `sql-formatter` inside a Modal for beautiful multi-line query viewing.

## FolderSearcher.tsx
A search utility leveraging `search_system` spawned blocking Rust Thread inside `lib.rs`. Safely executes recursive queries on any folder bypassing system hangs. Maps string inputs and outputs a `SearchResultItem { path, is_dir: boolean }` parsing explicit "Mode" dropdown states ("all", "file", "folder") and **Regex toggle state**. If `useRegex` is enabled, the backend utilizes the `regex` crate to provide pattern matching. Includes error message handling for invalid regex syntax. Outputs nested File System structure queries safely to the UI array boundary limits. Generates endpoints that can be rapidly piped outwards to `tauri_plugin_clipboard_manager`.

## Cargo.toml (Rust)
Includes `encoding_rs` to support rapid local disk byte-string parsing based on the Status Bar Encoding configuration state. Includes `serde_json` for serialization inside the Session Management hooks and schema parsing mapping for Search limits. **Now includes `regex` crate for system-level pattern matching.**

*(For the complete code snippet of any tool, rely on the actual source file in \`src/tools/\` as the source of truth.)*

## Convenience Scripts and Configuration
### build.bat
\`\`\`bat
@echo off
echo Building Genzo-Kit (x86_64-pc-windows-msvc)...
cargo tauri build --target x86_64-pc-windows-msvc
echo Build complete.
pause
\`\`\`

### run.bat
\`\`\`bat
@echo off
echo Running Genzo-Kit in Dev Mode...
npm run tauri dev
pause
\`\`\`

### .gitignore
Standard exclusions for node_modules, Tauri target directories, and OS files.

## Test Results
- **Date**: March 08, 2026
- **Tested**: Text Comparator (Monaco Refinement Override + Editable Panels). Tool Management Menu. Universal Note Editor. SqlLogParser (Advanced Operators & Sort Order). Folder Searcher (**Regex Support**, `spawn_blocking` UI Safety hooks, File Mode parsing schemas).
- **Result**: PASS ✅

## Bug Fix Log — March 07, 2026

### BUG-1: Tauri startup crash due to fs plugin scope config
- **Discovered in:** Phase 2
- **Test case:** Startup application via `npm run tauri dev`
- **Symptom:** App crashes on startup `exit code: 101` with `PluginInitialization("fs", "Error deserializing 'plugins.fs'...unknown field scope")`.
- **Root cause:** Tauri v2 deprecates `plugins.fs.scope` inside `tauri.conf.json`, shifting permissions and scopes entirely into `capabilities/*.json` files.
- **Fix applied:** Removed `plugins.fs` entirely from `tauri.conf.json` and generated `capabilities/default.json` with base permissions.
- **Files modified:** `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`
- **Verified:** Rebuilt cleanly and successfully started the dev window via `cargo run`.

### BUG-2: Text Comparator read-only panels
- **Discovered in:** Manual testing
- **Symptom:** User unable to type directly into comparison panels.
- **Root cause:** Monaco `DiffEditor` options `readOnly` and `originalEditable` were set to restrictive values.
- **Fix applied:** Set `readOnly: false` and `originalEditable: true`. Implemented `onDidChangeModelContent` listeners for both editors to sync typed content back to Zustand.
- **Files modified:** `src/tools/text-comparator/TextComparator.tsx`
- **Verified:** Verified typing works on both sides and state persists during navigation.
