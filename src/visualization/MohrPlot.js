import { coulombAngles, mohrCircle, mohrPoint, sigma1AtFailure } from '../domain/failure.js';
import { formatNumber } from '../domain/format.js';
import { applyRefHighlight, bindRefHover, niceStep, symbol } from './plotKit.js';

const WIDTH = 480;
const MARGIN = { left: 30, right: 24, top: 48, bottom: 58 };
const RAD = Math.PI / 180;

const COLORS = {
  axis: '#9aa1ad',
  circle: '#f4f5f7',
  envelope: '#3fd0a0',
  sigma1: '#f07a3c',
  sigma3: '#56b4e9',
  twoTheta: '#e69f00',
  fault: '#f4f5f7',
  conjugate: '#a7aeb8',
  caption: '#9aa1ad',
};

/**
 * 2D Mohr diagram for planes that contain σ2 (the σ1–σ3 circle), with the
 * Coulomb envelope τ = C + μσn. σ3 and C are fixed teaching values; σ1 is
 * the value that just brings the circle to the envelope, so the tangent
 * point is the predicted fault. Compression positive, σn to the right.
 * Groups carry data-ref (see sceneRefs.js) for equation–model binding.
 */
export class MohrPlot {
  constructor(container, { onHover } = {}) {
    this.container = container;
    this.onHover = onHover;
    this.state = { mu: 0.6, cohesion: 10, sigma3: 20 };
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
    const { mu, cohesion, sigma3 } = this.state;
    const sigma1 = sigma1AtFailure(sigma3, { cohesion, mu });
    const { center, radius } = mohrCircle(sigma1, sigma3);
    const angles = coulombAngles(mu);
    const point = mohrPoint(sigma1, sigma3, angles.theta);

    const xMax = sigma1 * 1.1;
    const xMin = -0.1 * xMax;
    const scale = (WIDTH - MARGIN.left - MARGIN.right) / (xMax - xMin);
    const yMax = radius * 1.28;
    const plotHeight = 2 * yMax * scale;
    const height = MARGIN.top + plotHeight + MARGIN.bottom;
    const px = (sigmaN) => MARGIN.left + (sigmaN - xMin) * scale;
    const py = (tau) => MARGIN.top + (yMax - tau) * scale;
    const f = (value) => value.toFixed(1);

    const right = WIDTH - MARGIN.right;
    const axisY = py(0);
    const step = niceStep(xMax);
    const ticks = [];
    // Leave the right end of the axis for its label.
    const tickLimit = xMax - 100 / scale;
    // Skip tick labels that would sit under the σ1 and σ3 markers.
    const clear = (value) => Math.abs(value - sigma3) * scale > 22 && Math.abs(value - sigma1) * scale > 22;
    for (let value = step; value < tickLimit; value += step) if (clear(value)) ticks.push(value);

    // Envelope: the Coulomb line above the axis and its mirror below (planes sheared the other way).
    const x0 = Math.max(xMin, -cohesion / Math.max(mu, 1e-6));
    const envelope = (sign) => `<line x1="${f(px(x0))}" y1="${f(py(sign * (cohesion + mu * x0)))}" x2="${f(px(xMax))}" y2="${f(py(sign * (cohesion + mu * xMax)))}" />`;

    // 2θ: from the σ1 end of the diameter, counterclockwise to the fault point.
    const arcRadius = Math.min(radius * scale * 0.34, 46);
    const twoThetaEnd = { x: px(center) + arcRadius * Math.cos(angles.twoTheta * RAD), y: axisY - arcRadius * Math.sin(angles.twoTheta * RAD) };
    const twoThetaLabel = { x: px(center) + (arcRadius + 20) * Math.cos((angles.twoTheta / 2) * RAD), y: axisY - (arcRadius + 20) * Math.sin((angles.twoTheta / 2) * RAD) };

    // φ: the angle between the envelope and the horizontal, drawn where the line meets the τ axis.
    const phiOrigin = { x: px(0), y: py(cohesion) };
    const phiRadius = 58;
    const phiEnd = { x: phiOrigin.x + phiRadius * Math.cos(angles.phi * RAD), y: phiOrigin.y - phiRadius * Math.sin(angles.phi * RAD) };
    const phiLabel = { x: phiOrigin.x + (phiRadius + 16) * Math.cos((angles.phi / 2) * RAD), y: phiOrigin.y - (phiRadius + 16) * Math.sin((angles.phi / 2) * RAD) + 6 };

    this.container.innerHTML = `
      <svg class="mohr-svg" viewBox="0 0 ${WIDTH} ${f(height)}" preserveAspectRatio="xMidYMid meet" role="img"
        aria-label="Mohr diagram: circle from σ3 = ${formatNumber(sigma3, 0)} to σ1 = ${formatNumber(sigma1, 0)} MPa touching the Coulomb line with μ = ${formatNumber(mu)}; the fault plots at 2θ = ${formatNumber(angles.twoTheta, 1)}°.">
        <defs>
          <clipPath id="mohr-clip"><rect x="${MARGIN.left}" y="${MARGIN.top}" width="${right - MARGIN.left}" height="${f(plotHeight)}" /></clipPath>
          <marker id="mohr-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${COLORS.axis}" /></marker>
        </defs>
        <text class="mohr-title" x="${MARGIN.left}" y="30">Mohr diagram</text>
        <g class="mohr-axes" stroke="${COLORS.axis}" stroke-width="1.6">
          <line x1="${MARGIN.left}" y1="${f(axisY)}" x2="${right}" y2="${f(axisY)}" marker-end="url(#mohr-arrow)" />
          <line x1="${f(px(0))}" y1="${f(MARGIN.top + plotHeight)}" x2="${f(px(0))}" y2="${MARGIN.top - 6}" marker-end="url(#mohr-arrow)" />
          ${ticks.map((value) => `<line x1="${f(px(value))}" y1="${f(axisY - 5)}" x2="${f(px(value))}" y2="${f(axisY + 5)}" />`).join('')}
        </g>
        <g class="mohr-ticks" fill="${COLORS.axis}">
          ${ticks.map((value) => `<text x="${f(px(value))}" y="${f(axisY + 22)}" text-anchor="middle">${value}</text>`).join('')}
          <text x="${right}" y="${f(axisY + 24)}" text-anchor="end" class="mohr-axis-label">${symbol('σ', 'n', { upright: false })}(MPa)</text>
          <text x="${f(px(0) + 10)}" y="${MARGIN.top + 8}" class="mohr-axis-label"><tspan font-style="italic">τ</tspan></text>
          <text x="${f(px(0) - 8)}" y="${f(axisY + 22)}" text-anchor="end">0</text>
        </g>
        <g clip-path="url(#mohr-clip)">
          <g data-ref="envelope" stroke="${COLORS.envelope}" stroke-width="3.2" fill="${COLORS.envelope}">
            ${envelope(1)}
            <g stroke-dasharray="9 7" opacity="0.7">${envelope(-1)}</g>
            <line x1="${f(px(x0))}" y1="${f(py(cohesion + mu * x0))}" x2="${f(px(xMax))}" y2="${f(py(cohesion + mu * xMax))}" stroke="transparent" stroke-width="18" />
          </g>
          <g data-ref="phi"${angles.phi < 4 ? ' visibility="hidden"' : ''} stroke="${COLORS.envelope}" fill="none" stroke-width="2.2">
            <line x1="${f(phiOrigin.x)}" y1="${f(phiOrigin.y)}" x2="${f(phiOrigin.x + phiRadius + 14)}" y2="${f(phiOrigin.y)}" stroke-dasharray="5 5" />
            <path d="M ${f(phiOrigin.x + phiRadius)} ${f(phiOrigin.y)} A ${phiRadius} ${phiRadius} 0 0 0 ${f(phiEnd.x)} ${f(phiEnd.y)}" />
            <text x="${f(phiLabel.x)}" y="${f(phiLabel.y)}" fill="${COLORS.envelope}" stroke="none" class="mohr-label" font-style="italic">φ</text>
          </g>
        </g>
        <g data-ref="envelope" fill="${COLORS.envelope}">
          <line x1="${f(right - 214)}" y1="23" x2="${f(right - 184)}" y2="23" stroke="${COLORS.envelope}" stroke-width="3.2" />
          <text class="mohr-label" x="${right}" y="31" text-anchor="end"><tspan font-style="italic">τ</tspan> = <tspan font-style="italic">C</tspan> + <tspan font-style="italic">μσ</tspan><tspan font-size="0.68em" dy="0.32em" font-style="italic">n</tspan></text>
        </g>
        <g data-ref="mohr-circle" fill="none" stroke="${COLORS.circle}" stroke-width="2.6">
          <circle cx="${f(px(center))}" cy="${f(axisY)}" r="${f(radius * scale)}" />
          <circle cx="${f(px(center))}" cy="${f(axisY)}" r="${f(radius * scale)}" stroke="transparent" stroke-width="16" />
        </g>
        <g data-ref="two-theta" stroke="${COLORS.twoTheta}" fill="none" stroke-width="2.4">
          <line x1="${f(px(center))}" y1="${f(axisY)}" x2="${f(px(point.sigmaN))}" y2="${f(py(point.tau))}" stroke-dasharray="7 5" />
          <line x1="${f(px(center))}" y1="${f(axisY)}" x2="${f(px(sigma1))}" y2="${f(axisY)}" stroke-dasharray="7 5" />
          <path d="M ${f(px(center) + arcRadius)} ${f(axisY)} A ${f(arcRadius)} ${f(arcRadius)} 0 ${angles.twoTheta > 180 ? 1 : 0} 0 ${f(twoThetaEnd.x)} ${f(twoThetaEnd.y)}" />
          <text x="${f(twoThetaLabel.x)}" y="${f(twoThetaLabel.y)}" fill="${COLORS.twoTheta}" stroke="none" class="mohr-label" text-anchor="middle">2<tspan font-style="italic">θ</tspan></text>
        </g>
        <g data-ref="sigma-3" fill="${COLORS.sigma3}">
          <circle cx="${f(px(sigma3))}" cy="${f(axisY)}" r="6" />
          <text x="${f(px(sigma3))}" y="${f(axisY + 46)}" text-anchor="middle" class="mohr-label">${symbol('σ', '3')}</text>
        </g>
        <g data-ref="sigma-1" fill="${COLORS.sigma1}">
          <circle cx="${f(px(sigma1))}" cy="${f(axisY)}" r="6" />
          <text x="${f(px(sigma1))}" y="${f(axisY + 46)}" text-anchor="middle" class="mohr-label">${symbol('σ', '1')}</text>
        </g>
        <g data-ref="conjugate">
          <circle cx="${f(px(point.sigmaN))}" cy="${f(py(-point.tau))}" r="7.5" fill="#1b1f27" stroke="${COLORS.conjugate}" stroke-width="2.6" />
          <text x="${f(px(point.sigmaN) - 14)}" y="${f(py(-point.tau) + 26)}" text-anchor="end" fill="${COLORS.conjugate}" class="mohr-small">conjugate</text>
        </g>
        <g data-ref="fault">
          <circle cx="${f(px(point.sigmaN))}" cy="${f(py(point.tau))}" r="8.5" fill="${COLORS.fault}" stroke="#1b1f27" stroke-width="2" />
          <text x="${f(px(point.sigmaN) - 14)}" y="${f(py(point.tau) - 14)}" text-anchor="end" fill="${COLORS.fault}" class="mohr-small">fault</text>
        </g>
        <text x="${MARGIN.left}" y="${f(height - 14)}" fill="${COLORS.caption}" class="mohr-caption">Illustrative magnitudes: ${symbol('σ', '3')}= ${formatNumber(sigma3, 0)} MPa, <tspan font-style="italic">C</tspan> = ${formatNumber(cohesion, 0)} MPa. Angles are exact.</text>
      </svg>`;
    if (this.highlightRef) this.highlight(this.highlightRef);
  }
}
