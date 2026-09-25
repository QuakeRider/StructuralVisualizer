const MINUS = '−';

/** Format a number for on-screen equations: at most `decimals` places, no trailing zeros, true minus sign. */
export function formatNumber(value, decimals = 2) {
  const rounded = Number(value.toFixed(decimals)) + 0;
  const text = String(Object.is(rounded, -0) ? 0 : rounded);
  return text.startsWith('-') ? `${MINUS}${text.slice(1)}` : text;
}

/** "3²" or "(−4)²": negative values are bracketed so the square is unambiguous. */
export function formatSquared(value, decimals = 2) {
  const text = formatNumber(value, decimals);
  return text.startsWith(MINUS) ? `(${text})²` : `${text}²`;
}

export function formatVector(vector, { dimension = 3, decimals = 2 } = {}) {
  const parts = [vector.x, vector.y, vector.z].slice(0, dimension).map((value) => formatNumber(value, decimals));
  return `(${parts.join(', ')})`;
}
