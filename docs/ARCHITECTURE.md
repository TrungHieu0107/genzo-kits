# Architecture Overview

Genzo-Kit follows a modern hybrid desktop architecture using Tauri for system integration and React for the user interface.

## 3.1 High-Level Architecture
- **Backend (Rust):** Handles CPU-intensive tasks (regex scanning, filesystem traversal), database management (SQLite), and safe File I/O.
- **Frontend (React + TS):** Handles UI state, user interactions, and editor rendering.
- **IPC:** Communication via Tauri's `invoke` (Request/Response) and `emit` (Asynchronous events like indexing progress).

## 3.2 Frontend Architecture
- **`src/tools/`**: Contains modular, isolated tools. Each tool typically has its own component and Zustand store.
- **`src/components/`**: Shared UI components and global stores (Toasts, Config, SQLite status).
- **State Management**: Uses **Zustand** for lightweight, reactive state. Most stores are persisted to `localStorage` or synced with the backend.
- **Styling**: Tailwind CSS + Shadcn UI for a professional, dark IDE-like aesthetic.

## 3.3 Backend (Tauri / Rust)
- **`src-tauri/src/lib.rs`**: Single entry point for all system-level logic.
- **Domain Modules (Logical groups):**
    - **File IO**: `read_file_encoded`, `save_file_encoded`.
    - **Note Session**: `save_note_session`, `load_note_session`.
    - **System Index (SQLite)**: `start_background_index`, `search_index`, `get_index_status`.
    - **Property Scanning**: `scan_files`, `replace_in_files`.

## 3.4 Data Flow Diagram
```mermaid
graph TD
  User[User Action] --> UI[React Component]
  UI --> Store[Zustand Store]
  Store -->|invoke| Rust[Tauri Command - Rust]
  Rust -->|FS/SQLite/Network| Sys[System/Data]
  Sys -->|Data| Rust
  Rust -->|Result/Error| UI
  Rust -->|emit| UI[Event Listener]
```

## 3.5 Key Dependencies

### Frontend (`package.json`)
- **`@monaco-editor/react`**: Powers the Text Comparator and Note Editor.
- **`zustand`**: Global and tool-specific state management.
- **`lucide-react`**: Consistent iconography.
- **`sql-formatter`**: Used in the Log SQL Extractor.
- **`tailwindcss`**: Utility-first styling.

### Backend (`Cargo.toml`)
- **`tauri`**: Core framework for desktop integration.
- **`rusqlite`**: SQLite interface for high-performance file indexing.
- **`regex`**: High-speed text pattern matching.
- **`encoding_rs`**: Robust encoding/decoding for legacy files (Shift_JIS, etc.).
- **`reqwest`**: HTTP client for URL content fetching.
