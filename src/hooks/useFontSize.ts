// src/hooks/useFontSize.ts

/**
 * Shorthand styles for using semantic font size tokens.
 * Usage: <span style={fs.caption}>Text</span>
 */
export const fs = {
  nano:      { fontSize: "0.77rem" }, // ~10px
  caption:   { fontSize: "0.85rem" }, // ~11px
  bodySm:    { fontSize: "0.92rem" }, // ~12px
  body:      { fontSize: "1rem"    }, // 13px (Base)
  bodyLg:    { fontSize: "1.08rem" }, // ~14px
  headingSm: { fontSize: "1.08rem" }, // ~14px
  heading:   { fontSize: "1.23rem" }, // ~16px
  headingLg: { fontSize: "1.38rem" }, // ~18px
  display:   { fontSize: "1.69rem" }, // ~22px
} as const;
