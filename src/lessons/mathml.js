// Small builder for MathML equations. Lesson files write equations with these
// helpers so they render as formal math (bold vectors, radicals, fractions,
// accents) in the browser's native MathML engine, with no library.
//
// Binding attributes: `ref` → data-scene-ref (the scene object a symbol maps
// to), `sym` → data-sym (a focusable, described symbol), `live` → data-live (a
// value main.js fills in). Every builder returns a MathML string.

import { formatNumber } from '../domain/format.js';

const MATH_BOLD = {
  a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', m: '𝐦', n: '𝐧', r: '𝐫', s: '𝐬', t: '𝐭', u: '𝐮', v: '𝐯', x: '𝐱',
  F: '𝐅', T: '𝐓',
  σ: '𝛔', τ: '𝛕',
};

function escapeText(text) {
  return String(text).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);
}

function attributes({ ref, sym, live, cls } = {}) {
  let result = '';
  if (ref) result += ` data-scene-ref="${ref}"`;
  if (sym) result += ' data-sym=""';
  if (live) result += ` data-live="${live}"`;
  if (cls) result += ` class="${cls}"`;
  return result;
}

const element = (tag) => (text, options) => `<${tag}${attributes(options)}>${escapeText(text)}</${tag}>`;

export const mi = element('mi');
export const mn = element('mn');
export const mo = element('mo');
export const mtext = element('mtext');

export const row = (...children) => `<mrow>${children.join('')}</mrow>`;
export const sub = (base, script) => `<msub>${base}${script}</msub>`;
export const sup = (base, script) => `<msup>${base}${script}</msup>`;
export const subsup = (base, subscript, superscript) => `<msubsup>${base}${subscript}${superscript}</msubsup>`;
/** A primed component such as v′ₓ: the component along a turned axis. */
export const primed = (base, axis) => subsup(mi(base), mi(axis), mo('′'));
export const sqrt = (...children) => `<msqrt>${children.join('')}</msqrt>`;
export const frac = (numerator, denominator) => `<mfrac>${numerator}${denominator}</mfrac>`;
export const paren = (...children) => row(mo('('), ...children, mo(')'));
export const abs = (...children) => row(mo('|', { cls: 'fence' }), ...children, mo('|', { cls: 'fence' }));
export const hat = (base) => `<mover accent="true">${base}<mo>^</mo></mover>`;
export const overbar = (base) => `<mover accent="true">${base}<mo>‾</mo></mover>`;

/** A bold (upright) vector letter, the textbook convention for vectors. */
export function vec(letter) {
  const bold = MATH_BOLD[letter];
  if (!bold) throw new RangeError(`No bold math letter for "${letter}"`);
  return mi(bold);
}

/** Unit basis vectors î, ĵ, k̂ (dotless i and j under a hat). */
export const basis = {
  i: hat(mi('ı')),
  j: hat(mi('ȷ')),
  k: hat(mi('k')),
};

/** Wrap content as a bound symbol: focusable, highlightable, described in the key. */
export const bound = (ref, ...children) => `<mrow${attributes({ ref, sym: true })}>${children.join('')}</mrow>`;

/** A slot that main.js fills with a live value (MathML or text). */
export const live = (key, ref) => `<mrow${attributes({ live: key, ref })}></mrow>`;

/** A column vector: items stacked in stretched parentheses. */
export const column = (...items) => paren(`<mtable>${items.map((item) => `<mtr><mtd>${item}</mtd></mtr>`).join('')}</mtable>`);

/** Comma-separated list, e.g. the components of a vector. */
export const list = (...items) => items.flatMap((item, index) => (index ? [mo(','), item] : [item])).join('');

/**
 * One left-aligned line of display-style math (native block math is always
 * centered, so each line is inline math in its own block). `inline` is for
 * math inside prose.
 */
export const math = (...children) => `<div class="math-line"><math displaystyle="true">${children.join('')}</math></div>`;
export const inline = (...children) => `<math>${children.join('')}</math>`;

/* ---------- Live-value formatters (numbers → MathML) ---------- */

export const num = (value, decimals = 2) => mn(formatNumber(value, decimals));

/** A number to be squared: negatives get parentheses, so (−4)² is unambiguous. */
export function squared(value, decimals = 2) {
  const base = value < 0 && formatNumber(value, decimals) !== '0' ? paren(num(value, decimals)) : num(value, decimals);
  return sup(base, mn('2'));
}

/** A signed term after a plus sign: negatives get parentheses, 3 + (−4). */
export function signedTerm(value, decimals = 2) {
  return value < 0 && formatNumber(value, decimals) !== '0' ? paren(num(value, decimals)) : num(value, decimals);
}

export function tuple(values, decimals = 2) {
  return paren(list(...values.map((value) => num(value, decimals))));
}
