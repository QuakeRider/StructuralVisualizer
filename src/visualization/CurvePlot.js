import { formatNumber } from '../domain/format.js';

const WIDTH = 480;
const HEIGHT = 350;
const MARGIN = { left: 46, right: 20, top: 78, bottom: 58 };

/**
 * Curves of an angle θ from 0° to 180°, with a marker at the current θ.
 * Each curve is { ref, label (SVG text markup), f(θ in degrees), color, dash? }.
 * Groups carry data-ref (see sceneRefs.js) for equation–model binding.
 */
export class CurvePlot {
  constructor(container, { curves, yRange = [-0.6, 1.1], title = '', onHover } = {}) {
    this.container = container;
    this.curves = curves;
    this.yRange = yRange;
    this.title = title;
    this.onHover = onHover;
    this.theta = 0;
    this.highlightRef = null;
    this.hoverRef = null;
    container.addEventListener('pointerover', (event) => this.setHoverRef(event.target.closest?.('[data-ref]')?.dataset.ref ?? null));
    container.addEventListener('pointerleave', () => this.setHoverRef(null));
    this.render();
  }

  setHoverRef(ref) {
    if (ref === this.hoverRef) return;
    this.hoverRef = ref;
    this.onHover?.(ref);
  }

  setTheta(theta) {
    if (theta === this.theta) return;
    this.theta = theta;
    this.render();
  }

  highlight(ref) {
    this.highlightRef = ref;
    const svg = this.container.querySelector('svg');
    const active = ref && this.curves.some((curve) => curve.ref === ref) ? ref : null;
    svg.classList.toggle('has-highlight', Boolean(active));
    for (const element of svg.querySelectorAll('[data-ref]')) element.classList.toggle('is-highlighted', element.dataset.ref === active);
  }

  render() {
    const [yMin, yMax] = this.yRange;
    const px = (theta) => MARGIN.left + (theta / 180) * (WIDTH - MARGIN.left - MARGIN.right);
    const py = (value) => MARGIN.top + ((yMax - value) / (yMax - yMin)) * (HEIGHT - MARGIN.top - MARGIN.bottom);
    const f = (value) => value.toFixed(1);
    // The marker follows θ within one half-turn: these curves repeat every 180°.
    const marker = ((this.theta % 180) + 180) % 180;
    const path = (fn) => {
      const points = [];
      for (let theta = 0; theta <= 180; theta += 2) points.push(`${f(px(theta))},${f(py(fn(theta)))}`);
      return `M ${points.join(' L ')}`;
    };
    const gridX = [45, 90, 135, 180];
    const gridY = [-0.5, 0.5, 1];
    this.container.innerHTML = `
      <svg class="mohr-svg curve-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet" role="img"
        aria-label="${this.title}: ${this.curves.map((curve) => `${curve.name} = ${formatNumber(curve.f(marker))}`).join(', ')} at θ = ${formatNumber(marker, 1)}°.">
        <text class="mohr-title" x="${MARGIN.left}" y="28">${this.title}</text>
        <g stroke="#343a44" stroke-width="1">
          ${gridX.map((theta) => `<line x1="${f(px(theta))}" y1="${MARGIN.top}" x2="${f(px(theta))}" y2="${HEIGHT - MARGIN.bottom}" />`).join('')}
          ${gridY.map((value) => `<line x1="${MARGIN.left}" y1="${f(py(value))}" x2="${WIDTH - MARGIN.right}" y2="${f(py(value))}" />`).join('')}
        </g>
        <g stroke="#9aa1ad" stroke-width="1.6">
          <line x1="${MARGIN.left}" y1="${f(py(0))}" x2="${WIDTH - MARGIN.right}" y2="${f(py(0))}" />
          <line x1="${MARGIN.left}" y1="${MARGIN.top}" x2="${MARGIN.left}" y2="${HEIGHT - MARGIN.bottom}" />
        </g>
        <g class="mohr-ticks" fill="#9aa1ad">
          ${[0, ...gridX].map((theta) => `<text x="${f(px(theta))}" y="${HEIGHT - MARGIN.bottom + 22}" text-anchor="middle">${theta}°</text>`).join('')}
          ${[...gridY, 0].map((value) => `<text x="${MARGIN.left - 8}" y="${f(py(value) + 5)}" text-anchor="end">${formatNumber(value)}</text>`).join('')}
          <text x="${WIDTH - MARGIN.right}" y="${HEIGHT - 8}" text-anchor="end" class="mohr-axis-label"><tspan font-style="italic">θ</tspan></text>
        </g>
        ${this.curves.map((curve) => `
          <g data-ref="${curve.ref}" fill="none" stroke="${curve.color}" stroke-width="3.2">
            <path d="${path(curve.f)}"${curve.dash ? ` stroke-dasharray="${curve.dash}"` : ''} />
            <path d="${path(curve.f)}" stroke="transparent" stroke-width="16" />
            <circle cx="${f(px(marker))}" cy="${f(py(curve.f(marker)))}" r="7" fill="${curve.color}" stroke="#11141a" stroke-width="2" />
          </g>`).join('')}
        <line x1="${f(px(marker))}" y1="${MARGIN.top}" x2="${f(px(marker))}" y2="${HEIGHT - MARGIN.bottom}" stroke="#3fd0a0" stroke-width="1.6" stroke-dasharray="5 5" />
        <g class="curve-key">
          ${this.curves.map((curve, index) => `
            <g data-ref="${curve.ref}" transform="translate(${MARGIN.left + index * 180} 58)">
              <line x1="0" y1="-6" x2="26" y2="-6" stroke="${curve.color}" stroke-width="3.2"${curve.dash ? ` stroke-dasharray="${curve.dash}"` : ''} />
              <text x="34" y="0" fill="${curve.color}" class="curve-label">${curve.label}</text>
            </g>`).join('')}
        </g>
      </svg>`;
    if (this.highlightRef) this.highlight(this.highlightRef);
  }
}
