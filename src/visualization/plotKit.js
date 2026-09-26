// Shared helpers for the 2D SVG plots (Mohr diagrams, curve plot, stereonet):
// math-style text, tick spacing, and the data-ref hover/highlight binding.

/** A symbol with a subscript: σ with an upright numeric subscript by default, or an italic one; `prime` marks effective stress. */
export function symbol(base, subscript, { upright = true, prime = false } = {}) {
  return `<tspan font-style="italic">${base}</tspan><tspan font-size="0.68em" dy="0.32em"${upright ? '' : ' font-style="italic"'}>${subscript}</tspan><tspan dy="-0.32em">${prime ? '′' : ''} </tspan>`;
}

/** A tick spacing of 1, 2, or 5 × 10ⁿ giving about five ticks over the span. */
export function niceStep(span) {
  const raw = span / 5;
  const power = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((factor) => factor * power).find((step) => step >= raw);
}

/** Report the data-ref under the pointer (equation–model binding, plot → equation). */
export function bindRefHover(container, report) {
  let current = null;
  const set = (ref) => {
    if (ref === current) return;
    current = ref;
    report(ref);
  };
  container.addEventListener('pointerover', (event) => set(event.target.closest?.('[data-ref]')?.dataset.ref ?? null));
  container.addEventListener('pointerleave', () => set(null));
}

/** Dim every data-ref group except the highlighted one. Refs the plot does not draw clear the highlight. */
export function applyRefHighlight(svg, ref) {
  if (!svg) return;
  const refs = new Set([...svg.querySelectorAll('[data-ref]')].map((element) => element.dataset.ref));
  const active = ref && refs.has(ref) ? ref : null;
  svg.classList.toggle('has-highlight', Boolean(active));
  for (const element of svg.querySelectorAll('[data-ref]')) element.classList.toggle('is-highlighted', element.dataset.ref === active);
}

/** Stops of the displacement color scale (viridis: perceptually even and colorblind-safe), from zero to the maximum. */
export const DISPLACEMENT_STOPS = ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'];

/** Color for a fraction t (0–1) of the displacement scale, as a hex string. */
export function displacementColor(t) {
  const clamped = Math.min(Math.max(Number.isFinite(t) ? t : 0, 0), 1) * (DISPLACEMENT_STOPS.length - 1);
  const index = Math.min(Math.floor(clamped), DISPLACEMENT_STOPS.length - 2);
  const mix = clamped - index;
  const parse = (hex) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  const a = parse(DISPLACEMENT_STOPS[index]);
  const b = parse(DISPLACEMENT_STOPS[index + 1]);
  return `#${a.map((value, channel) => Math.round(value + (b[channel] - value) * mix).toString(16).padStart(2, '0')).join('')}`;
}
