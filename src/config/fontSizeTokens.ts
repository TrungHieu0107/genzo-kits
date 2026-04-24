// src/config/fontSizeTokens.ts

export const FONT_SIZE_TOKENS = {
  "nano":      "text-xs",    // badge, tag, tooltip
  "caption":   "text-xs",    // table secondary info, timestamps
  "body-sm":   "text-sm",    // sidebar labels, secondary text
  "body":      "text-sm",    // main body text (default)  
  "body-lg":   "text-base",  // emphasized body
  "heading-sm":"text-base",  // section sub-headers
  "heading":   "text-lg",    // panel headers
  "heading-lg":"text-xl",    // page titles
  "display":   "text-2xl",   // hero/tool name display
} as const;

export type FontSizeToken = keyof typeof FONT_SIZE_TOKENS;
