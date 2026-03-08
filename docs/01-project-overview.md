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
    - **Text Comparator**: Advanced diffing with Monaco.
    - **Note Editor**: Universal note-taking with session persistence.
    - **Log SQL Extractor**: Specialized parsing for executing SQL queries from thread logs.
    - **Settings**: Centralized preference management with hierarchical overrides.
    - **State Management**: Zustand stores dedicated per tool.
    - `tool-manager/`: The main UI Sidebar infrastructure tracking `index.ts`.
    - `index.ts`: The central registry exporting all available tools for dynamic sidebar rendering.
- `src-tauri/`: Rust backend and build configuration logic.
- `docs/`: Critical operational standards mapping rules and feature completions.

## Core Rules Implementation (Enforced by Antigravity AI)
As detailed in `07-core-development-rules.md`, Genzo-Kit implements a strict feature segmentation policy. ANY new user request is automatically handled by the `05-workflow-new-feature.md` process. Existing tools are isolated and immutable upon validation unless bug fixes are called.
- Note: The user explicitly authorized overriding Rule 1 to implement a complete Monaco Overhaul onto the `Text Comparator` folder natively.
- Note: The Monaco Comparator has been further refined to support full user interactivity (editing) on both panels.
- Note: Fixed build error by switching from `cargo tauri` to `npm run tauri` and ensuring `tauri-cli` cargo subcommand is installed (March 08, 2026).
- Note: Enhanced Note Editor with dedicated "Open File" button and fixed stale closures. Fixed Text Comparator character reversal, focus loss, and refined highlighting with dimmer row backgrounds and a toggle (March 08, 2026).
- Note: Enhanced Log SQL Extractor with flattened Library view, Monaco SQL Modal, a Dialect Selector, Multi-Condition Tag Filtering, Sidebar File Aliasing, and a Resizable "Slim Bar" Sidebar (March 08, 2026). Fixed: Nested DAO extraction, SQL parameter binding, execution identity, formatting, ID normalization, and parameterless query UI pollution (BUG-4/5/6/7/8/14).
