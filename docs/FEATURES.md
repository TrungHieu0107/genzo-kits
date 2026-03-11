# Feature List

Genzo-Kit is a multi-tool desktop application designed for developers. Below is the list of features currently implemented in the codebase.

## Core Platform
| # | Feature | Description | Location | Status |
|---|---------|-------------|----------|--------|
| 1 | Tool Sidebar | Navigate between different developer tools with a collapsible UI. | `src/tools/tool-manager/ToolSidebar.tsx` | Complete |
| 2 | Global Shortcuts | App-wide hotkeys (e.g., Ctrl+Shift+S for Settings). | `src/App.tsx` | Complete |
| 3 | Standalone Mode | Launch individual tools in separate windows via URL parameters. | `src/App.tsx` | Complete |
| 4 | Global Notifications | Toast message system for feedback across all tools. | `src/components/GlobalToast.tsx` | Complete |

## Text Comparator
| # | Feature | Description | Location | Status |
|---|---------|-------------|----------|--------|
| 5 | Side-by-side Diff | Compare two text blocks using Monaco Diff Editor. | `src/tools/text-comparator/TextComparator.tsx` | Complete |
| 6 | Encoding Support | Independently select encodings (UTF-8, Shift_JIS, etc.) for each pane. | `src/tools/text-comparator/TextComparator.tsx` | Complete |
| 7 | Bi-directional Edit | Edit text directly in either pane with real-time diff updating. | `src/tools/text-comparator/TextComparator.tsx` | Complete |

## Note Editor
| # | Feature | Description | Location | Status |
|---|---------|-------------|----------|--------|
| 8 | Multi-tab Editing | Open and manage multiple text/markdown files in tabs. | `src/tools/note-editor/NoteEditor.tsx` | Complete |
| 9 | Session Auto-save | Persists open tabs and content across app restarts using Rust backend. | `src/tools/note-editor/store.ts`, `lib.rs` | Complete |
| 10 | Open by Path | Manually input a local file path to open it as a new tab. | `src/tools/note-editor/NoteEditor.tsx`, `lib.rs` | Complete |
| 11 | Drag-and-drop Reorder| Manually reorder file tabs in the sidebar. | `src/tools/note-editor/NoteEditor.tsx` | Complete |

## Log SQL Extractor
| # | Feature | Description | Location | Status |
|---|---------|-------------|----------|--------|
| 12 | DAO Session Parsing | Extracts SQL statements and parameters from complex log files. | `src/tools/sql-log-parser/parser.ts` | Complete |
| 13 | Table Aliasing | Map cryptic table names to readable labels for better analysis. | `src/tools/sql-log-parser/AliasModal.tsx` | Complete |
| 14 | SQL Formatting | Pretty-print extracted SQL queries for readability. | `src/tools/sql-log-parser/SqlFormatterModal.tsx` | Complete |



## Folder Searcher
| # | Feature | Description | Location | Status |
|---|---------|-------------|----------|--------|
| 15 | System Indexing | Manual user-triggered SQLite-based indexing of the entire filesystem. | `src-tauri/src/lib.rs` | Complete |
| 16 | Fast Search | Instant search against the SQLite index with regex support. | `src/tools/folder-searcher/FolderSearcher.tsx` | Complete |
| 17 | Live Scan | Fallback real-time directory traversal for non-indexed paths. | `src/tools/folder-searcher/FolderSearcher.tsx` | Complete |

## Property Renamer
| # | Feature | Description | Location | Status |
|---|---------|-------------|----------|--------|
| 18 | Batch Scanning | Scans JSP, Java, and JS files for property and method patterns. | `src-tauri/src/lib.rs` | Complete |
| 19 | Interactive Mapping | User-defined mapping from old property names to new ones. | `src/tools/property-renamer/PropertyRenamer.tsx` | Complete |
| 20 | Safe Replace | Batch replacement with .bak backup creation and undo support. | `src-tauri/src/lib.rs` | Complete |
