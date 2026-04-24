# Editing Principles

- **Documentation**: Every change ↁEupdate ALL 8 files in `docs/`.
- **Workflow Policies**: New features ↁE`05`. Bug fixes ↁE`06`. Rules ↁE`07`. Testing ↁE`08`.
- **Modularity**: Tools isolated in `src/tools/`. Extract business logic into specialized `hooks/` and UI into modular sub-components in `components/`.
- **UI Constraints**: TailwindCSS, dark mode, Framer Motion for premium animations, glassmorphism for backgrounds/headers.
- **Performance Hooks**: MUST use `useVirtualizer` for lists > 50 items.
- **Memory Safety**: MUST use `useMonacoManager` for all Monaco editors to ensure model disposal.
- **File I/O**: MUST use `useFileSystem` for all file/dialog interactions.
- **Premium UX**: Replace legacy browser dialogs (window.prompt) with custom modular dialogs (e.g. AliasModal, FilterModal).
- **Executable**: `genzo-kit.exe`.

**Test Status**: PASS -- April 24, 2026 (Semantic Typography & Dynamic Encoding verified).
