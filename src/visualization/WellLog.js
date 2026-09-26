import { formatNumber } from '../domain/format.js';
import { LAYER_COLORS } from './earthBlock.js';
import { applyRefHighlight, bindRefHover } from './plotKit.js';

const WIDTH = 480;
const HEIGHT = 424;
const TOP = 96;
const BOTTOM = 396;
const DEPTH = 500;
const COLUMNS = { reference: { x: 120, width: 64 }, well: { x: 262, width: 64 } };
const COLORS = { label: '#c3c8d0', caption: '#9aa1ad', fault: '#d9b27c', gap: '#cc79a7', well: '#f4f5f7', axis: '#d8dde4' };

/** Layer letters from the top down: A, B, C, … */
export const layerLetter = (index) => String.fromCharCode(65 + index);

/**
 * A well log beside the undisturbed sequence (B8): the beds a vertical well
 * passes through, top to bottom, with the fault crossing marked. A normal
 * fault cuts part of the sequence out; a reverse fault repeats part of it.
 * Groups carry data-ref for equation–model binding.
 */
export class WellLog {
  constructor(container, { onHover } = {}) {
    this.container = container;
    this.highlightRef = null;
    bindRefHover(container, (ref) => onHover?.(ref));
  }

  highlight(ref) {
    this.highlightRef = ref;
    applyRefHighlight(this.container.querySelector('svg'), ref);
  }

  /** log: from wellLog() in faults.js (depths in metres); thickness: bed thickness (m). */
  setState({ log, thickness }) {
    const y = (depth) => TOP + ((BOTTOM - TOP) * depth) / DEPTH;
    const f = (value) => value.toFixed(1);
    const band = (column, top, bottom, layer, extra = '') => {
      const height = y(bottom) - y(top);
      const letter = height > 17 ? `<text x="${column.x + column.width / 2}" y="${f((y(top) + y(bottom)) / 2 + 6)}" text-anchor="middle" class="mohr-small well-letter">${layerLetter(layer)}</text>` : '';
      return `<rect x="${column.x}" y="${f(y(top))}" width="${column.width}" height="${f(height)}" fill="${LAYER_COLORS[layer % LAYER_COLORS.length]}" ${extra}/>${letter}`;
    };
    const referenceBands = Array.from({ length: Math.ceil(DEPTH / thickness) }, (_, layer) => band(COLUMNS.reference, layer * thickness, Math.min(DEPTH, (layer + 1) * thickness), layer)).join('');
    const wellBands = log.pieces.map((piece) => band(COLUMNS.well, piece.top, piece.bottom, piece.layer)).join('');
    const firstDepth = log.pieces[0]?.top ?? 0;
    const ticks = [0, 100, 200, 300, 400, 500];

    let gapMarkup = '';
    let gapText = 'No fault in this well';
    if (log.faultDepth !== null) gapText = 'Nothing missing or repeated';
    if (log.gap) {
      const word = log.gap.kind === 'missing' ? 'missing' : 'repeated';
      const beds = [];
      for (let layer = Math.floor(log.gap.from / thickness); layer * thickness < log.gap.to - 1e-6; layer += 1) beds.push(layerLetter(layer));
      gapText = `${formatNumber(log.gap.thickness, 0)} m ${word} (${beds.join(', ')})`;
      const { x, width } = COLUMNS.reference;
      gapMarkup = `<g data-ref="strat-gap">
        <rect x="${x - 4}" y="${f(y(log.gap.from))}" width="${width + 8}" height="${f(y(log.gap.to) - y(log.gap.from))}" fill="url(#gap-hatch)" stroke="${COLORS.gap}" stroke-width="3" />
        <path d="M ${x + width + 8} ${f(y((log.gap.from + log.gap.to) / 2))} L ${COLUMNS.well.x - 8} ${f(y(log.faultDepth))}" stroke="${COLORS.gap}" stroke-width="2.4" stroke-dasharray="7 5" fill="none" />
      </g>`;
    }
    const faultMarkup = log.faultDepth === null ? '' : `<g data-ref="fault">
      <line x1="${COLUMNS.well.x - 10}" y1="${f(y(log.faultDepth))}" x2="${COLUMNS.well.x + COLUMNS.well.width + 10}" y2="${f(y(log.faultDepth))}" stroke="#1b1f27" stroke-width="7" />
      <line x1="${COLUMNS.well.x - 10}" y1="${f(y(log.faultDepth))}" x2="${COLUMNS.well.x + COLUMNS.well.width + 10}" y2="${f(y(log.faultDepth))}" stroke="${COLORS.fault}" stroke-width="4" />
      <text x="${COLUMNS.well.x + COLUMNS.well.width + 16}" y="${f(y(log.faultDepth) + 5)}" fill="${COLORS.fault}" class="mohr-small">fault, ${formatNumber(log.faultDepth, 0)} m</text>
    </g>`;
    const wallLabels = log.faultDepth === null ? '' : `
      <text x="${COLUMNS.well.x + COLUMNS.well.width + 16}" y="${f((y(firstDepth) + y(log.faultDepth)) / 2 + 5)}" fill="${COLORS.label}" class="mohr-small">hanging wall</text>
      <text x="${COLUMNS.well.x + COLUMNS.well.width + 16}" y="${f((y(log.faultDepth) + y(DEPTH)) / 2 + 5)}" fill="${COLORS.label}" class="mohr-small">footwall</text>`;

    this.container.innerHTML = `
      <svg class="mohr-svg well-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet" role="img"
        aria-label="Well log beside the undisturbed sequence of beds A to H. ${log.faultDepth === null ? 'The well does not cross the fault.' : `The well crosses the fault at ${formatNumber(log.faultDepth, 0)} metres.`} ${gapText}.">
        <defs><pattern id="gap-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="rgba(204, 121, 167, 0.25)" /><line x1="0" y1="0" x2="0" y2="8" stroke="${COLORS.gap}" stroke-width="2.4" /></pattern></defs>
        <text class="mohr-title" x="24" y="28">Well log: stratigraphic separation</text>
        <text class="mohr-caption" x="24" y="50" fill="${COLORS.caption}">Depth below the original ground surface (m). Beds are 62.5 m thick.</text>
        <text x="${COLUMNS.reference.x + COLUMNS.reference.width / 2}" y="${TOP - 14}" text-anchor="middle" fill="${COLORS.label}" class="mohr-small">normal sequence</text>
        <text x="${COLUMNS.well.x + COLUMNS.well.width / 2}" y="${TOP - 14}" text-anchor="middle" fill="${COLORS.label}" class="mohr-small">in the well</text>
        <g class="mohr-ticks" fill="${COLORS.label}">
          ${ticks.map((depth) => `<line x1="${COLUMNS.reference.x - 10}" y1="${f(y(depth))}" x2="${COLUMNS.reference.x}" y2="${f(y(depth))}" stroke="${COLORS.axis}" stroke-width="1.4" /><text x="${COLUMNS.reference.x - 14}" y="${f(y(depth) + 5)}" text-anchor="end">${depth}</text>`).join('')}
        </g>
        <g>${referenceBands}</g>
        <g data-ref="well">
          ${wellBands}
          <rect x="${COLUMNS.well.x}" y="${f(y(firstDepth))}" width="${COLUMNS.well.width}" height="${f(y(DEPTH) - y(firstDepth))}" fill="none" stroke="${COLORS.well}" stroke-width="2" />
        </g>
        ${gapMarkup}
        ${faultMarkup}
        ${wallLabels}
        <text x="24" y="${HEIGHT - 4}" fill="${log.gap ? COLORS.gap : COLORS.label}" class="mohr-small" data-ref="strat-gap">${gapText}</text>
      </svg>`;
    if (this.highlightRef) this.highlight(this.highlightRef);
  }
}
