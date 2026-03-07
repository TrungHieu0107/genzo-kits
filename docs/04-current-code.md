# Current Code

## App.tsx
Contains the primary layout combining \`ToolSidebar\` and the dynamically active component retrieved from \`src/tools/index.ts\`. Orchestrates the \`isSidebarCollapsed\` state to manage the sidebar's visual expansion.

## index.ts
Exports a \`tools\` array dictating the entire layout of available sidebars. Now includes `NoteEditor`.

## ToolSidebar.tsx
Contains the main logic for rendering the fixed left-side menu, holding mapped buttons for every tool inside \`index.ts\`. Remembers active tab and collapsed state via \`localStorage\` synced down from \`App\`. Provides a toggle collapse button to shrink into an icon-only representation.

## TextComparator.tsx
Contains the main UI for the text comparison, integrating file loading, pasting, side-by-side diff with syntax highlighting via \`prismjs\`, synchronized scrolling, and a differences summary at the bottom. The core font size is `text-xs` (12px).

## NoteEditor.tsx
A full-featured Note-taking application powered by Monaco Editor (`@monaco-editor/react`) and Tauri's native `fs` plugin. Includes a VS Code style file explorer for navigating opened local directories. Includes full Ctrl+S bindings to directly mutate local disk files. 

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
- **Date**: March 07, 2026
- **Tested**: Text Comparator (Large code, JSON, logs, disk load, clipboard, sync scroll, exports). Tool Management Menu (Collapsible UI). Note Editor (Monaco).
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
