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
