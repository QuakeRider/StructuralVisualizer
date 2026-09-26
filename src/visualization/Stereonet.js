import { BYERLEE, frictionCheck, slipTendencyGrid } from '../domain/failure.js';
import { formatNumber } from '../domain/format.js';
import { planePole } from '../domain/orientation.js';
import { equalAreaLine, equalAreaPoint, greatCirclePoints, lineFromVector } from '../domain/stereonet.js';
import { applyRefHighlight, bindRefHover, symbol } from './plotKit.js';

const WIDTH = 480;
const HEIGHT = 424;
const CENTER = { x: 196, y: 246 };
const RADIUS = 150;
/** Raster cells across the net for the slip-tendency map. */
const GRID = 120;
/** The color scale runs from Ts = 0 to this value; larger values use the top color. */
const TS_TOP = 1.2;
const BAR = { x: 396, y: 112, width: 18, height: 262 };

const COLORS = {
  primitive: '#d8dde4',
  label: '#c3c8d0',
  plane: '#d9b27c',
  sigma1: '#f07a3c',
  sigma2: '#f0e442',
  sigma3: '#56b4e9',
  marker: '#f4f5f7',
  caption: '#9aa1ad',
  slip: '#3fd0a0',
  auxiliary: '#c3c8d0',
  p: '#9a8cff',
  t: '#cc79a7',
  b: '#c3c8d0',
  ballLight: '#e9edf2',
  ballDark: '#2b303b',
};

/** A dark-to-bright sequential scale (viridis stops), readable for common color-vision differences. */
const RAMP = ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'];

function rampColor(t) {
  const clamped = Math.min(Math.max(t, 0), 1) * (RAMP.length - 1);
  const index = Math.min(Math.floor(clamped), RAMP.length - 2);
  const mix = clamped - index;
  const parse = (hex) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  const a = parse(RAMP[index]);
  const b = parse(RAMP[index + 1]);
  return a.map((value, channel) => Math.round(value + (b[channel] - value) * mix));
}

/** Net coordinates (x east, y north, radius 1) → SVG. */
const toSvg = ({ x, y }) => ({ x: CENTER.x + x * RADIUS, y: CENTER.y - y * RADIUS });

/**
 * Lower-hemisphere equal-area stereonet for the friction lab (B6), the first
 * stereonet in the app (O3 will extend it). Every point inside the circle is
 * the pole of one plane; the background colors each pole by the slip
 * tendency Ts of its plane, and hatching marks the planes that would slip.
 * The current plane appears as its great circle and its pole; the principal
 * axes are marked by shape as well as color. Clicking or dragging on the net
 * picks a pole (reported through onPick). Groups carry data-ref (see
 * sceneRefs.js) for equation–model binding.
 *
 * Fault-kinematics layers (B8), each optional: the slip vector (a point on
 * the fault's great circle, with an arrow showing which way the hanging wall
 * moved), the auxiliary plane (whose pole is the slip), the P, T, and B
 * axes, and the beach ball (the T quadrants shaded, drawn exactly with an
 * even–odd fill of the two half-nets cut off by the nodal planes).
 */
export class Stereonet {
  constructor(container, { onHover, onPick } = {}) {
    this.container = container;
    this.onHover = onHover;
    this.onPick = onPick;
    this.state = { tensor: null, pf: 0, plane: null, axes: null, markers: [], slip: null, kinematic: null, auxiliary: null, options: {} };
    this.highlightRef = null;
    this.gridKey = '';
    this.canvas = document.createElement('canvas');
    this.maskCanvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = GRID;
    this.maskCanvas.width = this.maskCanvas.height = GRID;
    bindRefHover(container, (ref) => this.onHover?.(ref));
    this.bindPicking();
  }

  bindPicking() {
    let dragging = false;
    const pick = (event) => {
      const svg = this.container.querySelector('svg');
      if (!svg || !this.onPick || this.state.options.pickable === false) return false;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const local = point.matrixTransform(svg.getScreenCTM().inverse());
      const x = (local.x - CENTER.x) / RADIUS;
      const y = (CENTER.y - local.y) / RADIUS;
      const r = Math.hypot(x, y);
      if (r > 1.04) return false;
      const line = equalAreaLine(x / Math.max(r, 1), y / Math.max(r, 1));
      if (line) this.onPick(line);
      return true;
    };
    this.container.addEventListener('pointerdown', (event) => {
      if (!pick(event)) return;
      dragging = true;
      try {
        this.container.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic or already-released pointers cannot be captured; dragging still works inside the net.
      }
      event.preventDefault();
    });
    this.container.addEventListener('pointermove', (event) => { if (dragging) pick(event); });
    const stop = () => { dragging = false; };
    this.container.addEventListener('pointerup', stop);
    this.container.addEventListener('pointercancel', stop);
  }

  setState(state) {
    this.state = { ...this.state, ...state };
    this.render();
  }

  highlight(ref) {
    this.highlightRef = ref;
    applyRefHighlight(this.container.querySelector('svg'), ref);
  }

  /** Paint the slip-tendency raster and the mask of planes that slip; cached until the stress changes. */
  paintMap() {
    const { tensor, pf } = this.state;
    const key = JSON.stringify([tensor, pf]);
    if (key === this.gridKey) return;
    this.gridKey = key;
    const context = this.canvas.getContext('2d');
    const maskContext = this.maskCanvas.getContext('2d');
    const image = context.createImageData(GRID, GRID);
    const mask = maskContext.createImageData(GRID, GRID);
    const grid = slipTendencyGrid(tensor, { size: GRID, pf });
    for (let index = 0; index < GRID * GRID; index += 1) {
      const value = grid.values[index];
      if (Number.isNaN(value)) continue;
      const [r, g, b] = rampColor((Number.isFinite(value) ? value : TS_TOP) / TS_TOP);
      image.data.set([r, g, b, 255], index * 4);
      const white = grid.slips[index] ? 255 : 0;
      mask.data.set([white, white, white, 255], index * 4);
    }
    context.putImageData(image, 0, 0);
    maskContext.putImageData(mask, 0, 0);
    this.mapUrl = this.canvas.toDataURL();
    this.maskUrl = this.maskCanvas.toDataURL();
    this.maxTs = grid.max;
    this.anySlip = grid.slips.some(Boolean);
  }

  render() {
    const { tensor, plane, axes, markers, slip, kinematic, auxiliary } = this.state;
    const options = {
      showMap: true,
      showPlane: true,
      showPole: true,
      showAxes: true,
      showSlip: false,
      showAuxiliary: false,
      showKinematic: false,
      showBeachBall: false,
      showLegend: false,
      title: 'Stereonet: slip tendency',
      caption: 'Lower hemisphere, equal area. Each point is the pole of a plane.',
      ...this.state.options,
    };
    if (options.showMap && !tensor) return;
    if (options.showMap) this.paintMap();
    const f = (value) => value.toFixed(1);
    const path = (points) => points.map((point, index) => {
      const { x, y } = toSvg(point);
      return `${index ? 'L' : 'M'} ${f(x)} ${f(y)}`;
    }).join(' ');
    const halo = (d, color, width, dash = '') => `<path d="${d}" stroke="#1b1f27" stroke-width="${width + 3.1}" /><path d="${d}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''} />`;

    let planeMarkup = '';
    let ts = null;
    if (plane && options.showPlane) {
      const poleVector = planePole(plane);
      const pole = toSvg(equalAreaPoint(lineFromVector(poleVector)));
      if (options.showMap) ts = frictionCheck(tensor, poleVector, this.state.pf).ts;
      planeMarkup = `
        <g data-ref="${options.planeRef ?? 'plane'}" fill="none">${halo(path(greatCirclePoints(plane)), COLORS.plane, 3.4)}</g>
        ${options.showPole ? `<g data-ref="pole">
          <circle cx="${f(pole.x)}" cy="${f(pole.y)}" r="8" fill="${COLORS.plane}" stroke="#1b1f27" stroke-width="2.4" />
          <text x="${f(pole.x + 12)}" y="${f(pole.y - 10)}" fill="${COLORS.plane}" class="mohr-small net-halo">${options.poleLabel ?? 'pole'}</text>
        </g>` : ''}`;
    }

    // Beach ball: the shaded T quadrants are where (𝐯·𝐧)(𝐯·𝐬) < 0. Each factor is negative on the half-net
    // between a nodal plane's great circle and the primitive on its dip side (away from its lower pole),
    // so the even–odd fill of the two half-nets is exactly the shaded region.
    let ballMarkup = '';
    if (options.showBeachBall && plane && slip) {
      const half = (nodal) => {
        const rim = Array.from({ length: 61 }, (_, index) => equalAreaPoint({ trend: nodal.strike + 180 - index * 3, plunge: 0 }));
        return `${path([...greatCirclePoints(nodal, 121), ...rim])} Z`;
      };
      const aux = auxiliary ?? null;
      const whole = `M ${CENTER.x + RADIUS} ${CENTER.y} A ${RADIUS} ${RADIUS} 0 1 0 ${CENTER.x - RADIUS} ${CENTER.y} A ${RADIUS} ${RADIUS} 0 1 0 ${CENTER.x + RADIUS} ${CENTER.y} Z`;
      const shaded = `${half(plane)} ${aux ? half(aux) : ''} ${slip.z < 0 ? whole : ''}`;
      ballMarkup = `<g data-ref="beach-ball">
        <circle cx="${CENTER.x}" cy="${CENTER.y}" r="${RADIUS}" fill="${COLORS.ballLight}" />
        <path d="${shaded}" fill="${COLORS.ballDark}" fill-rule="evenodd" clip-path="url(#net-clip)" />
      </g>`;
    }

    const auxMarkup = options.showAuxiliary && auxiliary
      ? `<g data-ref="auxiliary" fill="none">${halo(path(greatCirclePoints(auxiliary)), COLORS.auxiliary, 2.6, '9 7')}</g>`
      : '';

    // Slip: the hanging wall's slip line, with an arrow the way the hanging wall moved:
    // outward for a downward (normal) component, inward for an upward (reverse) one.
    let slipMarkup = '';
    if (options.showSlip && slip) {
      const net = equalAreaPoint(lineFromVector(slip));
      const at = toSvg(net);
      const radial = Math.hypot(net.x, net.y);
      let arrow = '';
      if (radial > 0.06) {
        const ux = net.x / radial;
        const uy = -net.y / radial;
        const sense = slip.z < -1e-9 ? -1 : 1;
        const from = { x: at.x + ux * 10 * sense, y: at.y + uy * 10 * sense };
        const to = { x: at.x + ux * 38 * sense, y: at.y + uy * 38 * sense };
        const back = { x: to.x - ux * 11 * sense, y: to.y - uy * 11 * sense };
        const side = { x: -uy * 6.5, y: ux * 6.5 };
        const arrowPath = `M ${f(from.x)} ${f(from.y)} L ${f(back.x)} ${f(back.y)}`;
        const head = `M ${f(to.x)} ${f(to.y)} L ${f(back.x + side.x)} ${f(back.y + side.y)} L ${f(back.x - side.x)} ${f(back.y - side.y)} Z`;
        arrow = `<path d="${arrowPath}" stroke="#1b1f27" stroke-width="7" /><path d="${arrowPath}" stroke="${COLORS.slip}" stroke-width="3.6" /><path d="${head}" fill="${COLORS.slip}" stroke="#1b1f27" stroke-width="1.6" />`;
      }
      slipMarkup = `<g data-ref="slip">${arrow}<circle cx="${f(at.x)}" cy="${f(at.y)}" r="8" fill="${COLORS.slip}" stroke="#1b1f27" stroke-width="2.4" /></g>`;
    }

    const kinematicMarkup = options.showKinematic && kinematic
      ? [['P', 'p-axis', COLORS.p], ['T', 't-axis', COLORS.t], ['B', 'b-axis', COLORS.b]].map(([letter, ref, color]) => {
        const { x, y } = toSvg(equalAreaPoint(kinematic[letter]));
        return `<g data-ref="${ref}"><circle cx="${f(x)}" cy="${f(y)}" r="13" fill="${color}" stroke="#1b1f27" stroke-width="2.4" /><text x="${f(x)}" y="${f(y + 6)}" text-anchor="middle" fill="#11141a" class="mohr-small" font-weight="700" font-style="italic">${letter}</text></g>`;
      }).join('')
      : '';

    // Principal axes by shape: σ1 square, σ2 diamond, σ3 triangle. Horizontal axes appear at both ends.
    const shapes = {
      sigma1: (x, y) => `<rect x="${f(x - 7)}" y="${f(y - 7)}" width="14" height="14" />`,
      sigma2: (x, y) => `<path d="M ${f(x)} ${f(y - 9)} l 9 9 l -9 9 l -9 -9 z" />`,
      sigma3: (x, y) => `<path d="M ${f(x)} ${f(y - 9)} l 8.5 15 l -17 0 z" />`,
    };
    const axisMarkup = axes && options.showAxes ? ['sigma1', 'sigma2', 'sigma3'].map((key) => {
      const axis = axes[key];
      const ends = axis.plunge > 89.9 ? [axis] : axis.plunge < 0.1 ? [axis, { trend: axis.trend + 180, plunge: axis.plunge }] : [axis];
      return `<g data-ref="sigma-${key.slice(-1)}" fill="${COLORS[key]}" stroke="#1b1f27" stroke-width="2">
        ${ends.map((end, index) => {
          const net = equalAreaPoint(end);
          const { x, y } = toSvg(net);
          const radial = Math.hypot(net.x, net.y);
          // Horizontal axes: labels outside the circle, beside the marker near north and south
          // (where the N label and the caption are). Inclined or vertical axes: below-right of the marker.
          let out = { x: x + 14, y: y + 24, anchor: 'start' };
          if (radial > 0.95 && Math.abs(net.y) > 0.7) out = { x: x + 14, y: net.y > 0 ? y - 4 : y + 22, anchor: 'start' };
          else if (radial > 0.95) out = { x: CENTER.x + net.x * (RADIUS + 26), y: CENTER.y - net.y * (RADIUS + 26) + 8, anchor: 'middle' };
          return `${shapes[key](x, y)}${index === 0 || radial > 0.95 ? `<text x="${f(out.x)}" y="${f(out.y)}" text-anchor="${out.anchor}" stroke="none" class="mohr-label net-halo">${symbol('σ', key.slice(-1))}</text>` : ''}`;
        }).join('')}
      </g>`;
    }).join('') : '';

    const markerMarkup = markers.map((marker) => {
      const { x, y } = toSvg(equalAreaPoint(lineFromVector(planePole(marker.plane))));
      return `<g data-ref="mapped-faults"><circle cx="${f(x)}" cy="${f(y)}" r="11" fill="#1b1f27" stroke="${COLORS.marker}" stroke-width="2" /><text x="${f(x)}" y="${f(y + 5)}" text-anchor="middle" fill="${COLORS.marker}" class="mohr-small">${marker.label}</text></g>`;
    }).join('');

    const barY = (value) => BAR.y + BAR.height * (1 - Math.min(value, TS_TOP) / TS_TOP);
    const barTicks = [0, 0.4, BYERLEE.mu, TS_TOP];
    const compass = [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]];
    const slipText = this.anySlip ? 'hatched: planes that would slip' : 'no plane can slip';

    // Key for the kinematic layers, in the space the slip-tendency color bar uses in B6.
    let legendMarkup = '';
    if (options.showLegend && !options.showMap) {
      const entries = [];
      if (plane && options.showPlane) entries.push([options.planeRef ?? 'plane', `<line x1="0" y1="0" x2="22" y2="0" stroke="${COLORS.plane}" stroke-width="3.4" />`, 'fault']);
      if (options.showAuxiliary && auxiliary) entries.push(['auxiliary', `<line x1="0" y1="0" x2="22" y2="0" stroke="${COLORS.auxiliary}" stroke-width="2.6" stroke-dasharray="6 4" />`, 'auxiliary']);
      if (options.showSlip && slip) entries.push(['slip', `<circle cx="11" cy="0" r="7" fill="${COLORS.slip}" stroke="#1b1f27" stroke-width="2" />`, 'slip']);
      if (options.showKinematic && kinematic) {
        for (const [letter, ref, color, word] of [['P', 'p-axis', COLORS.p, 'P axis'], ['T', 't-axis', COLORS.t, 'T axis'], ['B', 'b-axis', COLORS.b, 'B axis']]) {
          entries.push([ref, `<circle cx="11" cy="0" r="10" fill="${color}" stroke="#1b1f27" stroke-width="2" /><text x="11" y="5" text-anchor="middle" fill="#11141a" class="mohr-small" font-weight="700" font-style="italic">${letter}</text>`, word]);
        }
      }
      if (ballMarkup) entries.push(['beach-ball', `<rect x="1" y="-9" width="10" height="18" fill="${COLORS.ballDark}" /><rect x="11" y="-9" width="10" height="18" fill="${COLORS.ballLight}" /><rect x="1" y="-9" width="20" height="18" fill="none" stroke="${COLORS.primitive}" stroke-width="1.2" />`, 'shaded: T']);
      legendMarkup = entries.map(([ref, glyph, text], index) => `<g data-ref="${ref}" transform="translate(372 ${108 + index * 34})">${glyph}<text x="30" y="5" fill="${COLORS.label}" class="mohr-small">${text}</text></g>`).join('');
    }

    const describe = [];
    if (plane && options.showPlane) describe.push(`fault striking ${Math.round(plane.strike)}° and dipping ${Math.round(plane.dip)}°`);
    if (options.showSlip && slip) {
      const line = lineFromVector(slip);
      describe.push(`slip line trending ${Math.round(line.trend)}° and plunging ${Math.round(line.plunge)}°`);
    }
    if (options.showKinematic && kinematic) describe.push(`P axis ${Math.round(kinematic.P.trend)}°/${Math.round(kinematic.P.plunge)}°, T axis ${Math.round(kinematic.T.trend)}°/${Math.round(kinematic.T.plunge)}°`);
    const ariaLabel = options.showMap
      ? `Lower-hemisphere equal-area stereonet of slip tendency. The largest slip tendency is ${formatNumber(this.maxTs ?? 0)}${ts === null ? '' : `; the current plane has slip tendency ${formatNumber(ts)}`}. ${slipText}.`
      : `Lower-hemisphere equal-area stereonet${describe.length ? `: ${describe.join('; ')}` : ''}.`;

    this.container.innerHTML = `
      <svg class="mohr-svg net-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${ariaLabel}">
        <defs>
          <clipPath id="net-clip"><circle cx="${CENTER.x}" cy="${CENTER.y}" r="${RADIUS}" /></clipPath>
          <pattern id="net-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="transparent" /><line x1="0" y1="0" x2="0" y2="9" stroke="#11141a" stroke-width="3.2" /></pattern>
          ${options.showMap ? `<mask id="net-mask" maskUnits="userSpaceOnUse" x="${CENTER.x - RADIUS}" y="${CENTER.y - RADIUS}" width="${RADIUS * 2}" height="${RADIUS * 2}"><image href="${this.maskUrl}" x="${CENTER.x - RADIUS}" y="${CENTER.y - RADIUS}" width="${RADIUS * 2}" height="${RADIUS * 2}" preserveAspectRatio="none" /></mask>` : ''}
          <linearGradient id="net-ramp" x1="0" y1="1" x2="0" y2="0">${RAMP.map((color, index) => `<stop offset="${index / (RAMP.length - 1)}" stop-color="${color}" />`).join('')}</linearGradient>
        </defs>
        <text class="mohr-title" x="24" y="28">${options.title}</text>
        <text class="mohr-caption" x="24" y="50" fill="${COLORS.caption}">${options.caption}</text>
        ${options.showMap ? `
        <g data-ref="ts-map">
          <image href="${this.mapUrl}" x="${CENTER.x - RADIUS}" y="${CENTER.y - RADIUS}" width="${RADIUS * 2}" height="${RADIUS * 2}" preserveAspectRatio="none" clip-path="url(#net-clip)" />
          <rect x="${BAR.x}" y="${BAR.y}" width="${BAR.width}" height="${BAR.height}" fill="url(#net-ramp)" stroke="${COLORS.primitive}" stroke-width="1" />
          <text x="${BAR.x + BAR.width / 2}" y="${BAR.y - 12}" text-anchor="middle" fill="${COLORS.label}" class="mohr-label"><tspan font-style="italic">T</tspan><tspan font-size="0.68em" dy="0.32em" font-style="italic">s</tspan></text>
          ${barTicks.map((value) => `<line x1="${BAR.x - 4}" y1="${f(barY(value))}" x2="${BAR.x + BAR.width + 4}" y2="${f(barY(value))}" stroke="${COLORS.primitive}" stroke-width="1.4" /><text x="${BAR.x + BAR.width + 8}" y="${f(barY(value) + 5)}" fill="${COLORS.label}" class="mohr-small">${formatNumber(value)}${value === TS_TOP ? '+' : ''}</text>`).join('')}
        </g>
        <g data-ref="critical">
          <rect x="${CENTER.x - RADIUS}" y="${CENTER.y - RADIUS}" width="${RADIUS * 2}" height="${RADIUS * 2}" fill="url(#net-hatch)" mask="url(#net-mask)" clip-path="url(#net-clip)" />
          <rect x="${BAR.x}" y="${f(barY(TS_TOP))}" width="${BAR.width}" height="${f(barY(BYERLEE.mu) - barY(TS_TOP))}" fill="url(#net-hatch)" />
          <text x="${BAR.x + BAR.width + 8}" y="${f(barY(BYERLEE.mu) + 22)}" fill="${COLORS.label}" class="mohr-small">slips</text>
        </g>` : ''}
        ${ballMarkup}
        <circle cx="${CENTER.x}" cy="${CENTER.y}" r="${RADIUS}" fill="none" stroke="${COLORS.primitive}" stroke-width="2" />
        <g stroke="${ballMarkup ? '#6b7280' : COLORS.primitive}" stroke-width="1.4">
          <line x1="${CENTER.x - 7}" y1="${CENTER.y}" x2="${CENTER.x + 7}" y2="${CENTER.y}" />
          <line x1="${CENTER.x}" y1="${CENTER.y - 7}" x2="${CENTER.x}" y2="${CENTER.y + 7}" />
        </g>
        <g stroke="${COLORS.primitive}" stroke-width="1.4">
          ${compass.map(([, dx, dy]) => `<line x1="${CENTER.x + dx * RADIUS}" y1="${CENTER.y + dy * RADIUS}" x2="${CENTER.x + dx * (RADIUS + 8)}" y2="${CENTER.y + dy * (RADIUS + 8)}" />`).join('')}
        </g>
        <text x="${CENTER.x - 12}" y="${CENTER.y - RADIUS - 8}" text-anchor="end" fill="${COLORS.label}" class="net-compass">N</text>
        ${ts !== null && options.showMap ? `<g data-ref="pole"><path d="M ${BAR.x - 6} ${f(barY(ts))} l -11 -7 l 0 14 z" fill="${COLORS.plane}" stroke="#1b1f27" stroke-width="1.5" /></g>` : ''}
        ${auxMarkup}
        ${planeMarkup}
        ${axisMarkup}
        ${kinematicMarkup}
        ${slipMarkup}
        ${markerMarkup}
        ${legendMarkup}
      </svg>`;
    if (this.highlightRef) this.highlight(this.highlightRef);
  }
}
