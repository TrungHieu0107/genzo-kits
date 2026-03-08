# Genzo-Kit Core Architecture Overview

## Identity
**Genzo-Kit** is an ultra-fast, offline-first Desktop utility application customized specifically for the user. It is built strictly on Tauri v2 to leverage Rust's system performance mapped identically to a modern React UI shell styled manually with Tailwind CSS to match professional desktop aesthetics perfectly.

## Architecture Guidelines
- **Framework**: Tauri v2, React 18, TypeScript, Vite.
- **Styling**: TailwindCSS 3 (pure styling, no heavy UI libraries unless explicitly allowed like shadcn/ui components).
- **Backend (Rust)**: Handles local file system manipulation, native interactions, OS permissions, `command` execution, byte parsing, native encoding processing (via `encoding_rs`), and `session_management` json caching.
- **Frontend (TS/React)**: Pure UI rendering, local state management (via Zustand arrays), event handling. **All file I/O operations MUST execute via Tauri IPC.**

## Directory Map Structure
- `src/`: Main frontend files.
  - `components/`: Generic, reusable UI components (buttons, modals, toolbars).
  - `tools/`: The core application's distinct features are constructed as individual tools.
    - `text-comparator/`: The standalone native Monaco `DiffEditor` instance configured precisely for raw string tracking and ignoreTrimWhitespace granularities. Holds `useTextCompareStore` state provider for cross-tool text piping and user-interactive editing.
    - `note-editor/`: The Universal Monaco text processor handling arbitrary encoding tabs securely. Pipes diff commands into `text-comparator`.
    - `sql-log-parser/`: Powerful Regex Log Extractor identifying DAO sessions and executing Advanced Operator conditional filtering logic over sequence boundaries. Maps Time-ordered sequences perfectly tracking native Chronological sorting on rendering pipelines.
    - `folder-searcher/`: Implements async multi-threaded Rust backend Breadth-First Scanning (`std::fs::read_dir`) to query nested directories and files based on target match modes without locking the UI main thread. Returns normalized objects containing `path` schemas.
    - `tool-manager/`: The main UI Sidebar infrastructure tracking `index.ts`.
    - `index.ts`: The central registry exporting all available tools for dynamic sidebar rendering.
- `src-tauri/`: Rust backend and build configuration logic.
- `docs/`: Critical operational standards mapping rules and feature completions.

## Core Rules Implementation (Enforced by Antigravity AI)
As detailed in `07-core-development-rules.md`, Genzo-Kit implements a strict feature segmentation policy. ANY new user request is automatically handled by the `05-workflow-new-feature.md` process. Existing tools are isolated and immutable upon validation unless bug fixes are called.
- Note: The Monaco Comparator has been further refined to support full user interactivity (editing) on both panels.
- Note: Log Extractor Filter options were upgraded to support specific Operators and Time-based Ordering per request.
- Note: A System File & Folder Searcher capability was installed avoiding unbounded `C:\` parsing to protect against extreme local load configurations. Matches target directories and queries natively mapping payload schemas.
