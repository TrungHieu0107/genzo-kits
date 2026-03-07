# Features

**Global**:
- Extremely lightweight and fast startup.
- Modular tool architecture for easy expansion.
- Dark theme only.
- Utility scripts (\`build.bat\`, \`run.bat\`) for fast development and deployment.
- *Tested and verified on March 07, 2026*

**Tool Management Menu** (\`src/tools/tool-manager\`):
- Fixed sidebar layout integrating smoothly with main content
- **Collapsible sidebar**: Collapse to icon-only mode to save screen real estate.
- Dynamic tool list populated directly from \`src/tools/index.ts\`
- Selected state and collapsed state retention using \`localStorage\`
- Smooth, aesthetic tool switching without full app reload
- Add New Tool entry point stub

**Text Comparator** (\`src/tools/text-comparator\`):
1. **Load/Paste Text**: Load local files (JSON, JS, Java, TXT, MD, etc.) or paste from clipboard.
2. **Side-by-side Diff**: Two panels highlighting Added (green), Removed (red), and Modified (yellow) lines.
3. **Syntax Highlighting**: Beautiful syntax colors (via PrismJS).
4. **Synchronized Scroll**: The two panels scroll perfectly in sync.
5. **Clear Summary**: Bottom bar showing exactly how many lines were added, removed, or modified.
6. **Export Diff**: Capability to export the comparison to HTML or TXT.

**Note Editor** (\`src/tools/note-editor\`):
1. **File Explorer**: VS Code-style left sidebar to select a folder and display `.md` and `.txt` files.
2. **Monaco Editor Integration**: Powerful code editing experience powered by `@monaco-editor/react`.
3. **Local Persistence**: Ability to open and save files directly to the local file system.
4. **Shortcuts**: Ctrl+S bound to local save, alongside all default Monaco shortcut features (find, replace, line operations).
