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
- 🧩 **Kiến trúc modular** — mỗi tool là một module độc lập
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
│       ├── index.ts              # Tool registry
│       ├── tool-manager/         # Sidebar & window management
│       ├── text-comparator/      # Genzo Text Comparator
│       ├── note-editor/          # Note Editor
│       ├── sql-log-parser/       # Log SQL Extractor
│       ├── folder-searcher/      # Genzo Folder Searcher
│       ├── xml-filter/           # [NEW] Genzo XML Filter
│       └── settings/             # Settings
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

---

### 5.2 Note Editor
**Mô tả**: Multi-tab code editor phong cách VS Code.

---

### 5.3 Log SQL Extractor
**Mô tả**: Parse log files để tìm DAO sessions, tái dựng SQL queries.

---

### 5.4 Genzo Folder Searcher
**Mô tả**: Tìm kiếm file/folder nhanh gọn bằng cách scan trực tiếp (Live Scan).

---

### 5.5 Genzo XML Filter (NEW)
**Mô tả**: Parse and filter large XML files with Shift_JIS support.

| Tính năng | Mô tả |
|:---|:---|
| **Shift_JIS Support** | Đọc file XML tiếng Nhật (Shift_JIS) không lỗi font |
| **Recursive Filter** | Lọc theo Tag, Attribute Name, Attribute Value, và Text |
| **Table View** | Hiển thị danh sách phẳng các kết quả match, có thể expand xem children |
| **Tree View** | Hiển thị cấu trúc cây XML với highlight các node match |
| **Fast Parsing** | Sử dụng `quick-xml` ở backend để xử lý file lớn cực nhanh |

---

### 5.6 Settings
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
