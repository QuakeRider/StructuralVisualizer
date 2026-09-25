const MINUS = '−';

/** Format a number for on-screen equations: at most `decimals` places, no trailing zeros, true minus sign. */
export function formatNumber(value, decimals = 2) {
  const rounded = Number(value.toFixed(decimals)) + 0;
  const text = String(Object.is(rounded, -0) ? 0 : rounded);
  return text.startsWith('-') ? `${MINUS}${text.slice(1)}` : text;
}
