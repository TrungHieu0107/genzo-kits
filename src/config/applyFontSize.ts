// src/config/applyFontSize.ts

/**
 * Applies the font size scale to the DOM via CSS variables.
 * All sizes are derived from the baseSize (body size).
 */
export function applyFontSizeToDOM(baseSize: number) {
  const root = document.documentElement;
  const b = baseSize;

  // Set root font-size for rem-based scaling
  root.style.fontSize = `${b}px`;

  // Scale relative to baseSize via CSS variables
  root.style.setProperty("--fs-nano",       `${b - 3}px`);
  root.style.setProperty("--fs-caption",    `${b - 2}px`);
  root.style.setProperty("--fs-body-sm",    `${b - 1}px`);
  root.style.setProperty("--fs-body",       `${b}px`);
  root.style.setProperty("--fs-body-lg",    `${b + 1}px`);
  root.style.setProperty("--fs-heading-sm", `${b + 1}px`);
  root.style.setProperty("--fs-heading",    `${b + 3}px`);
  root.style.setProperty("--fs-heading-lg", `${b + 5}px`);
  root.style.setProperty("--fs-display",    `${b + 9}px`);
}
