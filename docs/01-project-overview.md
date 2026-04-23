# Genzo-Kit — Project Overview
**Version**: 1.2.0
**Test Status**: PASS -- April 23, 2026 (XML Filter TableView TypeError fixed).

---

## 1. Tổng Quan

**Genzo-Kit** là ứng dụng Desktop đa công cụ (multi-tool), tối ưu cho developer. Được xây dựng trên nền tảng **Tauri v2** (Rust backend + WebView2 frontend), ứng dụng tập trung vào **tốc độ cao**, **RAM thấp**, và trải nghiệm người dùng giống **VS Code / IDE chuyên nghiệp**.

### Đặc điểm chính
- 🚀 **Khởi động nhanh** (dưới 0.6 giây), RAM dưới 60 MB
- 🎨 **Dark theme** mặc định, giao diện IDE chuyên nghiệp
- 🚀 **Genzo Folder Searcher**: High-performance parallel filesystem traversal using Rust `ignore` crate (Virtualized).
- ⚡ **Optimized Performance**: `@tanstack/react-virtual` for large datasets, centralized memory management.
- ✨ **Premium UI/UX**: Framer Motion animations, glassmorphism design, and professional-grade interactions.
- 🧩 **Kiến trúc modular** — mỗi tool là một module độc lập (High-level components & custom hooks).
- 💾 **Offline-first** — không cần internet, mọi dữ liệu lưu local
- 🪟 **Multi-window** — mỗi tool có thể mở trong cửa sổ riêng
- ⌨️ **Keyboard shortcuts** — Ctrl+Shift+S (Settings), Ctrl+Alt+N (Note Editor), Ctrl+Alt+C (Comparator).
- 🔍 **Genzo XML Filter**: Parse and filter large XML files with Shift_JIS support.

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
| **framer-motion** | 11.x | Professional animations & transitions |

### Backend (Rust)
| Crate | Phiên bản | Mục đích |
|:---|:---|:---|
| **tauri** | 2.0 | Desktop framework, IPC, window management |
| **serde / serde_json** | 1.x | Serialization |
| **encoding_rs** | 0.8 | Multi-encoding file read/write (UTF-8, Shift_JIS, v.v.) |
| **regex / rayon / ignore** | — | High-speed search, parallel traversal |
| **quick-xml** | 0.36 | High-performance XML parsing |
| **uuid** | 1.x | Unique ID generation for UI keys |
| **fuzzy-matcher** | 0.3 | Ranked scoring (Skim V2) |
| **directories** | 6.0 | OS-specific directory paths |
| **reqwest** | 0.12 | URL fetching |

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
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Root component
│   ├── index.css                 # Global styles
│   ├── components/               # Shared components
│   └── tools/                    # Tool modules
│       ├── index.ts              # Tool registry (ToolDefinition[])
│       ├── tool-manager/
│       │   └── ToolSidebar.tsx   # Sidebar navigation (collapsible, context menu, open in new window)
│       ├── text-comparator/      # Tool 1
│       │   ├── TextComparator.tsx # Monaco DiffEditor wrapper
│       │   ├── components/
│       │   │   └── ComparatorHeader.tsx
│       │   ├── hooks/
│       │   │   └── useTextComparator.ts
│       │   └── store.ts          # Zustand store cho comparator state
│       ├── note-editor/          # Tool 2
│       │   ├── NoteEditor.tsx    # High-level orchestrator
│       │   ├── store.ts          # Zustand store (files, tabs, session)
│       │   ├── utils.ts          # Icon & language utilities
│       │   ├── hooks/            # Logic abstraction
│       │   │   ├── useNoteEditorSession.ts
│       │   │   └── useNoteEditorCommands.ts
│       │   └── components/       # UI Components
│       │       ├── Sidebar.tsx
│       │       ├── FileItem.tsx
│       │       └── EditorView.tsx
│       ├── sql-log-parser/       # Tool 3 (Modular Refactored)
│       │   ├── SqlLogParser.tsx  # High-level orchestrator
│       │   ├── store.ts          # Zustand store (sessions, filters, aliases)
│       │   ├── hooks/            # Logic abstraction
│       │   │   └── useSqlLogParser.ts
│       │   ├── components/       # UI Components
│       │   │   ├── LogSidebar.tsx
│       │   │   ├── LogToolbar.tsx
│       │   │   └── LogQueryList.tsx
│       │   ├── FilterModal.tsx   # Legacy/Shared Dialog
│       │   ├── AliasModal.tsx    # Legacy/Shared Dialog
│       │   ├── SqlFormatterModal.tsx # Legacy/Shared Dialog
│       │   └── index.ts          # Export
│       ├── folder-searcher/      # Tool 4
│       │   ├── FolderSearcher.tsx # High-level orchestrator
│       │   ├── hooks/            # Logic abstraction
│       │   │   └── useFolderSearch.ts
│       │   └── components/       # UI Components
│       │       ├── SearchHeader.tsx
│       │       ├── SearchOptions.tsx
│       │       ├── ResultsTable.tsx
│       │       └── ActionBar.tsx
│       ├── xml-filter/           # Tool 5 [NEW]
│       │   ├── XmlFilterTool.tsx # Main orchestrator
│       │   ├── store.ts          # Zustand store
│       │   ├── types.ts          # Type definitions
│       │   └── components/       # UI Components
│       │       ├── FileLoader.tsx
│       │       ├── FilterBar.tsx
│       │       ├── ResultSummary.tsx
│       │       ├── TableView.tsx
│       │       └── TreeView.tsx
│       └── settings/             # Tool 6
│           ├── Settings.tsx      # Multi-section settings UI
│           └── store.ts          # Zustand store (general, tool-specific, persist via localStorage)
├── src-tauri/                    # Rust backend
│   ├── Cargo.toml                # Rust dependencies
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   ├── lib.rs                # Tauri commands registration
│   │   ├── modules/              # Specialized logic modules
│   │   └── xml_filter/           # [NEW] XML parsing & filtering logic
├── docs/                         # Documentation (8 files)
└── package.json                  # NPM dependencies
```

---

## 4. Kiến Trúc Ứng Dụng

### 4.1 App Entry Flow
```
main.tsx → App.tsx → ToolSidebar + ActiveComponent
```

### 4.2 Tool Switching
- `App.tsx` duy trì `activeToolId` state.
- `ToolSidebar` render danh sách tools từ `tools[]`.

### 4.3 Standalone Window Mode
- URL param `?window=toolId` → render tool trực tiếp.

### 4.4 State Management Architecture
- Zustand stores cho từng tool độc lập.
- Global config persisted via `tauri-plugin-store`.

---

## 5. Chi Tiết Các Tool

### 5.1 Genzo Text Comparator
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

**Files**: `TextComparator.tsx`, `hooks/useTextComparator.ts`, `components/ComparatorHeader.tsx`, `store.ts`

---

### 5.2 Note Editor
**Mô tả**: Multi-tab code editor phong cách VS Code.

| Tính năng | Mô tả |
|:---|:---|
| Multi-tab editing | Quản lý nhiều file cùng lúc |
| Session persistence | Tự động lưu session qua Rust backend |
| Custom Prompts | Inline animated prompts thay cho native dialogs |
| Drag-and-drop | Kéo thả để sắp xếp lại tabs |
| Premium UX | Framer Motion animations & glassmorphism |

---

### 5.3 Log SQL Extractor
**Mô tả**: Parse log files để tìm DAO sessions, tái dựng SQL queries hoàn chỉnh với parameters.

| Tính năng | Mô tả |
|:---|:---|
| DAO Session Parsing | Nhận diện `Daoの開始` / `Dao của終了` boundaries |
| SQL Reconstruction | Thay thế `?` placeholders bằng actual params (TYPE:INDEX:VALUE) |
| Thread-aware | Hỗ trợ multi-thread logs, stack-based session tracking |
| Filter Modal | Lọc theo DAO name, SQL ID, keyword |
| Alias Modal | Đặt tên alias cho SQL IDs |
| SQL Formatter | Format SQL đẹp bằng `sql-formatter` library |
| Resizable panels | Kéo resize panels (sessions list vs. SQL detail) |
| Syntax highlighting | PrismJS cho SQL syntax |

**Files**: `SqlLogParser.tsx`, `hooks/useSqlLogParser.ts`, `components/LogSidebar.tsx`, `components/LogToolbar.tsx`, `components/LogQueryList.tsx`, `store.ts`

---

### 5.4 Genzo Folder Searcher
**Mô tả**: Tìm kiếm file/folder nhanh gọn bằng cách scan trực tiếp (Live Scan).

| Tính năng | Mô tả |
|:---|:---|
| Live Scan Focused | Scan real-time các thư mục được chỉ định sử dụng BFS |
| Multi-folder Targets | Row-based UI, hỗ trợ nhiều đường dẫn quét cùng lúc |
| Action Bar | Thanh công cụ nổi khi có item được chọn |
| Open in Note Tool | Đọc nội dung file và mở tab mới trong Note Editor |
| Add to Renamer | Inject file vào Property Renamer list và chuyển tab |
| Virtualized Results | Hiển thị hàng ngàn file mượt mà |

**Files**: `FolderSearcher.tsx`, `hooks/useFolderSearch.ts`, `components/SearchHeader.tsx`, `components/SearchOptions.tsx`, `components/ResultsTable.tsx`, `components/ActionBar.tsx`

---

### 5.5 Genzo XML Filter (NEW)
**Mô tả**: Parse and filter large XML files with Shift_JIS support.

| Tính năng | Mô tả |
|:---|:---|
| Shift_JIS Support | Đọc file XML tiếng Nhật (Shift_JIS) không lỗi font |
| Recursive Filter | Lọc theo Tag, Attribute Name, Attribute Value, và Text |
| Table View | Hiển thị danh sách phẳng các kết quả match, có thể expand xem children |
| Tree View | Hiển thị cấu trúc cây XML với highlight các node match |
| Fast Parsing | Sử dụng `quick-xml` ở backend để xử lý file lớn cực nhanh |

---

### 5.6 Property Renamer
**Mô tả**: Công cụ refactor tên thuộc tính (JSP property, Java getter/setter) hàng loạt trong project.

| Tính năng | Mô tả |
|:---|:---|
| Parallel Scan | Quét hàng loạt file bằng Rust Rayon |
| Smart Mapping | Tự động detect JSP property và map sang Java methods |
| Preview Panel | Xem trước thay đổi trước khi apply |
| Virtualized Table | Hỗ trợ hàng ngàn property names không lag |

**Files**: `PropertyRenamer.tsx`, `hooks/usePropertyRenamer.ts`, `components/RenamerSidebar.tsx`, `store.ts`

---

### 5.7 Settings
**Mô tả**: Trang cấu hình đa mục cho toàn bộ ứng dụng.

---

## 6. Rust Backend — Tauri Commands

| Command | Mô tả |
|:---|:---|
| `parse_xml_file` | **[NEW]** Parse XML file sang tree structure (Rust backend) |
| `filter_xml_nodes` | **[NEW]** Lọc recursive tree XML theo query (Rust backend) |
| `read_file_encoded` | Đọc file với encoding tùy chọn |
| `search_system` | Parallel filesystem scan |

---

## 7. Build & Development

```bash
# Dev mode
npm run tauri dev

# Production build (Windows)
cargo tauri build --target x86_64-pc-windows-msvc
```

---

## 8. Quy Tắc Phát Triển

1. **Mỗi tool là 1 folder** trong `src/tools/[kebab-case]` — hoàn toàn độc lập
2. **Không bao giờ sửa tool khác** khi thêm feature mới
3. **Sau mỗi thay đổi**, cập nhật cả 8 file trong `docs/`
4. **Thêm feature mới** → Follow Workflow 05
5. **Dark theme only**, giao diện IDE chuyên nghiệp
6. **TypeScript nghiêm ngặt**, không dùng `any` type
