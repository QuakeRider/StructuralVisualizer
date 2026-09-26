import { BYERLEE, byerlee, coulombAngles, mohrCircles3D, mohrPoint } from '../domain/failure.js';
import { formatNumber } from '../domain/format.js';
import { applyRefHighlight, bindRefHover, niceStep, symbol } from './plotKit.js';

const WIDTH = 480;
const MARGIN = { left: 30, right: 24, top: 70, bottom: 86 };
/** Fixed axes, so the lines keep their place while stresses change. */
const X_RANGE = [-13, 260];
const Y_MAX = 120;

const COLORS = {
  axis: '#9aa1ad',
  circle: '#f4f5f7',
  small: '#b9bfc9',
  region: 'rgba(244, 245, 247, 0.09)',
  friction: '#3fd0a0',
  intact: '#c3c8d0',
  sigma1: '#f07a3c',
  sigma2: '#f0e442',
  sigma3: '#56b4e9',
  plane: '#d9b27c',
  normal: '#9a8cff',
  shear: '#cc79a7',
  pf: '#56b4e9',
  newFault: '#f4f5f7',
  caption: '#9aa1ad',
};

/**
 * 3D Mohr diagram for the friction lab (B6): the three circles of a stress
 * state (upper half, τ ≥ 0), the region between them where every plane
 * plots, Byerlee's friction line for existing planes, and the Coulomb line
 * for intact rock. One plane is a point; the line from the origin through
 * it has slope Ts. With pore pressure the circles are drawn at effective
 * stress, shifted left by Pf from where they would be dry.
 * Groups carry data-ref (see sceneRefs.js) for equation–model binding.
 */
export class FrictionMohrPlot {
  constructor(container, { onHover } = {}) {
    this.container = container;
    this.onHover = onHover;
    this.state = {
      magnitudes: { sigma1: 150, sigma2: 90, sigma3: 30 },
      pf: 0,
      intact: { cohesion: 20, mu: 0.85 },
      point: null,
      slips: false,
      newFault: false,
      markers: [],
      options: {},
    };
    this.highlightRef = null;
    bindRefHover(container, (ref) => this.onHover?.(ref));
    this.render();
  }

  setState(state) {
    this.state = { ...this.state, ...state };
    this.render();
  }

  highlight(ref) {
    this.highlightRef = ref;
    applyRefHighlight(this.container.querySelector('svg'), ref);
  }

  render() {
    const { magnitudes, pf, intact, point, pointLabel = 'plane', slips, newFault, markers } = this.state;
    const options = { showIntact: true, showFriction: true, showRegion: true, showPoint: true, showTsLine: false, showProjections: false, effective: false, ...this.state.options };
    const [xMin, xMax] = X_RANGE;
    const scale = (WIDTH - MARGIN.left - MARGIN.right) / (xMax - xMin);
    const plotHeight = Y_MAX * scale;
    const height = MARGIN.top + plotHeight + MARGIN.bottom;
    const px = (sigmaN) => MARGIN.left + (sigmaN - xMin) * scale;
    const py = (tau) => MARGIN.top + (Y_MAX - tau) * scale;
    const f = (value) => value.toFixed(1);
    const right = WIDTH - MARGIN.right;
    const axisY = py(0);

    // Everything is plotted in effective stress: σ′ = σ − Pf.
    const effective = { sigma1: magnitudes.sigma1 - pf, sigma2: magnitudes.sigma2 - pf, sigma3: magnitudes.sigma3 - pf };
    const [big, upper, lower] = mohrCircles3D(effective);
    const semicircle = ({ center, radius }) => `M ${f(px(center - radius))} ${f(axisY)} A ${f(radius * scale)} ${f(radius * scale)} 0 0 1 ${f(px(center + radius))} ${f(axisY)}`;
    // The region: out along the big arc from σ3 to σ1, back over the two small arcs.
    const region = `${semicircle(big)} A ${f(upper.radius * scale)} ${f(upper.radius * scale)} 0 0 0 ${f(px(effective.sigma2))} ${f(axisY)} A ${f(lower.radius * scale)} ${f(lower.radius * scale)} 0 0 0 ${f(px(effective.sigma3))} ${f(axisY)} Z`;

    const step = niceStep(xMax);
    const markersOnAxis = [effective.sigma1, effective.sigma2, effective.sigma3];
    const ticks = [];
    for (let value = step; value < xMax - 96 / scale; value += step) {
      if (markersOnAxis.every((marker) => Math.abs(value - marker) * scale > 24)) ticks.push(value);
    }

    // Byerlee: two straight segments meeting at σn′ = 200 MPa.
    const frictionPath = `M ${f(px(0))} ${f(py(0))} L ${f(px(BYERLEE.transition))} ${f(py(byerlee(BYERLEE.transition)))} L ${f(px(xMax))} ${f(py(byerlee(xMax)))}`;
    const intactStart = Math.max(xMin, -intact.cohesion / intact.mu);
    const intactPath = `M ${f(px(intactStart))} ${f(py(intact.cohesion + intact.mu * intactStart))} L ${f(px(xMax))} ${f(py(intact.cohesion + intact.mu * xMax))}`;

    const pointEff = point ? { sigmaN: point.sigmaN - pf, tau: point.tau } : null;
    // Ts line: from the origin through the plane's point, to the edge of the plot.
    let tsLine = '';
    if (pointEff && options.showTsLine && pointEff.sigmaN > 1e-6) {
      const slope = pointEff.tau / pointEff.sigmaN;
      const endX = Math.min(xMax, Y_MAX / Math.max(slope, 1e-6));
      // Label where the line leaves the plot: along the top edge, or at the right edge.
      const exitsTop = endX < xMax;
      const label = exitsTop
        ? { x: px(endX) + 8, y: MARGIN.top + 16, anchor: 'start' }
        : { x: right - 4, y: py(slope * endX) - 10, anchor: 'end' };
      tsLine = `
        <g data-ref="ts-line" stroke="${COLORS.plane}" fill="${COLORS.plane}">
          <line x1="${f(px(0))}" y1="${f(axisY)}" x2="${f(px(endX))}" y2="${f(py(slope * endX))}" stroke-width="2.4" stroke-dasharray="3 6" />
          <line x1="${f(px(0))}" y1="${f(axisY)}" x2="${f(px(endX))}" y2="${f(py(slope * endX))}" stroke="transparent" stroke-width="16" />
          <text x="${f(label.x)}" y="${f(label.y)}" text-anchor="${label.anchor}" stroke="none" class="mohr-small">slope = <tspan class="mohr-math" font-style="italic">T</tspan><tspan class="mohr-math" font-size="0.75em" dy="0.3em">s</tspan></text>
        </g>`;
    }

    let projections = '';
    if (pointEff && options.showProjections) {
      projections = `
        <g data-ref="normal-stress" stroke="${COLORS.normal}" fill="${COLORS.normal}">
          <line x1="${f(px(pointEff.sigmaN))}" y1="${f(py(pointEff.tau))}" x2="${f(px(pointEff.sigmaN))}" y2="${f(axisY)}" stroke-width="2.4" stroke-dasharray="6 5" />
          <line x1="${f(px(0))}" y1="${f(axisY + 3)}" x2="${f(px(pointEff.sigmaN))}" y2="${f(axisY + 3)}" stroke-width="4" />
        </g>
        <g data-ref="shear-stress" stroke="${COLORS.shear}" fill="${COLORS.shear}">
          <line x1="${f(px(pointEff.sigmaN))}" y1="${f(py(pointEff.tau))}" x2="${f(px(0))}" y2="${f(py(pointEff.tau))}" stroke-width="2.4" stroke-dasharray="6 5" />
          <line x1="${f(px(0) - 3)}" y1="${f(axisY)}" x2="${f(px(0) - 3)}" y2="${f(py(pointEff.tau))}" stroke-width="4" />
        </g>`;
    }

    // Tangent point of the circle on the intact line: where a new fault forms.
    let newFaultMarker = '';
    if (newFault) {
      const theta = coulombAngles(intact.mu).theta;
      const contact = mohrPoint(effective.sigma1, effective.sigma3, theta);
      newFaultMarker = `
        <g data-ref="new-fault">
          <path d="M ${f(px(contact.sigmaN))} ${f(py(contact.tau) - 11)} l 11 11 l -11 11 l -11 -11 z" fill="${COLORS.newFault}" stroke="#1b1f27" stroke-width="2" />
          <text x="${f(px(contact.sigmaN) + 14)}" y="${f(py(contact.tau) - 8)}" fill="${COLORS.newFault}" class="mohr-small">new fault</text>
        </g>`;
    }

    // Pore pressure: the dry σ1–σ3 circle (dashed) and the shift to the left.
    let pfShift = '';
    if (options.effective && pf > 0.01) {
      const dry = mohrCircles3D(magnitudes)[0];
      // The arrow runs from the dry σ1 to the effective σ1, just above the axis.
      const arrowY = axisY - 16;
      pfShift = `
        <g data-ref="pf" fill="none" stroke="${COLORS.pf}">
          <path d="${semicircle(dry)}" stroke-width="2" stroke-dasharray="7 6" opacity="0.8" />
          <path d="${semicircle(dry)}" stroke="transparent" stroke-width="14" />
          <line x1="${f(px(magnitudes.sigma1))}" y1="${f(arrowY)}" x2="${f(px(effective.sigma1) + 2)}" y2="${f(arrowY)}" stroke-width="3" marker-end="url(#fm-arrow-pf)" />
          <text x="${f(px(magnitudes.sigma1) + 6)}" y="${f(arrowY - 8)}" fill="${COLORS.pf}" stroke="none" class="mohr-label">−${symbol('P', 'f', { upright: false })}</text>
        </g>`;
    }

    const markerDots = markers.map((marker) => `
      <g data-ref="mapped-faults">
        <circle cx="${f(px(marker.sigmaN - pf))}" cy="${f(py(marker.tau))}" r="10" fill="#1b1f27" stroke="${COLORS.plane}" stroke-width="2" />
        <text x="${f(px(marker.sigmaN - pf))}" y="${f(py(marker.tau) + 5)}" text-anchor="middle" fill="${COLORS.plane}" class="mohr-small">${marker.label}</text>
      </g>`).join('');

    const axisName = `${symbol('σ', 'n', { upright: false, prime: options.effective })}(MPa)`;
    const ts = pointEff && pointEff.sigmaN > 1e-6 ? pointEff.tau / pointEff.sigmaN : null;
    const summary = point
      ? `The plane plots at σn${options.effective ? '′' : ''} = ${formatNumber(pointEff.sigmaN, 0)} MPa, τ = ${formatNumber(pointEff.tau, 0)} MPa${ts === null ? '' : `, slip tendency ${formatNumber(ts)}`}; it ${slips ? 'reaches' : 'stays below'} the friction line.`
      : '';

    this.container.innerHTML = `
      <svg class="mohr-svg" viewBox="0 0 ${WIDTH} ${f(height)}" preserveAspectRatio="xMidYMid meet" role="img"
        aria-label="Mohr diagram with three circles from σ3 = ${formatNumber(effective.sigma3, 0)} to σ1 = ${formatNumber(effective.sigma1, 0)} MPa${options.effective ? ' (effective stress)' : ''}. ${summary}">
        <defs>
          <clipPath id="fm-clip"><rect x="${MARGIN.left}" y="${MARGIN.top}" width="${right - MARGIN.left}" height="${f(plotHeight)}" /></clipPath>
          <marker id="fm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${COLORS.axis}" /></marker>
          <marker id="fm-arrow-pf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${COLORS.pf}" /></marker>
        </defs>
        <text class="mohr-title" x="${MARGIN.left}" y="28">Mohr diagram</text>
        <g class="mohr-legend">
          ${options.showFriction ? `<g data-ref="friction"><line x1="${right - 214}" y1="21" x2="${right - 186}" y2="21" stroke="${COLORS.friction}" stroke-width="3.2" /><text x="${right - 178}" y="27" fill="${COLORS.friction}" class="mohr-small">sliding friction (Byerlee)</text></g>` : ''}
          ${options.showIntact ? `<g data-ref="intact"><line x1="${right - 214}" y1="47" x2="${right - 186}" y2="47" stroke="${COLORS.intact}" stroke-width="3.2" stroke-dasharray="9 6" /><text x="${right - 178}" y="53" fill="${COLORS.intact}" class="mohr-small">intact rock (<tspan font-style="italic">C</tspan> = ${formatNumber(intact.cohesion, 0)} MPa)</text></g>` : ''}
        </g>
        <g class="mohr-axes" stroke="${COLORS.axis}" stroke-width="1.6">
          <line x1="${MARGIN.left}" y1="${f(axisY)}" x2="${right}" y2="${f(axisY)}" marker-end="url(#fm-arrow)" />
          <line x1="${f(px(0))}" y1="${f(axisY)}" x2="${f(px(0))}" y2="${MARGIN.top - 6}" marker-end="url(#fm-arrow)" />
          ${ticks.map((value) => `<line x1="${f(px(value))}" y1="${f(axisY - 5)}" x2="${f(px(value))}" y2="${f(axisY + 5)}" />`).join('')}
        </g>
        <g class="mohr-ticks" fill="${COLORS.axis}">
          ${ticks.map((value) => `<text x="${f(px(value))}" y="${f(axisY + 22)}" text-anchor="middle">${value}</text>`).join('')}
          <text x="${right}" y="${f(axisY + 24)}" text-anchor="end" class="mohr-axis-label">${axisName}</text>
          <text x="${f(px(0) + 10)}" y="${MARGIN.top + 8}" class="mohr-axis-label"><tspan font-style="italic">τ</tspan></text>
          <text x="${f(px(0) - 8)}" y="${f(axisY + 22)}" text-anchor="end">0</text>
        </g>
        <g clip-path="url(#fm-clip)">
          ${pfShift}
          ${options.showRegion ? `
          <g data-ref="mohr-region">
            <path d="${region}" fill="${COLORS.region}" stroke="none" />
            <path d="${semicircle(upper)}" fill="none" stroke="${COLORS.small}" stroke-width="1.8" />
            <path d="${semicircle(lower)}" fill="none" stroke="${COLORS.small}" stroke-width="1.8" />
          </g>` : ''}
          <g data-ref="mohr-circle" fill="none" stroke="${COLORS.circle}" stroke-width="2.6">
            <path d="${semicircle(big)}" />
            <path d="${semicircle(big)}" stroke="transparent" stroke-width="16" />
          </g>
          ${options.showIntact ? `
          <g data-ref="intact" fill="none" stroke="${COLORS.intact}" stroke-width="3">
            <path d="${intactPath}" stroke-dasharray="9 6" />
            <path d="${intactPath}" stroke="transparent" stroke-width="16" />
          </g>` : ''}
          ${options.showFriction ? `
          <g data-ref="friction" fill="none" stroke="${COLORS.friction}" stroke-width="3.2">
            <path d="${frictionPath}" />
            <path d="${frictionPath}" stroke="transparent" stroke-width="16" />
          </g>` : ''}
          ${tsLine}
          ${projections}
        </g>
        ${['sigma3', 'sigma2', 'sigma1'].map((key) => `
        <g data-ref="sigma-${key.slice(-1)}" fill="${COLORS[key]}">
          <circle cx="${f(px(effective[key]))}" cy="${f(axisY)}" r="5.5" />
          <text x="${f(px(effective[key]))}" y="${f(axisY + 46)}" text-anchor="middle" class="mohr-label">${symbol('σ', key.slice(-1), { prime: options.effective })}</text>
        </g>`).join('')}
        ${newFaultMarker}
        ${markerDots}
        ${pointEff && options.showPoint ? `
        <g data-ref="plane-point">
          ${slips ? `<circle cx="${f(px(pointEff.sigmaN))}" cy="${f(py(pointEff.tau))}" r="15" fill="none" stroke="${COLORS.friction}" stroke-width="3" />` : ''}
          <circle cx="${f(px(pointEff.sigmaN))}" cy="${f(py(pointEff.tau))}" r="8.5" fill="${COLORS.plane}" stroke="#1b1f27" stroke-width="2" />
          <text x="${f(px(pointEff.sigmaN) - 16)}" y="${f(py(pointEff.tau) - 14)}" text-anchor="end" fill="${COLORS.plane}" class="mohr-small">${slips ? `${pointLabel}: slips` : pointLabel}</text>
        </g>` : ''}
        <text x="${MARGIN.left}" y="${f(height - 10)}" fill="${COLORS.caption}" class="mohr-caption">Illustrative stresses: ${symbol('σ', '3')}= ${formatNumber(magnitudes.sigma3, 0)} MPa, ${symbol('σ', '2')}halfway to ${symbol('σ', '1')}. Upper half shown.</text>
      </svg>`;
    if (this.highlightRef) this.highlight(this.highlightRef);
  }
}
