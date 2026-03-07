# Genzo-Kit Overview

Genzo-Kit (version 1.0) is a high-performance developer toolkit built for speed and low RAM usage.
It contains multiple developer tools unified into a single native Desktop application.

**Architecture**:
- Framework: Tauri v2
- Backend: Rust
- Frontend: React + TypeScript + Vite
- Webview: Native WebView2 on Windows
- UI: TailwindCSS + shadcn/ui inspired (dark mode only)

**Core Tools**:
- \`Tool Management Menu\`: A persistent, left-side sidebar (collapsible) that dynamically manages and loads all modular tools.
- \`Text Comparator\` (Genzo Diff): A lightning-fast, highly accurate side-by-side text difference viewer.
- \`Note Editor\`: A VS Code-like desktop text and markdown editor.

**Scripts**:
- \`build.bat\`: Automates the release build.
- \`run.bat\`: Automates running the app in development mode.

**Test Status**: Full feature test passed on March 07, 2026.
