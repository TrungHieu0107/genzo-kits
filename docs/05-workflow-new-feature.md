# Genzo-Kit Workflow: New Feature

**Goal:** Add any new feature/tool without EVER breaking or modifying existing features (especially the Text Comparator).

**Mandatory Step-by-Step Process (Antigravity MUST follow this order every single time):**

1. **Analyze & Plan**  
   - Confirm the new feature name and type.  
   - Decide folder name: `src/tools/[kebab-case-name]` (example: `src/tools/json-formatter`).  
   - Ensure it will be modular and isolated.

2. **Create Modular Structure**  
   - Use the `text-comparator` folder as template.  
   - Create new folder and copy only necessary files.  
   - NEVER modify any existing tool files WITHOUT explicit user authorization via string Override keys.
   - Add the new tool to the main navigation using dynamic import only in `src/App.tsx` or `src/tools/index.ts`.

3. **Immediate Documentation Update**  
   - Update `docs/01-project-overview.md` (add the new tool).  
   - Update `docs/02-features.md` (add short description).  
   - Update `docs/03-editing-principles.md` if new rules are needed.  
   - Update `docs/04-current-code.md` (ONLY append the new code section, never overwrite).
   - Touch `docs/05-workflow-new-feature.md`, `docs/06-workflow-fix-bug.md`, `docs/07-core-development-rules.md`, and `docs/08-workflow-test-application.md` to fulfill the 8 docs update rule.

4. **Isolation & Full Test**  
   - Build and test the new tool separately.  
   - Run the entire Genzo-Kit and verify that **ALL previous tools** (especially Text Comparator) still work 100%.
1.  **Analyze & Plan**
    - Confirm the new feature name and type.
    - Decide folder name: `src/tools/[kebab-case-name]` (example: `src/tools/json-formatter`).
    - Ensure it will be modular and isolated.

2.  **Create Modular Structure**
    - Use the `text-comparator` folder as template.
    - Create new folder and copy only necessary files.
    - NEVER modify any existing tool files WITHOUT explicit user authorization via string Override keys.
    - Add the new tool to the main navigation using dynamic import only in `src/App.tsx` or `src/tools/index.ts`.

3.  **Immediate Documentation Update**
    - Update `docs/01-project-overview.md` (add the new tool).
    - Update `docs/02-features.md` (add short description).
    - Update `docs/03-editing-principles.md` if new rules are needed.
    - Update `docs/04-current-code.md` (ONLY append the new code section, never overwrite).
    - Touch `docs/05-workflow-new-feature.md`, `docs/06-workflow-fix-bug.md`, `docs/07-core-development-rules.md`, and `docs/08-workflow-test-application.md` to fulfill the 8 docs update rule.

4.  **Isolation & Full Test**
    - Build and test the new tool separately.
    - Run the entire Genzo-Kit and verify that **ALL previous tools** (especially Text Comparator) still work 100%.

5.  **Final Commit Message Style**
    - `feat: add [tool-name]`

When the user asks to "add a new feature", automatically apply this workflow and reply: "Added using Workflow 05".

**Test Status**: Full feature- **Status**: Tested on March 08, 2026 (including Filtering & File Alias Systems. Fixed BUG-8)
