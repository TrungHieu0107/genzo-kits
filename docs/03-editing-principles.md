# Editing Principles

- **Documentation**: Every change → update ALL 8 files in `docs/`.
- **Workflow Policies**: New features → `05`. Bug fixes → `06`. Rules → `07`. Testing → `08`.
- **Modularity**: Tools isolated in `src/tools/`. Registered in `index.ts`.
- **UI Constraints**: TailwindCSS, dark mode, synchronized tables.
- **Performance Hooks**: MUST use `useVirtualizer` for lists > 100 items.
- **Memory Safety**: MUST use `useMonacoManager` for all Monaco editors to ensure model disposal.
- **File I/O**: MUST use `useFileSystem` for all file/dialog interactions.
- **Executable**: `genzo-kit.exe`.

**Test Status**: PASS -- April 23, 2026 (XML Filter TableView TypeError fixed).
