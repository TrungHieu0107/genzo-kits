# Frontend Component Structure

This document details the React component architecture of Genzo-Kit.

---

## `App`
**Path:** `src/App.tsx`
**Type:** Layout / Main Entry
**Props:** None
**Responsibilities:** Manages tool switching (Ctrl+Alt+C/N), global shortcuts (Ctrl+Shift+S), and standalone mode.
**Uses:** `ToolSidebar`, `GlobalToast`, `TextComparator`, `NoteEditor`, `SqlLogParser`, `FolderSearcher`, `PropertyRenamer`, `Settings`.
**Tauri calls:** `register()`, `unregister()`.

## `ToolSidebar`
**Path:** `src/tools/tool-manager/ToolSidebar.tsx`
**Type:** UI Component
**Props:** `activeToolId` (string), `onSelectTool` (func), `isCollapsed` (boolean), `onToggleCollapse` (func).
**Responsibilities:** Renders the vertical navigation bar with tool icons and descriptions.
**Uses:** `lucide-react` icons.

## `NoteEditor`
**Path:** `src/tools/note-editor/NoteEditor.tsx`
**Type:** Page Component
**Props:** None
**Responsibilities:** Multi-tab file editor, session persistence, URL fetching, and drag-and-drop tab reordering.
**Uses:** `@monaco-editor/react`, `useNoteEditorStore`.
**Tauri calls:** `load_note_session()`, `save_note_session()`, `fetch_url_content()`, `save_file_encoded()`.

## `SqlLogParser`
**Path:** `src/tools/sql-log-parser/SqlLogParser.tsx`
**Type:** Page Component
**Props:** None
**Responsibilities:** Log file analyst, DAO session visualization, and SQL reconstruction.
**Uses:** `AliasModal`, `FilterModal`, `SqlFormatterModal`, `useSqlLogStore`.
**Tauri calls:** None (Uses `parser.ts` for regex-based parsing).

## `FolderSearcher`
**Path:** `src/tools/folder-searcher/FolderSearcher.tsx`
**Type:** Page Component
**Props:** None
**Responsibilities:** Fast live file/folder explorer with multi-target support.
**Uses:** `StatusBar`, `lucide-react`.
**Tauri calls:** `search_system()`, `search_files()`, `open_path()`.

## `PropertyRenamer`
**Path:** `src/tools/property-renamer/PropertyRenamer.tsx`
**Type:** Page Component
**Props:** None
**Responsibilities:** Context-aware property refactoring across JSP, Java, and JS.
**Uses:** None (Internal UI components).
**Tauri calls:** `collect_files()`, `scan_files()`, `replace_in_files()`, `undo_last_replace()`.

## `Settings`
**Path:** `src/tools/settings/Settings.tsx`
**Type:** Page Component
**Props:** None
**Responsibilities:** User preferences management (Theme, Editor font size, UI scaling).
**Uses:** `useSettingsStore`.
**Tauri calls:** None.

---

## Component Tree

- `App`
  - `ToolSidebar` (Navigation)
  - `GlobalToast` (Notifications)
  - `ActiveComponent` (Dynamic Tool)
    - `TextComparator`
      - `MonacoDiffEditor`
    - `NoteEditor`
      - `MonacoEditor`
    - `SqlLogParser`
      - `AliasModal`
      - `FilterModal`
      - `SqlFormatterModal`
    - `FolderSearcher`
      - `StatusBar`
    - `PropertyRenamer`
    - `Settings`
