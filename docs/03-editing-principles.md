# Editing Principles

- **Documentation**: Every change → update ALL 8 files in `docs/`.
- **Workflow Policies**: New features → `05`. Bug fixes → `06`. Rules → `07`. Testing → `08`.
- **Modularity**: Tools isolated in `src/tools/`. Extract business logic into specialized `hooks/` and UI into modular sub-components in `components/`.
- **UI Constraints**: TailwindCSS, dark mode, Framer Motion for premium animations, glassmorphism for backgrounds/headers.
- **Performance Hooks**: MUST use `useVirtualizer` for lists > 50 items.
- **Memory Safety**: MUST use `useMonacoManager` for all Monaco editors to ensure model disposal.
- **File I/O**: MUST use `useFileSystem` for all file/dialog interactions.
- **Premium UX**: Replace legacy browser dialogs (window.prompt) with custom modular dialogs (e.g. AliasModal, FilterModal).
- **Executable**: `genzo-kit.exe`.

**Test Status**: PASS -- April 21, 2026 (Build stability & dependency fix complete).
