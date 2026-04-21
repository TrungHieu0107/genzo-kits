# Genzo-Kit — Project Overview
**Version**: 1.1.0
**Test Status**: PASS -- April 21, 2026 (Build stability & dependency fix complete).

---

## 1. Tổng Quan

**Genzo-Kit** là ứng dụng Desktop đa công cụ (multi-tool), tối ưu cho developer. Được xây dựng trên nền tảng **Tauri v2** (Rust backend + WebView2 frontend), ứng dụng tập trung vào **tốc độ cao**, **RAM thấp**, và trải nghiệm người dùng giống **VS Code / IDE chuyên nghiệp**.

### Đặc điểm chính
- 🚀 **Khởi động nhanh** (dưới 0.6 giây), RAM dưới 60 MB
- 🎨 **Dark theme** mặc định, giao diện IDE chuyên nghiệp
- 🚀 **Genzo Folder Searcher**: High-performance parallel filesystem traversal using Rust `ignore` crate (Virtualized).
- ⚡ **Optimized Performance**: `@tanstack/react-virtual` for large datasets, centralized memory management.
- 🧩 **Kiến trúc modular** — mỗi tool là một module độc lập
- 💾 **Offline-first** — không cần internet, mọi dữ liệu lưu local
- 🪟 **Multi-window** — mỗi tool có thể mở trong cửa sổ riêng
- ⌨️ **Keyboard shortcuts** — Ctrl+Shift+S (Settings), Ctrl+Alt+N (Note Editor), Ctrl+Alt+C (Comparator).

---

## 2. Công Nghệ Sử Dụng

### Frontend
| Thư viện | Phiên bản | Mục đích |
|:---|:---|:---|
| **React** | 18.2 | UI framework |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 5.4 | Bundler + dev server |
| **TailwindCSS** | 3.4 | Styling |
| **Monaco Editor** | 4.7 | Code editor (dùng trong TextComparator & NoteEditor) |
| **Zustand** | 5.0 | State management (global config, settings, note-editor state) |
| **Lucide React** | 0.300 | Icon library |
| **sql-formatter** | 15.7 | SQL formatting (dùng trong SqlLogParser) |
| **diff** | 5.2 | Text diff engine |
| **PrismJS** | 1.30 | Syntax highlighting (dùng trong SqlLogParser) |
| **clsx / tailwind-merge** | — | Class name utilities |

| **tauri** | 2.0 | Desktop framework, IPC, window management |
| **serde / serde_json** | 1.x | Serialization |
| **encoding_rs** | 0.8 | Multi-encoding file read/write (UTF-8, Shift_JIS, Windows-1252, UTF-16LE) |
| **regex / rayon / ignore** | — | High-speed search, parallel traversal, git-aware scanning |
| **fuzzy-matcher** | 0.3 | Ranked scoring (Skim V2) |
| **directories** | 6.0 | OS-specific directory paths |
| **reqwest** | 0.12 | URL fetching (dùng để mở file từ URL trong Note Editor) |

### Tauri Plugins
| Plugin | Mục đích |
|:---|:---|
| `tauri-plugin-dialog` | Native file open/save dialog |
| `tauri-plugin-fs` | File system access |
| `tauri-plugin-clipboard-manager` | Clipboard read/write |
| `tauri-plugin-global-shortcut` | Global keyboard shortcuts |
| `tauri-plugin-store` | Persistent key-value store |

---

## 3. Cấu Trúc Thư Mục

```
genzo-kit/
├── src/                          # Frontend source
│   ├── main.tsx                  # React entry point (StrictMode)
│   ├── App.tsx                   # Root component (sidebar + tool routing + global shortcuts)
│   ├── index.css                 # Global styles (TailwindCSS, dark scrollbars)
│   ├── components/               # Shared components
│   │   ├── configStore.ts        # Zustand store — global editor config (theme, fontSize, encoding...)
│   │   ├── toastStore.ts         # Zustand store — toast notification system
│   │   ├── GlobalToast.tsx       # Toast UI component (6 vị trí khác nhau)
│   │   ├── StatusBar.tsx         # VS Code-style status bar (language, encoding, whitespace toggles)
│   │   └── useEditorConfig.ts    # Hook lấy Monaco editor options từ configStore
│   └── tools/                    # Tool modules
│       ├── index.ts              # Tool registry (ToolDefinition[])
│       ├── tool-manager/
│       │   └── ToolSidebar.tsx   # Sidebar navigation (collapsible, context menu, open in new window)
│       ├── text-comparator/      # Tool 1
│       │   ├── TextComparator.tsx # Monaco DiffEditor wrapper
│       │   └── store.ts          # Zustand store cho comparator state
│       ├── note-editor/          # Tool 2
│       │   ├── NoteEditor.tsx    # Multi-tab code editor
│       │   └── store.ts          # Zustand store (files, tabs, session)
│       ├── sql-log-parser/       # Tool 3
│       │   ├── SqlLogParser.tsx  # Main UI component
│       │   ├── parser.ts         # Log parsing engine (DAO session extraction + SQL reconstruction)
│       │   ├── store.ts          # Zustand store (sessions, filters, aliases)
│       │   ├── FilterModal.tsx   # Advanced filter dialog
│       │   ├── AliasModal.tsx    # ID alias management dialog
│       │   ├── SqlFormatterModal.tsx # SQL formatter dialog
│       │   └── index.ts          # Export
│       ├── folder-searcher/      # Tool 4
│       │   └── FolderSearcher.tsx # Modern live-scan file/folder searcher
│       └── settings/             # Tool 5
│           ├── Settings.tsx      # Multi-section settings UI
│           └── store.ts          # Zustand store (general, tool-specific, persist via localStorage)
├── src-tauri/                    # Rust backend
│   ├── Cargo.toml                # Rust dependencies
│   ├── tauri.conf.json           # Tauri config (window 1200×800, identifier com.genzokit.dev)
│   ├── src/
│   │   ├── main.rs               # Entry point (calls lib::run)
│   │   ├── lib.rs                # All Tauri commands (800+ lines)
│   │   ├── search.rs             # Optimized parallel search module
│   │   └── sql_parser.rs         # High-performance SQL log parsing (Rust + Rayon)
│   ├── capabilities/             # Tauri v2 permission capabilities
│   └── icons/                    # App icons
├── docs/                         # Documentation (8 files)
├── public/                       # Static assets (logo.png)
└── package.json                  # NPM dependencies
```

---

## 4. Kiến Trúc Ứng Dụng

### 4.1 App Entry Flow
```
main.tsx → App.tsx → ToolSidebar + ActiveComponent
                   ↓
             useEffect on mount:
             1. loadConfig() from tauri-plugin-store
             2. Check ?window=X for standalone mode
             4. Register Ctrl+Shift+S global shortcut
```

### 4.2 Tool Switching
- `App.tsx` duy trì `activeToolId` state (persisted via `localStorage`)
- `ToolSidebar` render danh sách tools từ `tools[]` array
- Click tool → `setActiveToolId(id)` → render `<ActiveComponent />`
- Right-click → context menu → "Open in new window" via `WebviewWindow`

### 4.3 Standalone Window Mode
- URL param `?window=toolId` → render tool trực tiếp (không sidebar)
- Sử dụng `WebviewWindow` API từ Tauri v2

### 4.4 State Management Architecture
```
┌─────────────────────────────────────────────┐
│              Zustand Stores                  │
├─────────────────────────────────────────────┤
│ configStore.ts    → Global editor config     │
│                     (tauri-plugin-store)      │
│ appStore.ts       → App navigation & UI state│
│ toastStore.ts     → Toast notifications      │
│ settings/store.ts → App settings             │
│                     (zustand/persist)         │
│ property-renamer/st → Renamer state          │
│ note-editor/store → Tab/file state           │
│ sql-log-parser/st → Parser state             │
│ text-comparator/s → Comparator state         │
├─────────────────────────────────────────────┤
│ FolderSearcher    → LazyStore (plugin-store)  │
│                     Settings persistence      │
└─────────────────────────────────────────────┘
```

---

## 5. Chi Tiết Các Tool

### 5.1 Text Comparator (`text-comparator/`)
**Mô tả**: Side-by-side text difference viewer sử dụng Monaco DiffEditor.

| Tính năng | Mô tả |
|:---|:---|
| Monaco DiffEditor | So sánh side-by-side với syntax highlighting |
| File load | Mở file từ hệ thống qua native dialog |
| Clipboard paste | Dán nội dung từ clipboard vào left/right panel |
| Inline decorations | Custom decorations cho diff highlights |
| Whitespace toggle | Bật/tắt hiển thị whitespace, bật/tắt ignore whitespace trong diff |
| Encoding support | Independent per-pane (UTF-8, Shift_JIS, v.v.) |
| StatusBar | Hiển thị file name, language, encoding |

**Files**: `TextComparator.tsx` (248 lines), `store.ts` (496 bytes)

---

### 5.2 Note Editor (`note-editor/`)
**Mô tả**: Multi-tab code editor phong cách VS Code.

| Tính năng | Mô tả |
|:---|:---|
| Multi-tab | Mở nhiều file cùng lúc với tab bar |
| Session persistence | Tự động lưu/restore session qua Rust backend (`save_note_session` / `load_note_session`) |
| File operations | Open, Save, Save As qua native dialog |
| Encoding handling | Đọc/ghi file với encoding cụ thể qua Rust (`read_file_encoded` / `save_file_encoded`) |
| Keyboard shortcuts | Ctrl+S (save), Ctrl+N (new), Ctrl+O (open), Ctrl+W (close tab), Ctrl+Shift+T (reopen) |
| Auto language detect | Tự động detect ngôn ngữ từ extension file (.ts → typescript, .py → python, v.v.) |
| Tab management | Pin tabs, close all, close other, drag-reorder |
| File icons | Icon động theo ngôn ngữ (JS, TS, JSON, Python, Java, HTML, CSS, v.v.) |
| Dirty state | Hiển thị dot indicator khi file chưa lưu |
| Binary detection | Phát hiện file binary và hiển thị cảnh báo |
| Open from URL | Cho phép fetch nội dung từ URL và mở trực tiếp trong Note Editor qua Rust backend |
| Drag-and-drop reorder | Kéo thả để sắp xếp lại vị trí các tab trong sidebar |

**Files**: `NoteEditor.tsx` (495 lines), `store.ts` (156 lines)

**Zustand Store (`store.ts`)**:
- `EditorFile`: id, path, name, content, isDirty, language, encoding, isPinned
- Actions: openFile, createFile, closeFile, closeAll, closeOther, updateContent, updateEncoding, updateLanguage, togglePin, hydrateSession

---

### 5.3 Log SQL Extractor (`sql-log-parser/`)
**Mô tả**: Parse log files để tìm DAO sessions, tái dựng SQL queries hoàn chỉnh với parameters.

| Tính năng | Mô tả |
|:---|:---|
| DAO Session Parsing | Nhận diện `Daoの開始` / `Daoの終了` boundaries |
| SQL Reconstruction | Thay thế `?` placeholders bằng actual params (TYPE:INDEX:VALUE) |
| Thread-aware | Hỗ trợ multi-thread logs, stack-based session tracking |
| Filter Modal | Lọc theo DAO name, SQL ID, keyword |
| Alias Modal | Đặt tên alias cho SQL IDs |
| SQL Formatter | Format SQL đẹp bằng `sql-formatter` library |
| Resizable panels | Kéo resize panels (sessions list vs. SQL detail) |
| Encoding reload | Đổi encoding và reload nội dung file |
| Copy to clipboard | Click-to-copy SQL queries |
| Syntax highlighting | PrismJS cho SQL syntax |

**Files**: `SqlLogParser.tsx` (482 lines), `parser.ts` (215 lines), `store.ts` (6021 bytes), `FilterModal.tsx`, `AliasModal.tsx`, `SqlFormatterModal.tsx`, `index.ts`

**Parser Engine (Optimized)**:
- **Rust Backend (`sql_parser.rs`)**: Thực hiện parsing bằng Regex trong Rust, song song hóa bằng `rayon`. Loại bỏ UI freeze hoàn toàn (Fix PERF-001/003).
- **SQL Reconstruction**: Tái dựng SQL query hoàn chỉnh trực tiếp từ backend, giảm tải cho frontend.
- **Async Workflow**: Frontend (`parser.ts`) gọi async command, đảm bảo UI luôn phản hồi.
- **Output**: `DaoSession[]` chứa `LogEntry[]` với `reconstructedSql`.

---

### 5.4 Genzo Folder Searcher (`folder-searcher/`)
**Mô tả**: Tìm kiếm file/folder nhanh gọn bằng cách scan trực tiếp các thư mục đích (Genzo Folder Searcher).

| Tính năng | Mô tả |
|:---|:---|
| **Live Scan Focused** | Scan real-time các thư mục được chỉ định sử dụng BFS (Breadth-First Search) |
| **Recursive Strategy** | Tự động quét sâu vào các thư mục con với giới hạn 500 kết quả |
| **Resizable Columns** | Kéo resize cột Name, Base Path, Modified |
| **Full-Width Layout** | Sử dụng toàn bộ chiều rộng |
| **Collapsible Options** | Thu gọn Target Directories thành "Options" |
| **Multi-folder Targets** | Row-based UI, hỗ trợ nhiều đường dẫn quét cùng lúc |
| **Smart Labels** | Hiển thị chế độ "Live Search Mode" trong Header |
| **Settings Persistence** | rootDirs, query, mode, useRegex, useCache, isOptionsCollapsed — lưu qua `tauri-plugin-store` |
| **Search Modes** | All / File only / Folder only |
| **Pattern Support** | Plain text, glob wildcards (*, ?), regex |
| **Multi-Selection** | Chọn nhiều file/folder bằng checkbox |
| **Action Bar** | Thanh công cụ nổi khi có item được chọn |
| **Open in Note Tool** | Đọc nội dung file và mở tab mới trong Note Editor |
| **Add to Renamer** | Inject file vào Property Renamer list và chuyển tab |
| **Double-click Open** | Mở file/folder bằng ứng dụng mặc định |
| **Click-to-Copy** | Copy đường dẫn vào clipboard |

**Files**: `FolderSearcher.tsx` (610 lines) — Branding updated to "Genzo Folder Searcher".

**Search Flow**:
```
User types → handleSearch()
  ├── Cache hit? → Show cached results + revalidate in background
  └── invoke('search_system') → Live BFS scan on selected targets
```

---

### 5.5 Settings (`settings/`)
**Mô tả**: Trang cấu hình đa mục cho toàn bộ ứng dụng.

| Section | Cấu hình |
|:---|:---|
| **General** | Language, Theme (vs-dark/vs-light), Toast position (6 vị trí) |
| **Editor** | Font size, Font family, Word wrap, Minimap |
| **Text Comparator** | Include whitespace, Show row highlight |
| **Note Editor** | Default encoding |

**Files**: `Settings.tsx` (255 lines), `store.ts` (105 lines)

**Store**: Zustand + `zustand/persist` middleware → persisted to `localStorage` key `genzo-settings-storage`

---

## 6. Rust Backend — Tauri Commands

File: `src-tauri/src/lib.rs` (625 lines, 12 commands)

| Command | Mô tả |
|:---|:---|
| `greet` | Hello world test command |
| `read_file_encoded` | Đọc file với encoding tùy chọn, giới hạn 20MB để tránh OOM (Fix PERF-002) |
| `save_file_encoded` | Ghi file với encoding tùy chọn |
| `save_note_session` | Lưu session Note Editor ra `note_session.json` |
| `load_note_session` | Load session Note Editor từ disk |
| `search_system` | Parallel filesystem scan using `ignore` crate (Fix PERF-007) |
| `open_path` | Mở file/folder bằng ứng dụng mặc định |
| `fetch_url_content` | Fetch nội dung text từ web URL |
| `build_regex` | Centralized regex building with glob-to-regex auto-conversion |
| `parse_sql_logs_rust`| **[NEW]** High-speed SQL parsing via Rust + Rayon (Fix PERF-001) |
| `scan_files` | **[OPTIMIZED]** Parallel property scanning using Rayon (Fix PERF-006) |

### Helper Functions
| Function | Mô tả |
|:---|:---|
| `format_system_time` | Convert UNIX timestamp → readable datetime string |
| `glob_to_regex` | Convert glob pattern (*, ?) → regex |

### Structs
| Struct | Fields |
|:---|:---|
| `SafeFileResponse` | content, is_binary, error |
| `SearchResultItem` | path, name, base_path, modified, is_dir |

---

## 7. Shared Components

| Component | File | Mô tả |
|:---|:---|:---|
| `GlobalToast` | `components/GlobalToast.tsx` | Hiển thị toast notification (success/error/info) tại 6 vị trí, auto-hide 3s |
| `StatusBar` | `components/StatusBar.tsx` | VS Code-style status bar: file name, language selector (24 ngôn ngữ), encoding selector, whitespace/diff toggles |
| `configStore` | `components/configStore.ts` | Zustand store cho global editor config (theme, font, whitespace, tabSize, encoding, wordWrap). Persisted qua `tauri-plugin-store` → file `editor_config.json` |
| `toastStore` | `components/toastStore.ts` | Zustand store cho toast system (showToast, hideToast, auto-timeout 3s) |
| `useEditorConfig` | `components/useEditorConfig.ts` | React hook chuyển đổi configStore → Monaco editor options object |
| `ToolSidebar` | `tools/tool-manager/ToolSidebar.tsx` | Sidebar navigation: collapsible (68px/280px), active indicator, context menu → open in new window via `WebviewWindow` |

---

## 8. Persistence & Data Flow

| Dữ liệu | Cơ chế | File/Key |
|:---|:---|:---|
| Active tool | `localStorage` | `genzoActiveTool` |
| Sidebar collapsed | `localStorage` | `genzoSidebarCollapsed` |
| App settings | Zustand persist → `localStorage` | `genzo-settings-storage` |
| Editor config | `tauri-plugin-store` | `editor_config.json` |
| Note Editor session | Rust IPC → file | `note_session.json` |
| Folder Searcher settings | `tauri-plugin-store` (LazyStore) | `folder_searcher.json` |
| Property Renamer state | Zustand | `propertyRenamerStore` |

---

## 9. Build & Development

```bash
# Dev mode
npm run tauri dev

# Production build (Windows)
cargo tauri build --target x86_64-pc-windows-msvc

# Output executable
genzo-kit.exe
```

### Tauri Config
- **Product Name**: Genzo-Kit
- **Identifier**: `com.genzokit.dev`
- **Window**: 1200 × 800, resizable, with decorations
- **Dev URL**: `http://localhost:1420`

---

## 10. Quy Tắc Phát Triển

1. **Mỗi tool là 1 folder** trong `src/tools/[kebab-case]` — hoàn toàn độc lập
2. **Không bao giờ sửa tool khác** khi thêm feature mới
3. **Sau mỗi thay đổi**, cập nhật cả 8 file trong `docs/`
4. **Thêm feature mới** → Follow Workflow 05
5. **Sửa bug** → Follow Workflow 06
6. **Dark theme only**, giao diện IDE chuyên nghiệp
7. **TypeScript nghiêm ngặt**, không dùng `any` type
8. **Error handling rõ ràng**, không swallow errors
