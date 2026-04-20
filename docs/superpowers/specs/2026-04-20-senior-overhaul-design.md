# Design Specification: Genzo-Kit Senior Overhaul
## Version: 1.0.0
## Last updated: 2026-04-20
## Project: Genzo-Kit

### 1. Goal
Comprehensive refactor of Genzo-Kit to ensure "Senior-level" code quality, ultra-low memory usage, and peak performance when handling large datasets.

### 2. Proposed Changes

#### A. Frontend: Virtualization & Optimization
- **Library**: Add `@tanstack/react-virtual` v3.
- **Components**: 
  - `FolderSearcher.tsx`: Virtualize the file result list.
  - `PropertyRenamer.tsx`: Virtualize the property/file list.
- **State**: Use shallow selectors in Zustand to minimize re-renders.

#### B. Frontend: Shared Hooks Architecture
- **NEW** `src/hooks/useFileSystem.ts`: Centralized logic for `fs`, `path`, and `dialog` plugins.
- **NEW** `src/hooks/useMonacoManager.ts`: Logic for model creation, retrieval, and explicit disposal to prevent memory leaks.
- **Refactor**: Update `NoteEditor.tsx`, `TextComparator.tsx`, and `SqlLogParser` to use these hooks.

#### C. Backend: Rust Standardization
- **Error Handling**: Implement a unified `to_app_error` conversion for all `Result` types.
- **Modularity**: Move heavy logic from `lib.rs` into specialized modules in `src-tauri/src/`.
- **Async/Parallel**: Ensure all I/O bound commands use `tokio` tasks and CPU bound ones use `rayon`.

#### D. Directory Structure Cleanup
- Move all custom hooks to `src/hooks/`.
- Ensure all tool folders follow `kebab-case`.
- Ensure all components follow `PascalCase`.

### 3. Verification Plan
- **Performance**: Scroll through 5000+ items in `FolderSearcher` without frame drops.
- **Memory**: Open and close 10+ large files in `NoteEditor` and verify RAM returns to baseline.
- **Build**: Successful build with `cargo tauri build`.
- **Functionality**: Smoke test all 5+ tools.

### 4. Implementation Roadmap
1. **Setup**: Add dependencies (`@tanstack/react-virtual`).
2. **Phase 1**: Virtualization implementation.
3. **Phase 3**: Hooks extraction & Component refactoring.
4. **Phase 4**: Rust backend modularization & Error handling.
5. **Phase 5**: Documentation & Cleanup.
