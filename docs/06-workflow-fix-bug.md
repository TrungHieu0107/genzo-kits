# Genzo-Kit Workflow: Fix Bug

**Goal:** Fix a bug without breaking any working feature.

**Mandatory Step-by-Step Process:**

1. **Identify Root Cause**
   - Understand why the bug happens.
   - Trace the bug specifically to a single tool.

2. **Isolate Changes**
   - Fix the bug only inside the specific tool's folder `src/tools/[kebab-case-name]`.
   - Do NOT edit shared configurations unless absolutely necessary.

3. **Documentation Update**
   - Update `docs/04-current-code.md` with the new corrected code snippets.
   - Do NOT overwrite existing unrelated code snippets.
   - Touch all 8 files in `docs/` to satisfy the update requirement.

4. **Testing**
   - Verify the bug is fixed.
   - Run the entire Genzo-Kit to ensure other features are intact.

5. **Final Commit Message Style**
   - `fix: resolve [bug-description] in [tool-name]`

When the user asks to "fix a bug", automatically apply this workflow and reply: "Done using Workflow 06".

**Test Status**: Full feature- **Status**: Tested on March 08, 2026 (including SQL Filtering System & BUG-8)
 (including SQL Dialect, Parameters, Identity & Formatting fixes).
