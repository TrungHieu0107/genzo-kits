# Genzo-Kit Workflow: Fix Bug

**Goal**: Fix any bug without introducing new ones.

**Steps:**
1. **Identify Root Cause**  ETrace to a single tool. Confirm the bug with clear reproduction steps.
2. **Analyze**  EAnalyze the code to find the exact root cause (e.g. incorrect property access, state race condition).
3. **Isolate & Refactor**  EFix only inside `src/tools/[tool]`. If needed, refactor to modular architecture (extract hooks, split components). Ensure UI remains premium.
4. **Documentation Update**  EUpdate ALL 8 docs files to reflect the fix and update Test Status.
5. **Testing**  EVerify fix, ensure other features intact. Check for regressions in related tools.
6. **Commit**  E`fix: [tool-name] - [short description]` (e.g. `fix: xml-filter - resolve expansion type error`).

Reply: "Fixed using Workflow 06".

**Test Status**: PASS -- April 24, 2026 (XML Filter Dynamic Spreadsheet Grid implemented and tested).
