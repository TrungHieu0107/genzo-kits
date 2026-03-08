# Genzo-Kit Core Architecture Overview

## Identity
**Genzo-Kit** is an ultra-fast, offline-first Desktop utility application. Built on Tauri v2, React 18, TypeScript, Vite, TailwindCSS.

## Key Architectural Features
- **System Cache Manager**: On app startup, Rust backend scans all drives in background and writes a full file system index to `system_index.json`. When the Folder Searcher tool is active, the index is loaded into RAM for instant filtering. When the user navigates away, RAM is freed. Background scan emits events to track progress.
- **Stale-While-Revalidate**: Shows cached results instantly, then refreshes in background.
- **Resizable Columns**: All table columns draggable with `colgroup` + `tableLayout: fixed`.
- **Collapsible Options**: Target Directories collapses to "Options" label.

## Directory Map
- `src/tools/folder-searcher/` — System File & Folder Searcher with full-system indexing.
- `src/tools/text-comparator/` — Monaco DiffEditor.
- `src/tools/note-editor/` — Universal Note Editor.
- `src/tools/sql-log-parser/` — Log SQL Extractor.
- `src-tauri/src/lib.rs` — All Rust commands including `start_background_index`, `load_system_index`, `get_index_status`, `search_system`.
