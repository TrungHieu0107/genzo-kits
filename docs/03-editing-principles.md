# Editing Principles

- **Documentation**: Every time there is a request to change code in Genzo-Kit, ALL 8 files in \`docs/\` MUST be completely updated.
- **Workflow Policies**:
  - New features must follow \`05-workflow-new-feature.md\`.
  - Bug fixes must follow \`06-workflow-fix-bug.md\`.
  - Global rules are enforced by \`07-core-development-rules.md\`.
  - Testing is required by \`08-workflow-test-application.md\`.
- **Modularity**: Never break existing tools when adding a new one. All tools must reside in \`src/tools/\`. Each tool is strictly isolated and only registered inside \`src/tools/index.ts\`. Note: Explicit user override is required and recorded before mutating any core tool implementation directly.
- **UI Constraints**: Always rely on TailwindCSS for styling and ensure dark mode adherence. Keep interfaces simple and clean, removing visual clutter (like Tab bars) when requested.
- **Executable**: Final build target is ALWAYS \`genzo-kit.exe\`.

**Test Status**: Full feature- **Status**: Tested on March 08, 2026
 (including Text Comparator Highlight Refinements).
