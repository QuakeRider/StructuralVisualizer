import { applyRefHighlight, bindRefHover } from './plotKit.js';

const WIDTH = 480;
const HEIGHT = 456;
const LEFT = 132;
const RIGHT = 468;
/** Column edges in % matrix, and their widths on screen (wide enough to hold the names). */
const EDGES = [0, 10, 50, 70, 90, 100];
const WIDTHS = [112, 70, 52, 50, 52];
const XS = WIDTHS.reduce((xs, width) => [...xs, xs.at(-1) + width], [LEFT]);
const ROWS = {
  incohesive: { y: 92, h: 46, label: ['Loose', '(incohesive)'] },
  cohesive: { y: 144, h: 84, label: ['Cohesive,', 'random fabric'] },
  glass: { y: 234, h: 32, label: ['Glass'] },
  foliated: { y: 272, h: 46, label: ['Cohesive,', 'foliated'] },
};
const CRUSH = [
  { size: 'coarse', lines: ['crush breccia', 'over 5 mm'] },
  { size: 'fine', lines: ['fine crush breccia', '1–5 mm'] },
  { size: 'micro', lines: ['crush microbreccia', 'under 1 mm'] },
];
const WM = [
  { from: 0, to: 30, name: 'not a breccia' },
  { from: 30, to: 60, name: 'chaotic' },
  { from: 60, to: 75, name: 'mosaic' },
  { from: 75, to: 100, name: 'crackle' },
];

/** Screen x of a matrix percentage: piecewise linear through the column edges. */
function xOf(matrixPct) {
  const value = Math.min(Math.max(matrixPct, 0), 100);
  const index = Math.min(EDGES.findIndex((edge, i) => value <= EDGES[i + 1]), EDGES.length - 2);
  const t = (value - EDGES[index]) / (EDGES[index + 1] - EDGES[index]);
  return XS[index] + t * WIDTHS[index];
}

function cell({ from, to, y, h, lines, key, dashed = false, active = false }) {
  const x0 = xOf(from);
  const x1 = xOf(to);
  const middle = y + h / 2 - ((lines.length - 1) * 14) / 2 + 5;
  return `
    <g data-ref="sibson-chart">
      <rect x="${x0 + 1}" y="${y + 1}" width="${x1 - x0 - 2}" height="${h - 2}" rx="4" fill="${active ? 'rgba(245, 163, 131, 0.28)' : 'rgba(255, 255, 255, 0.04)'}" stroke="${active ? '#f5a383' : '#4a515c'}" stroke-width="${active ? 2.4 : 1.2}"${dashed ? ' stroke-dasharray="6 4"' : ''} data-cell="${key}" />
      ${lines.map((line, index) => `<text x="${(x0 + x1) / 2}" y="${middle + index * 14}" text-anchor="middle" class="chart-cell"${active ? ' fill="#f4f5f7"' : ''}>${line}</text>`).join('')}
    </g>`;
}

/**
 * Sibson's (1977) fault-rock chart (B11): rows by cohesion and fabric,
 * columns by the percentage of matrix (grains finer than 0.1 mm), with the
 * crush breccias split by fragment size. A diamond marks the current sample
 * and its cell lights up; below, Woodcock & Mort's (2008) breccia scale by
 * the percentage of clasts of 2 mm or more.
 */
export class FaultRockChart {
  constructor(container, { onHover } = {}) {
    this.container = container;
    this.highlightRef = null;
    bindRefHover(container, (ref) => onHover?.(ref));
  }

  highlight(ref) {
    this.highlightRef = ref;
    applyRefHighlight(this.container.querySelector('svg'), ref);
  }

  /** state: { matrixPct, clastPct2mm, sibson (sibsonClass result), wmName, fragmentSize }. */
  setState({ matrixPct, clastPct2mm, sibson, wmName }) {
    const is = (row, column, size) => sibson.row === row && (column === undefined || sibson.column === column) && (size === undefined || sibson.size === size);
    const cells = [
      cell({ from: 0, to: 70, ...ROWS.incohesive, lines: ['fault breccia', '(30% or more fragments)'], key: 'breccia', active: is('incohesive', 'breccia') }),
      cell({ from: 70, to: 100, ...ROWS.incohesive, lines: ['fault gouge'], key: 'gouge', active: is('incohesive', 'gouge') }),
      ...CRUSH.map((crush, index) => cell({ from: 0, to: 10, y: ROWS.cohesive.y + index * 28, h: 28, lines: [crush.lines[0]], key: crush.size, active: is('cohesive', 'low', crush.size) })),
      cell({ from: 10, to: 50, ...ROWS.cohesive, lines: ['proto-', 'cataclasite'], key: 'proto', active: is('cohesive', 'proto') }),
      cell({ from: 50, to: 90, ...ROWS.cohesive, lines: ['cataclasite'], key: 'main', active: is('cohesive', 'main') }),
      cell({ from: 90, to: 100, ...ROWS.cohesive, lines: ['ultra-', 'cata-', 'clasite'], key: 'ultra', active: is('cohesive', 'ultra') }),
      cell({ from: 0, to: 100, ...ROWS.glass, lines: ['pseudotachylyte (frictional melt)'], key: 'glass', active: is('glass') }),
      cell({ from: 0, to: 10, ...ROWS.foliated, lines: ['no name'], key: 'f-low', dashed: true, active: is('foliated', 'low') }),
      cell({ from: 10, to: 50, ...ROWS.foliated, lines: ['proto-', 'mylonite'], key: 'f-proto', dashed: true, active: is('foliated', 'proto') }),
      cell({ from: 50, to: 90, ...ROWS.foliated, lines: ['mylonite'], key: 'f-main', dashed: true, active: is('foliated', 'main') }),
      cell({ from: 90, to: 100, ...ROWS.foliated, lines: ['ultra-', 'mylonite'], key: 'f-ultra', dashed: true, active: is('foliated', 'ultra') }),
    ].join('');
    const row = ROWS[sibson.row];
    const crushIndex = CRUSH.findIndex((crush) => crush.size === sibson.size);
    const markerY = sibson.row === 'cohesive' && sibson.column === 'low' ? row.y + crushIndex * 28 + 14 : row.y + row.h / 2;
    const markerX = sibson.row === 'glass' ? (LEFT + RIGHT) / 2 : xOf(matrixPct);
    const wmX = (value) => LEFT + ((RIGHT - LEFT) * Math.min(Math.max(value, 0), 100)) / 100;
    const wmY = 398;
    const name = sibson.name ?? 'no name in Sibson’s scheme';
    const wmText = wmName ? `${wmName}` : 'not a breccia';
    this.container.innerHTML = `
      <svg class="mohr-svg chart-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet" role="img"
        aria-label="Sibson's fault-rock chart. This sample is ${name}: ${Math.round(matrixPct)}% matrix. Woodcock and Mort: ${wmText}, ${Math.round(clastPct2mm)}% clasts of 2 mm or more.">
        <text class="mohr-title" x="16" y="28">Naming fault rocks</text>
        <text class="mohr-caption" x="16" y="50" fill="#9aa1ad">Sibson (1977). Matrix: grains finer than 0.1 mm.</text>
        <g class="mohr-ticks" fill="#9aa1ad">
          ${EDGES.map((edge) => `<text x="${xOf(edge)}" y="84" text-anchor="middle" class="chart-tick">${edge}</text>`).join('')}
          <text x="${RIGHT}" y="68" text-anchor="end" class="chart-tick">% matrix</text>
        </g>
        ${Object.values(ROWS).map((item) => item.label.map((line, index) => `<text x="${LEFT - 8}" y="${item.y + item.h / 2 - ((item.label.length - 1) * 16) / 2 + 5 + index * 16}" text-anchor="end" class="mohr-caption" fill="#c3c8d0">${line}</text>`).join('')).join('')}
        ${cells}
        <text x="${RIGHT}" y="${ROWS.foliated.y + ROWS.foliated.h + 14}" text-anchor="end" class="chart-tick" fill="#9aa1ad">dashed: formed by ductile flow, not by breaking</text>
        <g data-ref="sample-point">
          <path d="M ${markerX} ${markerY - 10} l 10 10 l -10 10 l -10 -10 Z" fill="#f4f5f7" stroke="#11141a" stroke-width="2" />
        </g>
        <g data-ref="sample-point">
          <text x="16" y="358" class="rock-name" fill="#f5a383">Sibson: ${name}</text>
        </g>
        <g data-ref="wm-name">
          <text x="16" y="${wmY - 22}" class="mohr-caption" fill="#c3c8d0">Woodcock &amp; Mort (2008), by clasts of 2 mm or more: <tspan fill="#f4f5f7" font-weight="600">${wmText}</tspan></text>
          ${WM.map((band) => `<rect x="${wmX(band.from)}" y="${wmY}" width="${wmX(band.to) - wmX(band.from)}" height="16" fill="${wmName && band.name.startsWith(wmName.split(' ')[0]) ? 'rgba(245, 163, 131, 0.45)' : 'rgba(255, 255, 255, 0.07)'}" stroke="#4a515c" />
            <text x="${(wmX(band.from) + wmX(band.to)) / 2}" y="${wmY + 48}" text-anchor="middle" class="chart-tick" fill="#9aa1ad">${band.name}</text>`).join('')}
          ${[30, 60, 75].map((edge) => `<text x="${wmX(edge)}" y="${wmY + 30}" text-anchor="middle" class="chart-tick" fill="#c3c8d0">${edge}%</text>`).join('')}
          <path d="M ${wmX(clastPct2mm)} ${wmY - 4} l 7 -9 h -14 Z" fill="#f4f5f7" stroke="#11141a" stroke-width="1.5" />
          <text x="${LEFT - 8}" y="${wmY + 13}" text-anchor="end" class="chart-tick" fill="#c3c8d0">${Math.round(clastPct2mm)}%</text>
        </g>
      </svg>`;
    if (this.highlightRef) this.highlight(this.highlightRef);
  }
}
