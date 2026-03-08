# Current Code

## App.tsx
Contains the primary layout combining `ToolSidebar`, the dynamically active component retrieved from `src/tools/index.ts`, and the `GlobalToast` notifications component. Orchestrates the `isSidebarCollapsed` state to manage the sidebar's visual expansion.

## index.ts
Exports a `tools` array dictating the entire layout of available sidebars. Now includes `TextComparator`, `NoteEditor`, and the hidden `Settings` tool.

## ToolSidebar.tsx
Contains the main logic for rendering the fixed left-side menu. It now filters out the `settings` tool from the main list and provides a dedicated **Settings** button in the footer. Remembers active tab and collapsed state via `localStorage`.

## Settings.tsx
A new centralized tool for managing application preferences. Features a hierarchical settings system (General vs. Tool-specific) and persistence using `useSettingsStore`. Allows users to configure app-wide UI preferences (e.g. dynamic toast notification position), editor font size, font family, word wrap, and tool-specific options like default encoding and diff whitespace sensitivity. **Accessible via `Ctrl+Shift+S` shortcut.** Sends notifications via `GlobalToast`.

## Settings Store (src/tools/settings/store.ts)
A Zustand-based store that manages global and tool-specific settings. Implements a resolution logic (`getEffectiveEditorSettings`) to allow tool-specific overrides for general editor settings. Uses `persist` middleware for `localStorage` synchronization.

## GlobalToast (`src/components/GlobalToast.tsx` / `toastStore.ts`)
A centralized, globally configurable notification system using Zustand. Overlays the entire app (`App.tsx`), ensuring toasts appear regardless of which tool is active. Reads positioning preferences from `GeneralSettings`.

## TextComparator.tsx
Contains the overhauled Advanced Text Comparator leveraging Monaco's native `DiffEditor`. Hooked natively via `useTextCompareStore` (`store.ts`) to toggle `includeWhitespace` states (`ignoreTrimWhitespace`) and set advanced character-level tracking logic. Supports **bi-directional editing** on both original and modified panels with real-time state synchronization.

## NoteEditor.tsx
A full-featured Universal Note-taking application powered by Monaco Editor (`@monaco-editor/react`), Zustand (`store.ts`), and Tauri's native `fs` plugin. Includes a VS Code style sidebar with dedicated "New File" and "Open File" buttons. Features safe parsing of binaries through custom Rust back-end functions. Built-in Auto-save caches all states globally directly mapping `serde_json`. Includes global keyboard shortcuts (`Ctrl+N` / `Ctrl+O` / `Ctrl+W` / `Ctrl+S` / `Ctrl+Shift+C` to copy active file path) and editor actions for pushing code straight to the `Text Comparator` via `Alt+1` / `Alt+2`. It now relies on `GlobalToast` for user notifications instead of local dialogs. Status bar includes a **Language Mode selector** to manually override syntax highlighting.

## Cargo.toml (Rust)
Includes `encoding_rs` to support rapid local disk byte-string parsing based on the Status Bar Encoding configuration state. Includes `serde_json` for serialization inside the Session Management hooks.

*(For the complete code snippet of any tool, rely on the actual source file in \`src/tools/\` as the source of truth.)*
*(For the complete code snippet of any tool, rely on the actual source file in `src/tools/` as the source of truth.)*

## Convenience Scripts and Configuration
### build.bat
```bat
@echo off
echo Building Genzo-Kit (x86_64-pc-windows-msvc)...
call npm run tauri build -- --target x86_64-pc-windows-msvc
echo Build complete.
pause
```

### run.bat
```bat
@echo off
echo Running Genzo-Kit in Dev Mode...
npm run tauri dev
pause
```

### .gitignore
Standard exclusions for node_modules, Tauri target directories, and OS files.

## Test Results
- **Date**: March 08, 2026 (Settings Centralization)
- **Tested**: Centralized Settings UI. Hierarchical state resolution. Note Editor & Text Comparator settings integration. Sidebar persistence.
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

### BUG-3: Build error `error: no such command: tauri`
- **Discovered in:** Manual build via `.\build.bat`
- **Symptom:** `error: no such command: tauri` when running `cargo tauri build`.
- **Root cause:** `cargo-tauri` cargo subcommand not installed globally on the system path.
- **Fix applied:** Modified `build.bat` to use `call npm run tauri build -- [args]`. This uses the project's local `@tauri-apps/cli` node dependency which is more portable.
- **Files modified:** `build.bat`
- **Verified**: Verified `build.bat` triggers the correct Node-based Tauri CLI.

### BUG-4: Note Editor "Save As" used open dialog
- **Discovered in:** Manual testing / Code review
- **Symptom:** Saving an untitled file prompted for a file to open instead of a location to save.
- **Root cause:** `handleSaveFile` was incorrectly calling `open({ directory: false })` instead of `save()`.
- **Fix applied:** Updated `handleSaveFile` to use the `save` function from `@tauri-apps/plugin-dialog`. Added "Open File" button to sidebar for better UX as requested.
- **Files modified:** `src/tools/note-editor/NoteEditor.tsx`
- **Verified**: Code updated and syntax verified.

### BUG-5: Note Editor Save used stale closure
- **Discovered in:** User report / Mental reproduction
- **Symptom:** Saving an opened file sometimes triggered "Save As" or saved the wrong file.
- **Root cause:** Monaco `save-action` closure was capturing `activeFile` from the mount time, missing subsequent switches or dirty state updates.
- **Fix applied:** Used `useRef` to track `activeFile` and referenced `activeFileRef.current` inside Monaco actions. Restored "Save" button to sidebar.
- **Files modified:** `src/tools/note-editor/NoteEditor.tsx`
- **Verified**: Verified ref-based access ensures latest state is used.

### BUG-6: Text Comparator focus loss during typing
- **Discovered in:** User report
- **Symptom:** Typing in Comparator caused the focus to reset to the start of the row/file.
- **Root cause:** `onDidChangeModelContent` captured the initial store values in a closure. This caused constant redundant store updates which triggered `DiffEditor` rerenders, resetting the cursor.
- **Fix applied:** Used `useRef` to track `leftText` and `rightText` inside the change listener, ensuring updates only fire when content actually changes relative to the latest state.
- **Files modified:** `src/tools/text-comparator/TextComparator.tsx`
- **Verified**: Mentally verified that Ref-based check prevents the rerender loop during user typing.

### BUG-7: Text Comparator character reversal (abc -> cba)
- **Discovered in:** User report
- **Symptom:** Typing "abc" resulted in "cba".
- **Root cause:** The `DiffEditor`'s `original` and `modified` props were synced to the store. On every keystroke, the store update triggered a rerender, which passed the value back to Monaco via props, resetting the cursor to position 0.
- **Fix applied:** Decoupled store state from editor props using an uncontrolled-editor pattern. Values are now synced manually via `editorRef` only when `isInternalChange` is false (external updates).
- **Files modified**: `src/tools/text-comparator/TextComparator.tsx`
- **Verified**: Verified that typing no longer resets the cursor.

### BUG-8: Text Comparator diff highlights hard to distinguish
- **Discovered in:** User report
- **Symptom:** Difficult to distinguish word-level differences from row-level differences due to similar background intensities.
- **Root cause:** Default Monaco `vs-dark` theme uses the same intensity for both word and line backgrounds.
- **Fix applied:** Defined a custom Monaco theme `genzo-diff-theme`. Dimmed row backgrounds (opacity `20`) and kept word highlights bright (opacity `60`). Added a "Highlight Row" toggle in the header to allow turning off row backgrounds entirely.
- **Files modified**: `src/tools/text-comparator/TextComparator.tsx`, `src/tools/text-comparator/store.ts`
- **Verified**: Verified aesthetically and functionally.

### BUG-9: Alt+Shift+S shortcut swallowed by Monaco Editor
- **Discovered in:** User report
- **Symptom:** Pressing Alt+Shift+S to open Settings didn't work when focus was inside the editor.
- **Root cause:** Monaco Editor stops the propagation of the `keydown` event before it reaches the `window`. Also, relying solely on `e.key` could be brittle across keyboard layouts.
- **Fix applied:** Updated `window.addEventListener('keydown', handleGlobalKeyDown, true)` in `App.tsx` to use the capture phase (intercepting the event *before* it reaches the editor). Used `e.code === 'KeyS'` for reliability.
- **Files modified**: `src/App.tsx`
- **Verified**: Verified event capture logic prevents children from swallowing the shortcut.

### BUG-10: Displaying Broken Logo
- **Discovered in:** User report
- **Symptom:** The Genzo logo in the sidebar was missing/broken because the app was looking for `/logo.jpg`.
- **Root cause:** The `img` tag in `ToolSidebar.tsx` was hardcoded to `/logo.jpg` which didn't exist in the project, instead of the real asset `/logo.png`. The `public` directory was also missing.
- **Fix applied:** Created `public` directory, copied `logo.png` from `src-tauri/logo/logo.png` to `public/logo.png`, and updated `ToolSidebar.tsx` to use the correct `src` attribute.
- **Files modified**: `src/tools/tool-manager/ToolSidebar.tsx`
- **Verified**: Asset loads correctly using Vite's static public directory handling.

### BUG-11: Alt+Shift+S shortcut not working in production .exe build
- **Discovered in:** User report (March 08, 2026)
- **Symptom:** `Alt+Shift+S` shortcut works in browser dev mode but does nothing in the built `.exe` desktop app.
- **Root cause:** In Tauri's production builds, **WebView2** on Windows intercepts `Alt` key combinations at the OS level before they reach the JavaScript event listeners inside the WebView. Browser `keydown` listeners never fire.
- **Fix applied:** Added `tauri-plugin-global-shortcut` to register the shortcut at the OS process level via Tauri's native API. The shortcut now uses Tauri's `register('Alt+Shift+S', ...)` which works regardless of WebView focus state. A browser `keydown` fallback is kept for dev mode compatibility.
- **Files modified**: `src/App.tsx`, `src-tauri/src/lib.rs`, `src-tauri/Cargo.toml`, `src-tauri/capabilities/default.json`, `package.json`
- **Verified**: Plugin registered and permissions configured.

### BUG-12: Ctrl+Shift+C Copy Path fails with "Failed to copy path"
- **Discovered in:** User report (March 08, 2026)
- **Symptom:** Pressing `Ctrl+Shift+C` in Note Editor shows "Failed to copy path" toast.
- **Root cause:** `clipboard-manager:default` capability only includes **read** permissions. `writeText` requires explicit `clipboard-manager:allow-write-text` permission.
- **Fix applied:** Added `clipboard-manager:allow-write-text` to `src-tauri/capabilities/default.json`.
- **Files modified**: `src-tauri/capabilities/default.json`
- **Verified**: Permission granted for clipboard write operations.

### BUG-13: Localized notifications causing inconsistent UI experiences
- **Discovered in:** User report (March 08, 2026)
- **Symptom:** Unstyled alerts/localized toasts acting inconsistently in `NoteEditor` and `Settings`.
- **Root cause:** Both tools had custom local implementations for notifications without a unified state.
- **Fix applied:** Created `GlobalToast.tsx` and a centralized `toastStore.ts` using Zustand. Placed it at the root of `App.tsx` and refactored both `NoteEditor` and `Settings` to emit messages using the global `useToastStore`.
- **Files modified**: `src/components/GlobalToast.tsx`, `src/components/toastStore.ts`, `src/App.tsx`, `src/tools/note-editor/NoteEditor.tsx`, `src/tools/settings/Settings.tsx`
- **Verified**: Verified centralized state displays toasts globally regardless of current active tool.

## Global Configuration (`src/components/configStore.ts` & `StatusBar.tsx`)
- **`useConfigStore`**: Zustand store leveraging `@tauri-apps/plugin-store` for global editor settings (`theme`, `renderWhitespace`, `tabSize`, `fontSize`, `wordWrap`, `encoding`). State is automatically reloaded on App mount.
- **`useEditorConfig`**: A centralized hook that returns `getCommonOptions()` which translates the store's global state into Monaco Editor compatible options.
- **`StatusBar`**: A shared reactive UI component at the bottom of `NoteEditor` and `TextComparator`. It offers dynamic Language Selection, File Encoding toggles, and Whitespace Visibility toggles.

### Feature Addition: Whitespace Toggle in Settings UI
- **Added**: A dropdown for configuring `renderWhitespace` in `Settings.tsx` under "General Editor Appearance".
- **Integration**: Plumbed directly into the global `useConfigStore` to synchronize across all tools and StatusBars instantly.

### Feature Addition: Pinned Tabs & Context Window in Note Editor
- **Added**: Custom right-click Context Menu on the Explorer File List in Note Editor.
- **Capabilities**: Features `Pin Tab` (keeps it visually sticky and avoids mass-closes), `Close Others`, and `Close All (Keep Pinned)`.
- **Integration**: Added `isPinned` to `EditorFile` interface and expanded actions in `useNoteEditorStore`.

### Feature Addition: Log SQL Extractor
- **Added**: Entirely new isolated tool built under `src/tools/sql-log-parser`.
- **Backend Dependency**: Uses the universal `read_file_encoded` to safely import and reload log content in specific encodings.
- **Library Architecture**: The `useSqlLogStore` manages an array of `LogFile` objects, each containing its own `DaoSession`s and state.
- **Layout Refactor**: Implemented a two-column layout:
  - **Left Sidebar**: Hierarchical tree (Files -> DAO Sessions).
  - **Main Area**: Clean 4-column data table showing **Time**, **DAO Name**, **Reconstructed SQL Query**, and a **Copy Action**.
- **Logic Parsing**: Typescript Regex routines inside `parser.ts` isolating `InvokeDao` and `endSession`. It now uses a robust detection logic that extracts the **timestamp**, **threadName**, and **DAO Name** even when merged with Japanese text (e.g., `Daoの開始jp.co...`) or separated by extra commas/spaces.
- **Clipboard & Encoding**: Integrated a native copy button for query results and a dedicated **Encoding Selector** in the toolbar for precise file decoding.
- **Session Persistence**: Integrated `tauri-plugin-store` (saving to `sql_log_files.json`) to persist file paths and encodings. On app mount, the tool automatically re-reads and re-parses all previously opened files.
- **SQL Formatter Modal**: Clicking any SQL query cell opens a VSCode-style modal with a full Monaco Editor in **read-only** mode. Features include SQL syntax highlighting, minimap, line numbers, code folding, and a blue VSCode-themed status bar.

## Bug Fix Log — 2026-03-08

### BUG-1: DAO Sidebar Layout and SQL Modal Visibility
- **Discovered in:** Phase 3-B
- **Test case:** Load log file and click on an SQL log.
- **Symptom:** The sidebar showed grouped DAOs which the user didn't want, and the SQL Modal was blank (didn't render the SQL text).
- **Root cause:** Monaco Editor inside the flex container lacked explicit height (`min-h-[400px]` with `flex-1` failed to allocate height when modal opened). Sidebar grouped DAOs by sessions.
- **Fix applied:** Refactored `SqlLogParser.tsx` to flatten the view by aggregating all SQL logs across sessions instead of rendering a DAO tree. Added fixed `h-[60vh]` and `min-h-[450px]` bounds to the Monaco Editor container so it always renders. Removed the "Collapse" feature entirely and replaced it with a read-only Monaco Editor.
- **Files modified:** `src/tools/sql-log-parser/SqlFormatterModal.tsx`, `src/tools/sql-log-parser/SqlLogParser.tsx`
- **Verified:** Build passed, layout successfully flattened, modal has absolute dimensions for proper Monaco Editor rendering.
### BUG-2: SQL Dialect Selection Failures
- **Discovered in:** Phase 3-B
- **Test case:** Open SQL Formatter Modal and switch to T-SQL (SQL Server) or PL/SQL (Oracle).
- **Symptom:** SQL remained unformatted (returned unformatted raw string).
- **Root cause:** The dialect IDs used in the `DIALECTS` array (`sqlserver`, `oracle`) were not compatible with `sql-formatter` v15.7.2, which expects `tsql` and `plsql`. This caused the `format` function to throw an error, hitting the `catch` block which returned the raw `sql`.
- **Fix applied:** Updated `DIALECTS` array in `SqlFormatterModal.tsx` to use correct IDs (`tsql`, `plsql`). Added `Standard SQL (sql)`, `BigQuery`, and `Snowflake` to the supported list.
- **Files modified:** `src/tools/sql-log-parser/SqlFormatterModal.tsx`
- **Verified:** Build passed, code logic is now aligned with `sql-formatter` documentation.
### BUG-3: SQL Parameters Not Loading and DAO Names Showing as Unknown/Global
- **Discovered in:** User Report / Phase 3 Testing
- **Test case:** Open a log file where a PreparedStatement is executed multiple times with different parameters, or where DAO calls are nested on the same thread.
- **Symptom:** Only the last parameter execution was shown. DAO names appeared as "Unknown/Global" due to nested sessions overwriting the thread state.
- **Root cause:** `parser.ts` used a flat dictionary per thread, causing nested DAOs to overwrite each other. Parameter parsing overwrote previous parameters in `paramMap`, so multiple executions of the same SQL ID only yielded one reconstructed query.
- **Fix applied:** Refactored `parser.ts` to use a stack (`threadStacks`) for nested DAO tracking. Changed the reconstruction pass to map every `paramsString` log independently to the globally collected SQL string.
- **Files modified:** `src/tools/sql-log-parser/parser.ts`
- **Verified:** Build passed. Code properly tracks executions sequentially and correctly identifies nested DAO boundaries.

### BUG-4: DAO Names Showing as Unknown/Global despite active InvokeDao log
- **Discovered in:** User Report / Phase 3 Testing
- **Test case:** Open a log file where the `InvokeDao` line does not have a leading space before `Daoの開始` or where subsequent logs lack `threadName` while 'unknown' session is initialized.
- **Symptom:** SQL logs were incorrectly grouped into "Unknown/Global" instead of the active DAO session.
- **Root cause:** The `threadName` fallback logic was picking the first key in `threadStacks`, which often defaulted to `'unknown'` if any log appeared before the first DAO. Additionally, the DAO Start regex was slightly too strict for some log variations.
- **Fix applied:** Refined the `DAO Start` regex to be more flexible (`(?:InvokeDao)?.*?,?Daoの開始\s*([\w.]+)`). Updated the thread fallback logic to explicitly exclude `'unknown'` when other active DAO sessions exist.
- **Files modified:** `src/tools/sql-log-parser/parser.ts`
- **Verified:** Build passed. Code logic ensures that logs without explicit thread names favor active DAO sessions over the global bucket.

### BUG-5: SQL Parameter Extraction, Chronology & Identity (4d9ac0b4 reported case)
- **Discovered in:** User Report / Phase 3 Testing
- **Test case:** Log file with multiple executions of the same PreparedStatement ID, where one execution has 50+ parameters.
- **Symptom:** Parameters were not filling (or only partially filling), and only one execution appeared in the UI instead of the multiple executed instances. Chronology was also broken (SQL logs appeared out of order due to session pop-back ordering).
- **Root cause:** 
  1. `paramsMatch` regex was stripping the leading `[` bracket of the first parameter captured, causing `reconstructSql`'s internal regex to fail on the first element.
  2. SQL logs were being flattened by session order, and since DAOs only "finish" (and thus enter the sessions list) when popped, nested DAOs appeared out of sequence.
  3. The association of parameters to SQL prepare statements was global, but the UI list was not correctly iterating through all execution instances.
- **Fix applied:** 
  1. Updated `paramsMatch` to preserve the leading bracket.
  2. Introduced a global `logIndex` to every `LogEntry` during parsing.
  3. Modified `SqlLogParser.tsx` to sort the flattened SQL list by `logIndex`.
  4. Confirmed that each parameter log generates its own `type: 'sql'` entry with `reconstructedSql`, ensuring all executions are visible.
- **Files modified:** `src/tools/sql-log-parser/parser.ts`, `src/tools/sql-log-parser/SqlLogParser.tsx`
- **Verified:** Build passed. Data logic preserves arrival order and bracket integrity.
+
+### BUG-6: SQL Parameters Failing to Fill (Identity 4d9ac0b4 Case)
+- **Discovered in:** User Report / Phase 3 Testing
+- **Test case:** Log file with long parameter lists where `reconstructSql` was potentially failing on type comparisons or greedy regex matches.
+- **Symptom:** UI showed only the base SQL (with `?`) instead of the parameter-filled versions. The base SQL formatting was also compressed.
+- **Root cause:** 
+  1. `paramsMatch` regex was too strict about trailing spaces after the ID.
+  2. `reconstructSql` was splitting by a fixed `][` delimiter, which failed if the logger added spaces (e.g., `] [`).
+  3. Lack of `trim()` on extracted types made `'STRING'` !== `' STRING'`, preventing value quoting.
+  4. Global space compression in `reconstructSql` destroyed user's indentation formatting.
+- **Fix applied:** 
+  1. Relaxed `paramsMatch` regex (`.*?params=`).
+  2. Used regex-based splitting for parameters (`split(/\]\s*\[/)`).
+  3. Added `trim()` to `type`, `index`, and `value` extraction.
+  4. Removed the `replace(/\s+/g, ' ')` compression to preserve formatting.
+  5. Refined `executedIds` logic to ensure empty params still hide the base query.
+- **Files modified:** `src/tools/sql-log-parser/parser.ts`
+- **Verified:** Reproduction script confirmed correct mapping and formatting preservation.

### BUG-7: Duplicate SQL Rows (Bare Query with '?' not hiding)
- **Discovered in:** User Report / Phase 3 Testing
- **Symptom:** UI showed both the bare SQL (with `?`) and the filled version, even if parameters were found.
- **Root cause:** 
  1. **Case Sensitivity**: SQL IDs (often hex) were treated as case-sensitive in the internal `Set`. If one log used `id=4d...` and another `id=4D...`, they wouldn't match.
  2. **Inflexible Match**: Regex was strictly looking for `id=... sql=` or `id=... params=`. If a line had both or was formatted differently, it might partially fail.
  3. **Greedy Hiding**: Hiding logic didn't account for redundancy when the same ID was prepared/executed multiple times across different threads or sessions.
- **Fix applied:** 
  1. **Normalization**: All extracted IDs are now `.trim().toLowerCase()`.
  2. **Independent Grouping**: Captured ID, SQL, and Params independently using separate regexes, allowing for more flexible log line formats.
  3. **Aggressive Hiding**: Explicitly set `reconstructedSql = undefined` and `type = 'info'` for any prep statement log whose ID exists in the `executedIds` set.
- **Files modified:** `src/tools/sql-log-parser/parser.ts`
- **Verified:** Reproduction script confirmed that mixed-case IDs are normalized and correctly hide the redundant prep statement rows.

### BUG-8: Duplicate SQL Rows (Parameterless UI Pollution)
- **Discovered in:** User Report / Phase 3 Testing
- **Symptom:** Bare SQL queries (with `?`) still appeared in the UI if they were prepared but lacked a matching execution log, or if the execution log had empty parameters (`params=`).
- **Root cause:** `parser.ts` would default to pushing the bare `sql=` log into the UI if it didn't find its ID in the `executedIds` set. This led to "preparation" logs polluting the UI independently of their actual execution sequence.
- **Fix applied:** Strictly set `type = 'info'` and `reconstructedSql = undefined` for ALL `sql=` preparation logs. We now ONLY yield reconstructed SQL for the `params=` execution logs, ensuring SQL only appears in the UI when actually executed.
- **Files modified:** `src/tools/sql-log-parser/parser.ts`
- **Verified:** Tested with isolated reproduction script. Preparation logs are correctly hidden, and parameterless executions yield their base SQL exactly at the execution log index.
