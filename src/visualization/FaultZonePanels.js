// Schematic 2D panels for the fault-zone lab (B11): a plan view of damage
// around a segmented fault, a depth column of fault rocks, and Caine et al.'s
// architecture gauge. Every drawn item carries a data-ref for equation–model binding.

import { ZONE_TEMPERATURES, depthOfTemperature, seededRandom } from '../domain/faultRocks.js';
import { crustHalfWidth } from './FaultZoneScene.js';
import { applyRefHighlight, bindRefHover } from './plotKit.js';

const WIDTH = 480;
const HEIGHT = 440;
const ZONE_FILL = {
  'zone-incohesive': '#d9c49a',
  'zone-cataclasite': '#463e38',
  'zone-quartz': '#56b4e9',
  'zone-mylonite': '#9a8cff',
};

class Panel {
  constructor(container, { onHover } = {}) {
    this.container = container;
    this.highlightRef = null;
    bindRefHover(container, (ref) => onHover?.(ref));
  }

  highlight(ref) {
    this.highlightRef = ref;
    applyRefHighlight(this.container.querySelector('svg'), ref);
  }

  draw(markup, ariaLabel) {
    this.container.innerHTML = `<svg class="mohr-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${ariaLabel}">${markup}</svg>`;
    if (this.highlightRef) this.highlight(this.highlightRef);
  }
}

/**
 * Plan view of two fault segments with the three kinds of damage zone
 * (Kim, Peacock & Sanderson 2004): wall damage along the traces, tip damage
 * (splays and wing cracks) at the ends, and linking damage between the
 * overlapping segments, plus the process zone ahead of a growing tip. Schematic.
 */
export class DamageMap extends Panel {
  render() {
    const random = seededRandom(12);
    const A = { x0: 56, x1: 262, y: 176 };
    const B = { x0: 172, x1: 380, y: 256 };
    const band = (segment, half) => `<rect x="${segment.x0}" y="${segment.y - half}" width="${segment.x1 - segment.x0}" height="${2 * half}" rx="${half}" fill="#e69f00" opacity="0.22" />`;
    const cracks = (count, box, angle) => {
      let markup = '';
      for (let index = 0; index < count; index += 1) {
        const x = box.x0 + random() * (box.x1 - box.x0);
        const y = box.y0 + random() * (box.y1 - box.y0);
        const turn = ((angle + (random() - 0.5) * 30) * Math.PI) / 180;
        const length = 8 + random() * 10;
        markup += `<line x1="${(x - Math.cos(turn) * length / 2).toFixed(1)}" y1="${(y - Math.sin(turn) * length / 2).toFixed(1)}" x2="${(x + Math.cos(turn) * length / 2).toFixed(1)}" y2="${(y + Math.sin(turn) * length / 2).toFixed(1)}" />`;
      }
      return markup;
    };
    // Horsetail splays: curved branches off the western tip of A.
    const splays = [-1, 1, -0.5, 0.5].map((side) => `<path d="M ${A.x0 + 18} ${A.y} Q ${A.x0 - 6} ${A.y + side * 8} ${A.x0 - 24} ${A.y + side * 34}" />`).join('');
    const wings = [-1, 1].map((side) => `<path d="M ${A.x0 + 4} ${A.y} q -8 ${side * 4} -14 ${side * 18}" />`).join('');
    const markup = `
      <text class="mohr-title" x="16" y="28">Where the damage is</text>
      <text class="mohr-caption" x="16" y="50" fill="#9aa1ad">Map view of two fault segments (schematic).</text>
      <g data-ref="wall-damage">${band(A, 16)}${band(B, 16)}<g stroke="#2a2622" stroke-width="1.6">${cracks(26, { x0: A.x0 + 30, x1: A.x1 - 90, y0: A.y - 14, y1: A.y + 14 }, 20)}${cracks(24, { x0: B.x0 + 100, x1: B.x1 - 20, y0: B.y - 14, y1: B.y + 14 }, 20)}</g></g>
      <g data-ref="linking-damage"><rect x="${B.x0}" y="${A.y + 6}" width="${A.x1 - B.x0}" height="${B.y - A.y - 12}" fill="#e69f00" opacity="0.3" /><g stroke="#2a2622" stroke-width="1.6">${cracks(34, { x0: B.x0 + 6, x1: A.x1 - 6, y0: A.y + 12, y1: B.y - 12 }, 55)}</g></g>
      <g data-ref="tip-damage"><circle cx="${A.x0}" cy="${A.y}" r="42" fill="#e69f00" opacity="0.22" /><g fill="none" stroke="#2a2622" stroke-width="1.8">${splays}${wings}</g></g>
      <g data-ref="process-zone"><ellipse cx="${B.x1 + 26}" cy="${B.y}" rx="34" ry="22" fill="#cc79a7" opacity="0.18" stroke="#cc79a7" stroke-width="2" stroke-dasharray="6 4" /><g fill="#cc79a7">${Array.from({ length: 16 }, () => `<circle cx="${(B.x1 + 6 + random() * 42).toFixed(1)}" cy="${(B.y - 12 + random() * 24).toFixed(1)}" r="1.6" />`).join('')}</g></g>
      <g data-ref="fault-trace" stroke="#f4f5f7" stroke-width="3.2" stroke-linecap="round"><line x1="${A.x0}" y1="${A.y}" x2="${A.x1}" y2="${A.y}" /><line x1="${B.x0}" y1="${B.y}" x2="${B.x1}" y2="${B.y}" /></g>
      <g class="mohr-small" fill="#f4f5f7">
        <g data-ref="tip-damage"><text x="${A.x0 - 40}" y="${A.y - 50}" class="net-halo">tip damage</text></g>
        <g data-ref="wall-damage"><text x="${A.x0 + 90}" y="${A.y - 26}" class="net-halo">wall damage</text></g>
        <g data-ref="linking-damage"><text x="${(B.x0 + A.x1) / 2}" y="${B.y + 44}" text-anchor="middle" class="net-halo">linking damage</text><line x1="${(B.x0 + A.x1) / 2}" y1="${B.y + 28}" x2="${(B.x0 + A.x1) / 2}" y2="${B.y - 20}" stroke="#f4f5f7" stroke-width="1.2" /></g>
        <g data-ref="process-zone"><text x="${WIDTH - 12}" y="${B.y + 44}" text-anchor="end" class="net-halo" fill="#e7a6cb">process zone</text><text x="${WIDTH - 12}" y="${B.y + 62}" text-anchor="end" class="mohr-caption net-halo" fill="#e7a6cb">ahead of a growing tip</text></g>
        <g data-ref="fault-trace"><text x="${B.x1 - 40}" y="${B.y - 24}" class="net-halo" fill="#c3c8d0">fault trace</text></g>
      </g>
      <text class="mohr-caption" x="16" y="${HEIGHT - 44}" fill="#9aa1ad">Damage zones are widest at tips and where segments link,</text>
      <text class="mohr-caption" x="16" y="${HEIGHT - 24}" fill="#9aa1ad">after Kim, Peacock &amp; Sanderson (2004).</text>`;
    this.draw(markup, 'Map of two fault segments: wall damage along the traces, tip damage with splays at the western tip, linking damage between the overlapping segments, and a process zone ahead of the eastern tip.');
  }
}

/**
 * A depth column of fault rocks in quartz-rich crust for a geothermal
 * gradient: loose gouge and breccia, cataclasites (and pseudotachylyte in the
 * earthquake range), then mylonites, with the fault zone drawn wider where rock flows.
 */
export class DepthColumn extends Panel {
  setState({ gradient, surface, zones, maxDepth = 35 }) {
    const top = 72;
    const bottom = HEIGHT - 40;
    const y = (km) => top + (Math.min(km, maxDepth) / maxDepth) * (bottom - top);
    const column = { x0: 58, x1: 138 };
    const center = (column.x0 + column.x1) / 2;
    const quartz = zones[2].top;
    const feldspar = zones[3].top;
    // Zone names to the right; the second line only where the band is tall enough.
    const bands = zones.map((zone) => {
      if (zone.top >= maxDepth) return '';
      const [first, second] = zone.name.split('; ');
      const y0 = y(zone.top);
      const y1 = y(Math.min(zone.bottom, maxDepth));
      const two = second && y1 - y0 > 44;
      const middle = (y0 + y1) / 2 + (two ? -4 : 5);
      return `<g data-ref="${zone.id}"><rect x="${column.x0}" y="${y0}" width="${WIDTH - 12 - column.x0}" height="${y1 - y0}" fill="${ZONE_FILL[zone.id]}" opacity="0.12" />
        <text x="252" y="${middle}" class="mohr-small net-halo" fill="#f4f5f7">${first}</text>
        ${two ? `<text x="252" y="${middle + 18}" class="mohr-caption net-halo" fill="#c3c8d0">${second}</text>` : ''}</g>`;
    }).join('');
    // The fault zone: its half-width (km, exaggerated) drawn to 12 px per km.
    const samples = Array.from({ length: 71 }, (_, index) => (index / 70) * maxDepth);
    const halfPx = (km) => crustHalfWidth(km, quartz, feldspar) * 12;
    const outline = [...samples.map((km) => [center - halfPx(km), y(km)]), ...[...samples].reverse().map((km) => [center + halfPx(km), y(km)])];
    const zonePolygons = zones.map((zone) => {
      const inside = outline.filter(([, py]) => py >= y(zone.top) - 0.5 && py <= y(Math.min(zone.bottom, maxDepth)) + 0.5);
      return inside.length > 2 ? `<g data-ref="${zone.id}"><polygon points="${inside.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ')}" fill="${ZONE_FILL[zone.id]}" stroke="#11141a" stroke-width="1" /></g>` : '';
    }).join('');
    const isotherm = (temperature, label, dashed = false) => {
      const km = depthOfTemperature(temperature, gradient, surface);
      if (km >= maxDepth) return '';
      return `<g data-ref="isotherms"><line x1="${column.x0 - 6}" y1="${y(km)}" x2="${WIDTH - 12}" y2="${y(km)}" stroke="#f0e442" stroke-width="1.8" stroke-dasharray="${dashed ? '3 5' : '8 5'}" opacity="${dashed ? 0.55 : 0.85}" />
        <text x="${column.x1 + 8}" y="${y(km) - 4}" class="chart-tick net-halo" fill="#f0e442">${label}</text></g>`;
    };
    const quake = zones[1];
    const quakeStars = Array.from({ length: 4 }, (_, index) => {
      const km = quake.top + ((index + 0.5) / 4) * (quake.bottom - quake.top);
      if (km >= maxDepth) return '';
      const px = center + (index % 2 ? 4 : -4);
      const py = y(km);
      return `<path d="M ${px} ${py - 6} l 1.8 4 4.2 .4 -3.2 2.8 1 4.2 -3.8 -2.2 -3.8 2.2 1 -4.2 -3.2 -2.8 4.2 -.4 Z" fill="#f07a3c" stroke="#11141a" stroke-width="0.8" />`;
    }).join('');
    const ticks = Array.from({ length: Math.floor(maxDepth / 5) + 1 }, (_, index) => index * 5)
      .map((km) => `<text x="${column.x0 - 10}" y="${y(km) + 5}" text-anchor="end" class="chart-tick" fill="#9aa1ad">${km}</text><line x1="${column.x0 - 5}" y1="${y(km)}" x2="${column.x0}" y2="${y(km)}" stroke="#9aa1ad" />`).join('');
    const T = ZONE_TEMPERATURES;
    const markup = `
      <text class="mohr-title" x="16" y="28">Fault rocks with depth</text>
      <text class="mohr-caption" x="16" y="46" fill="#9aa1ad">Quartz-rich crust, ${gradient} °C/km. Fault-zone widths not to scale.</text>
      <text x="${column.x0 - 10}" y="${top - 6}" text-anchor="end" class="chart-tick" fill="#9aa1ad">km</text>
      ${ticks}
      ${bands}
      <g data-ref="fault-zone">${zonePolygons}</g>
      <g data-ref="earthquakes">${quakeStars}</g>
      ${isotherm(T.cohesive, '100 °C')}
      ${isotherm(T.calcite, '250 °C calcite', true)}
      ${isotherm(T.quartz, '300 °C quartz')}
      ${isotherm(T.feldspar, '450 °C feldspar')}
      <rect x="${column.x0}" y="${top}" width="${column.x1 - column.x0}" height="${bottom - top}" fill="none" stroke="#6c7380" />`;
    this.draw(markup, `Depth column for ${gradient} degrees per kilometre: loose fault rocks to ${zones[0].bottom.toFixed(1)} km, cataclasites to ${zones[1].bottom.toFixed(1)} km, then mylonites.`);
  }
}

const END_MEMBER_CELLS = [
  { id: 'localized-barrier', row: 0, column: 0, name: 'localized barrier', lines: ['core blocks flow', 'across the fault'] },
  { id: 'combined-conduit-barrier', row: 0, column: 1, name: 'combined', name2: 'conduit–barrier', lines: ['flow along the damage', 'zones, not across'] },
  { id: 'localized-conduit', row: 1, column: 0, name: 'localized conduit', lines: ['flow along the', 'slip surface'] },
  { id: 'distributed-conduit', row: 1, column: 1, name: 'distributed conduit', lines: ['flow through the whole', 'fractured zone'] },
];

/**
 * Caine, Evans & Forster's (1996) architecture: the index Fa on a bar from 0
 * (all core) to 1 (all damage zone), and the four end-members by whether the
 * core and the damage zones are well developed.
 */
export class ArchitectureGauge extends Panel {
  setState({ Fa, structure, limits }) {
    const bar = { x0: 60, x1: 420, y: 96 };
    const faX = bar.x0 + (bar.x1 - bar.x0) * (Fa ?? 0);
    const grid = { x0: 130, y0: 196, w: 165, h: 92 };
    const cells = END_MEMBER_CELLS.map((cell) => {
      const x = grid.x0 + cell.column * grid.w;
      const y = grid.y0 + cell.row * grid.h;
      const active = cell.id === structure.id;
      return `<g data-ref="end-member">
        <rect x="${x + 2}" y="${y + 2}" width="${grid.w - 4}" height="${grid.h - 4}" rx="6" fill="${active ? 'rgba(86, 180, 233, 0.26)' : 'rgba(255, 255, 255, 0.04)'}" stroke="${active ? '#56b4e9' : '#4a515c'}" stroke-width="${active ? 2.6 : 1.2}" />
        <text x="${x + grid.w / 2}" y="${y + 26}" text-anchor="middle" class="mohr-small" fill="${active ? '#f4f5f7' : '#c3c8d0'}" font-weight="600">${cell.name}</text>
        ${cell.name2 ? `<text x="${x + grid.w / 2}" y="${y + 44}" text-anchor="middle" class="mohr-small" fill="${active ? '#f4f5f7' : '#c3c8d0'}" font-weight="600">${cell.name2}</text>` : ''}
        ${cell.lines.map((line, index) => `<text x="${x + grid.w / 2}" y="${y + (cell.name2 ? 62 : 50) + index * 15}" text-anchor="middle" class="chart-tick" fill="#9aa1ad">${line}</text>`).join('')}
      </g>`;
    }).join('');
    const markup = `
      <text class="mohr-title" x="16" y="28">Conduit, barrier, or both?</text>
      <text class="mohr-caption" x="16" y="50" fill="#9aa1ad">After Caine, Evans &amp; Forster (1996).</text>
      <g data-ref="fa-gauge">
        <rect x="${bar.x0}" y="${bar.y}" width="${bar.x1 - bar.x0}" height="14" rx="7" fill="url(#fa-fill)" stroke="#6c7380" />
        <defs><linearGradient id="fa-fill" x1="0" x2="1"><stop offset="0" stop-color="#6b6259" /><stop offset="1" stop-color="#e69f00" /></linearGradient></defs>
        ${[0, 0.25, 0.5, 0.75, 1].map((value) => `<text x="${bar.x0 + (bar.x1 - bar.x0) * value}" y="${bar.y + 36}" text-anchor="middle" class="chart-tick" fill="#9aa1ad">${value}</text>`).join('')}
        <text x="${bar.x0}" y="${bar.y + 56}" class="chart-tick" fill="#9aa1ad">all core</text>
        <text x="${bar.x1}" y="${bar.y + 56}" text-anchor="end" class="chart-tick" fill="#9aa1ad">all damage zone</text>
        <text x="${bar.x0 - 10}" y="${bar.y + 12}" text-anchor="end" class="mohr-axis-label" fill="#c3c8d0" font-style="italic">F<tspan font-size="0.65em" dy="0.3em" font-style="normal">a</tspan></text>
      </g>
      ${Fa === null ? '' : `<g data-ref="fa-point"><path d="M ${faX} ${bar.y - 4} l 8 -12 h -16 Z" fill="#f4f5f7" stroke="#11141a" stroke-width="1.5" /><text x="${faX}" y="${bar.y - 20}" text-anchor="middle" class="mohr-small net-halo" fill="#f4f5f7">${Fa.toFixed(2)}</text></g>`}
      <text x="${grid.x0 + grid.w}" y="${grid.y0 - 26}" text-anchor="middle" class="chart-tick" fill="#c3c8d0">damage zones (both walls)</text>
      <text x="${grid.x0 + grid.w / 2}" y="${grid.y0 - 8}" text-anchor="middle" class="chart-tick" fill="#9aa1ad">under ${limits.damage} m</text>
      <text x="${grid.x0 + 1.5 * grid.w}" y="${grid.y0 - 8}" text-anchor="middle" class="chart-tick" fill="#9aa1ad">${limits.damage} m or more</text>
      <text x="${grid.x0 - 10}" y="${grid.y0 + grid.h / 2 - 6}" text-anchor="end" class="chart-tick" fill="#9aa1ad">core ${limits.core * 100} cm</text>
      <text x="${grid.x0 - 10}" y="${grid.y0 + grid.h / 2 + 10}" text-anchor="end" class="chart-tick" fill="#9aa1ad">or more</text>
      <text x="${grid.x0 - 10}" y="${grid.y0 + 1.5 * grid.h + 2}" text-anchor="end" class="chart-tick" fill="#9aa1ad">core under ${limits.core * 100} cm</text>
      ${cells}
      <text class="mohr-caption" x="16" y="${HEIGHT - 24}" fill="#9aa1ad">"Well developed" widths are a stated choice for this outcrop.</text>`;
    this.draw(markup, `Architecture index Fa = ${Fa === null ? 'undefined' : Fa.toFixed(2)}; end-member: ${structure.name}.`);
  }
}
