# Implementation Plan: Genzo-Kit Senior Overhaul
## Version: 1.0.0
## Last updated: 2026-04-20
## Project: Genzo-Kit

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive refactor of Genzo-Kit to improve performance, memory usage, and maintainability.

**Architecture:** Use a hook-based approach for shared logic, implement virtualization for large lists, and modularize the Rust backend for better error handling and separation of concerns.

**Tech Stack:** Tauri v2, React 18, TypeScript, Zustand, @tanstack/react-virtual v3, Rust (Rayon, Tokio).

---

### Task 1: Environment Setup
**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install virtualization library**
Run: `npm install @tanstack/react-virtual`
Expected: Library added to dependencies.

- [ ] **Step 2: Commit**
```bash
git add package.json
git commit -m "chore: add @tanstack/react-virtual dependency"
```

---

### Task 2: FolderSearcher Virtualization
**Files:**
- Modify: `src/tools/folder-searcher/FolderSearcher.tsx`

- [ ] **Step 1: Implement virtualization**
Update the rendering logic to use `useVirtualizer`.
```tsx
const parentRef = useRef<HTMLDivElement>(null);
const rowVirtualizer = useVirtualizer({
  count: results.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 40,
  overscan: 5,
});

// Use rowVirtualizer.getVirtualItems() in map
```

- [ ] **Step 2: Verify performance**
Run the app and search for a large folder (e.g., `node_modules`). Scroll through the results.
Expected: Smooth 60fps scrolling.

- [ ] **Step 3: Commit**
```bash
git add src/tools/folder-searcher/FolderSearcher.tsx
git commit -m "perf: virtualize FolderSearcher result list"
```

---

### Task 3: Shared FileSystem Hook
**Files:**
- Create: `src/hooks/useFileSystem.ts`

- [ ] **Step 1: Implement useFileSystem**
Extract `fs`, `path`, and `dialog` calls into a clean hook.
```typescript
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { open, save } from '@tauri-apps/plugin-dialog';

export function useFileSystem() {
  const readFile = async (path: string) => { /* logic */ };
  const writeFile = async (path: string, content: string) => { /* logic */ };
  return { readFile, writeFile, open, save };
}
```

- [ ] **Step 2: Commit**
```bash
git add src/hooks/useFileSystem.ts
git commit -m "refactor: create centralized useFileSystem hook"
```

---

### Task 4: Monaco Model Management
**Files:**
- Create: `src/hooks/useMonacoManager.ts`

- [ ] **Step 1: Implement Model Disposal logic**
Create a hook to manage Monaco models and ensure they are disposed of on tab close.
```typescript
import { useMonaco } from '@monaco-editor/react';

export function useMonacoManager() {
  const monaco = useMonaco();
  const disposeModel = (uri: string) => {
    const model = monaco?.editor.getModel(window.monaco.Uri.parse(uri));
    model?.dispose();
  };
  return { disposeModel };
}
```

- [ ] **Step 2: Integrate into NoteEditor**
Call `disposeModel` when a file is removed from the `files` list.

- [ ] **Step 3: Commit**
```bash
git add src/hooks/useMonacoManager.ts src/tools/note-editor/NoteEditor.tsx
git commit -m "perf: implement explicit monaco model disposal"
```

---

### Task 5: Backend Modularization
**Files:**
- Create: `src-tauri/src/modules/mod.rs`, `src-tauri/src/modules/fs_utils.rs`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Move FS logic to module**
Extract filesystem and search logic into `src-tauri/src/modules/`.

- [ ] **Step 2: Standardize Result conversion**
Implement a trait or helper for consistent error mapping to `String`.

- [ ] **Step 3: Commit**
```bash
git add src-tauri/src/modules/ src-tauri/src/lib.rs
git commit -m "refactor: modularize rust backend and standardize errors"
```

---

### Task 6: Final Verification
- [ ] **Step 1: Full Build**
Run: `cargo tauri build --target x86_64-pc-windows-msvc`
- [ ] **Step 2: Memory Audit**
Open multiple tools, check RAM. Close files, check RAM return.
