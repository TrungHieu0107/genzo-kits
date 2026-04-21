# Genzo-Kit Core Development Rules

Permanent and non-negotiable.

1. **Structure**: Root = `genzo-kit`. Tools in `src/tools/[kebab-case]`. Modular architecture: Extract logic to `hooks/` and split UI into modular `components/`.
2. **Docs**: After ANY change, update ALL 8 docs files.
3. **Workflows**: New feature → `05`. Bug fix → `06`.
4. **Tech**: Tauri v2, React, TypeScript, TailwindCSS, Framer Motion, Zustand. `genzo-kit.exe`. RAM < 60 MB, startup < 0.6s.
5. **UI**: Dark theme only. Premium aesthetics: Glassmorphism, professional animations, no legacy browser dialogs.
6. **Code**: Strict TypeScript. SOLID principles. High-performance patterns (virtualization).
7. **Testing**: Verify Text Comparator works after every change.
8. **Naming**: Genzo [Tool Name].

**Test Status**: PASS -- April 21, 2026 (Build stability & dependency fix complete).

Last updated: April 2026
