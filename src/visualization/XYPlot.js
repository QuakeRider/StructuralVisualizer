import { DISPLACEMENT_STOPS, applyRefHighlight, bindRefHover, niceStep } from './plotKit.js';

const WIDTH = 480;
const HEIGHT = 420;
const BASE_MARGIN = { left: 66, right: 22, bottom: 72 };
const COLORS = { grid: '#343a44', axis: '#9aa1ad', label: '#c3c8d0', caption: '#9aa1ad' };

/**
 * A general x–y plot for lesson panels: lines, scatter points, markers,
 * vertical guides, shaded bands, filled areas, and notes, on linear or log
 * axes. Every drawn item may carry a data-ref for equation–model binding. Used
 * by B9 for displacement profiles, the D–L scaling plot, and the drag
 * profile, and by B11 for scanlines, width scaling, and clast sizes.
 *
 * state: { title, caption, x, y, series, markers, vlines, bands, areas, notes,
 * colorbar }. Axes: { label (SVG markup), min, max, log?, ticks?, format? }.
 * areas: { ref, points [[x, y]] (a closed polygon in data units), color, opacity?, label? }.
 * series: { ref, points [[x, y]], color, width?, dash?, kind?: 'line' |
 * 'points', radius?, opacity?, label? } (labelled series join the key).
 */
export class XYPlot {
  constructor(container, { onHover } = {}) {
    this.container = container;
    this.highlightRef = null;
    bindRefHover(container, (ref) => onHover?.(ref));
  }

  highlight(ref) {
    this.highlightRef = ref;
    applyRefHighlight(this.container.querySelector('svg'), ref);
  }

  setState(state) {
    const { title = '', caption = '', x, y, series = [], markers = [], vlines = [], bands = [], areas = [], notes = [], colorbar = null, ariaLabel = title } = state;
    const key = [...areas.filter((item) => item.label).map((item) => ({ ...item, kind: 'area' })), ...series.filter((item) => item.label), ...markers.filter((item) => item.key)];
    // The key sits under the title, two entries per row; the plot starts below it.
    const keyRows = Math.ceil(key.length / 2);
    const MARGIN = { ...BASE_MARGIN, top: 62 + keyRows * 23 + 34 };
    const f = (value) => value.toFixed(1);
    const scaleFor = (axis, from, to) => {
      const t = (value) => (axis.log ? (Math.log10(value) - Math.log10(axis.min)) / (Math.log10(axis.max) - Math.log10(axis.min)) : (value - axis.min) / (axis.max - axis.min));
      return (value) => from + (to - from) * t(value);
    };
    const px = scaleFor(x, MARGIN.left, WIDTH - MARGIN.right);
    const py = scaleFor(y, HEIGHT - MARGIN.bottom, MARGIN.top);
    const ticksFor = (axis) => {
      if (axis.ticks) return axis.ticks;
      if (axis.log) {
        const ticks = [];
        for (let power = Math.ceil(Math.log10(axis.min)); power <= Math.floor(Math.log10(axis.max)); power += 1) ticks.push(10 ** power);
        return ticks;
      }
      const step = niceStep(axis.max - axis.min);
      const ticks = [];
      for (let value = Math.ceil(axis.min / step) * step; value <= axis.max + 1e-9; value += step) ticks.push(Number(value.toFixed(10)));
      return ticks;
    };
    const format = (axis, value) => (axis.format ? axis.format(value) : String(value).replace('-', '−'));
    const xTicks = ticksFor(x);
    const yTicks = ticksFor(y);
    const clipId = `xy-clip-${Math.round(Math.random() * 1e9)}`;
    const inRange = (axis, value) => value >= axis.min - 1e-9 && value <= axis.max + 1e-9 && (!axis.log || value > 0);
    const path = (points) => {
      const valid = points.filter(([a, b]) => (!x.log || a > 0) && (!y.log || b > 0));
      return valid.length ? `M ${valid.map(([a, b]) => `${f(px(a))},${f(py(b))}`).join(' L ')}` : '';
    };
    const keyMarkup = key.map((item, index) => {
      const column = index % 2;
      const rowIndex = Math.floor(index / 2);
      const swatch = item.kind === 'area'
        ? `<rect x="0" y="-13" width="26" height="14" fill="${item.color}" opacity="${Math.min((item.opacity ?? 0.3) * 1.6, 1)}" />`
        : item.kind === 'points' || item.key
        ? `<circle cx="13" cy="-6" r="6" fill="${item.color}" stroke="#11141a" stroke-width="1.5" />`
        : `<line x1="0" y1="-6" x2="26" y2="-6" stroke="${item.color}" stroke-width="${item.width ?? 3.2}"${item.dash ? ` stroke-dasharray="${item.dash}"` : ''} />`;
      return `<g data-ref="${item.ref}" transform="translate(${MARGIN.left - 40 + column * 214} ${62 + rowIndex * 23})">${swatch}<text x="34" y="0" fill="${item.color}" class="mohr-small">${item.key ?? item.label}</text></g>`;
    }).join('');
    const colorbarMarkup = colorbar ? `
      <defs><linearGradient id="${clipId}-bar" x1="0" y1="1" x2="0" y2="0">${DISPLACEMENT_STOPS.map((color, index) => `<stop offset="${index / (DISPLACEMENT_STOPS.length - 1)}" stop-color="${color}" />`).join('')}</linearGradient></defs>
      <g data-ref="${colorbar.ref ?? 'displacement'}"><rect x="${MARGIN.left - 13}" y="${f(py(colorbar.max))}" width="9" height="${f(py(0) - py(colorbar.max))}" fill="url(#${clipId}-bar)" /></g>` : '';

    this.container.innerHTML = `
      <svg class="mohr-svg xy-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${ariaLabel}">
        <defs><clipPath id="${clipId}"><rect x="${MARGIN.left}" y="${MARGIN.top}" width="${WIDTH - MARGIN.left - MARGIN.right}" height="${HEIGHT - MARGIN.top - MARGIN.bottom}" /></clipPath></defs>
        <text class="mohr-title" x="24" y="28">${title}</text>
        ${caption ? `<text class="mohr-caption" x="24" y="${HEIGHT - 6}" fill="${COLORS.caption}">${caption}</text>` : ''}
        <g stroke="${COLORS.grid}" stroke-width="1">
          ${xTicks.filter((value) => inRange(x, value)).map((value) => `<line x1="${f(px(value))}" y1="${MARGIN.top}" x2="${f(px(value))}" y2="${HEIGHT - MARGIN.bottom}" />`).join('')}
          ${yTicks.filter((value) => inRange(y, value)).map((value) => `<line x1="${MARGIN.left}" y1="${f(py(value))}" x2="${WIDTH - MARGIN.right}" y2="${f(py(value))}" />`).join('')}
        </g>
        <g clip-path="url(#${clipId})">
          ${areas.map((area) => `<g data-ref="${area.ref}"><path d="${path(area.points)} Z" fill="${area.color}" opacity="${area.opacity ?? 0.3}" stroke="none" /></g>`).join('')}
          ${bands.map((band) => `<g data-ref="${band.ref}"><rect x="${f(px(Math.max(band.from, x.min)))}" y="${MARGIN.top}" width="${f(Math.max(0, px(Math.min(band.to, x.max)) - px(Math.max(band.from, x.min))))}" height="${HEIGHT - MARGIN.top - MARGIN.bottom}" fill="${band.color}" opacity="${band.opacity ?? 0.16}" /></g>`).join('')}
        </g>
        <g stroke="${COLORS.axis}" stroke-width="1.6">
          ${!x.log && y.min < 0 && y.max > 0 ? `<line x1="${MARGIN.left}" y1="${f(py(0))}" x2="${WIDTH - MARGIN.right}" y2="${f(py(0))}" />` : ''}
          <line x1="${MARGIN.left}" y1="${HEIGHT - MARGIN.bottom}" x2="${WIDTH - MARGIN.right}" y2="${HEIGHT - MARGIN.bottom}" />
          <line x1="${MARGIN.left}" y1="${MARGIN.top}" x2="${MARGIN.left}" y2="${HEIGHT - MARGIN.bottom}" />
        </g>
        ${colorbarMarkup}
        <g class="mohr-ticks" fill="${COLORS.axis}">
          ${xTicks.filter((value) => inRange(x, value)).map((value) => `<text x="${f(px(value))}" y="${HEIGHT - MARGIN.bottom + 22}" text-anchor="middle">${format(x, value)}</text>`).join('')}
          ${yTicks.filter((value) => inRange(y, value)).map((value) => `<text x="${MARGIN.left - (colorbar ? 18 : 8)}" y="${f(py(value) + 5)}" text-anchor="end">${format(y, value)}</text>`).join('')}
          <text x="${WIDTH - MARGIN.right}" y="${HEIGHT - MARGIN.bottom + 44}" text-anchor="end" class="mohr-axis-label">${x.label}</text>
          <text x="${MARGIN.left - 40}" y="${MARGIN.top - 12}" class="mohr-axis-label">${y.label}</text>
        </g>
        <g clip-path="url(#${clipId})">
          ${series.map((item) => (item.kind === 'points'
            ? `<g data-ref="${item.ref}" fill="${item.color}" opacity="${item.opacity ?? 1}">${item.points.filter(([a, b]) => inRange(x, a) && inRange(y, b)).map(([a, b]) => `<circle cx="${f(px(a))}" cy="${f(py(b))}" r="${item.radius ?? 3.2}" />`).join('')}</g>`
            : `<g data-ref="${item.ref}" fill="none" stroke="${item.color}" stroke-width="${item.width ?? 3.2}" stroke-linejoin="round"><path d="${path(item.points)}"${item.dash ? ` stroke-dasharray="${item.dash}"` : ''} /><path d="${path(item.points)}" stroke="transparent" stroke-width="16" /></g>`)).join('')}
          ${vlines.map((line) => `<g data-ref="${line.ref}"><line x1="${f(px(line.x))}" y1="${MARGIN.top}" x2="${f(px(line.x))}" y2="${HEIGHT - MARGIN.bottom}" stroke="${line.color}" stroke-width="${line.width ?? 1.8}" stroke-dasharray="${line.dash ?? '6 5'}" /></g>`).join('')}
        </g>
        ${markers.filter((marker) => inRange(x, marker.x) && inRange(y, marker.y)).map((marker) => `
          <g data-ref="${marker.ref}">
            ${marker.shape === 'diamond'
              ? `<path d="M ${f(px(marker.x))} ${f(py(marker.y) - 9)} l 9 9 l -9 9 l -9 -9 Z" fill="${marker.color}" stroke="#11141a" stroke-width="2" />`
              : `<circle cx="${f(px(marker.x))}" cy="${f(py(marker.y))}" r="${marker.r ?? 7}" fill="${marker.color}" stroke="#11141a" stroke-width="2" />`}
            ${marker.label ? `<text x="${f(px(marker.x) + (marker.dx ?? 12))}" y="${f(py(marker.y) + (marker.dy ?? -10))}" fill="${marker.color}" text-anchor="${marker.anchor ?? 'start'}" class="mohr-small net-halo">${marker.label}</text>` : ''}
          </g>`).join('')}
        ${notes.map((note) => `<g data-ref="${note.ref ?? ''}"><text x="${f(px(note.x) + (note.dx ?? 0))}" y="${f(py(note.y) + (note.dy ?? 0))}" fill="${note.color ?? COLORS.label}" text-anchor="${note.anchor ?? 'middle'}" class="mohr-small net-halo">${note.text}</text></g>`).join('')}
        <g class="curve-key">${keyMarkup}</g>
      </svg>`;
    // Notes without a binding should not act as hover targets.
    for (const element of this.container.querySelectorAll('[data-ref=""]')) element.removeAttribute('data-ref');
    if (this.highlightRef) this.highlight(this.highlightRef);
  }
}
