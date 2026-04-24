// src/hooks/useFontSize.ts

/**
 * Shorthand styles for using semantic font size tokens.
 * Usage: <span style={fs.caption}>Text</span>
 */
export const fs = {
  nano:      { fontSize: "var(--fs-nano)"       },
  caption:   { fontSize: "var(--fs-caption)"    },
  bodySm:    { fontSize: "var(--fs-body-sm)"    },
  body:      { fontSize: "var(--fs-body)"       },
  bodyLg:    { fontSize: "var(--fs-body-lg)"    },
  headingSm: { fontSize: "var(--fs-heading-sm)" },
  heading:   { fontSize: "var(--fs-heading)"    },
  headingLg: { fontSize: "var(--fs-heading-lg)" },
  display:   { fontSize: "var(--fs-display)"    },
} as const;
