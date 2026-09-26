// Fault zones and fault rocks (lesson B11). Lengths of fault zones in metres,
// grain and clast sizes in millimetres, stress in MPa, temperature in °C,
// depth in km. The outcrop fault is a normal fault striking north and dipping
// δ east (NED frame, x = North, y = East, z = Down).
//
// Exact, given their definitions:
// - Clast sizes follow a power law, N(>d) ∝ d^(−Df) between dMin and dMax. The
//   volume fraction finer than d is
//   f(d) = (d^(3−Df) − dMin^(3−Df)) / (dMax^(3−Df) − dMin^(3−Df)), and ln(d/dMin)/ln(dMax/dMin) at Df = 3.
//   A plane slice through the clasts has N(>d) ∝ d^(−(Df−1)), and its area
//   fractions equal the volume fractions.
// - Sibson's (1977) classification boundaries (matrix = grains finer than
//   0.1 mm), and Woodcock & Mort's (2008) breccia boundaries (clasts of 2 mm or more).
// - The adiabatic heating bound ΔT = τD / (ρ c w), and Caine et al.'s (1996)
//   architecture index Fa = damage width / (core width + damage width).
//
// Stated, illustrative models (labeled so on screen):
// - The comminution schedule (slip → dMax, Df) in comminutionState.
// - Damage density ρ(x) = ρ0 (1 + x/x0)^(−n) down to the background density,
//   with n = 0.8 (the decay Savage & Brodsky 2011 report for small faults).
// - Temperatures of the fault-rock zones with depth, and "well developed"
//   core and damage-zone widths for Caine et al.'s end-members.

const RAD = Math.PI / 180;

/** Matrix: grains finer than 0.1 mm, too small to see without a lens (Sibson 1977). */
export const MATRIX_SIZE = 0.1;
/** Woodcock & Mort (2008) count clasts of 2 mm or more. */
export const BRECCIA_CLAST_SIZE = 2;

/** A deterministic random sequence in [0, 1) (mulberry32), so generated rocks are the same every time. */
export function seededRandom(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Clast sizes and comminution ---------- */

/** A power-law clast-size distribution between dMin and dMax (mm) with fractal dimension Df. */
export function clastSizeDistribution({ dMin, dMax, Df }) {
  if (!(dMin >= 0) || !(dMax > dMin)) throw new RangeError('Need 0 ≤ dMin < dMax.');
  if (!(Df > 0)) throw new RangeError('Df must be positive.');
  if (Df >= 3 && dMin === 0) throw new RangeError('With Df ≥ 3 the finest grains hold infinite volume: dMin must be above 0.');
  return { dMin, dMax, Df };
}

/** Volume fraction of the rock made of grains finer than d (0–1). */
export function fractionFiner({ dMin, dMax, Df }, d) {
  if (d <= dMin) return 0;
  if (d >= dMax) return 1;
  const e = 3 - Df;
  if (Math.abs(e) < 1e-9) return Math.log(d / dMin) / Math.log(dMax / dMin);
  return (d ** e - dMin ** e) / (dMax ** e - dMin ** e);
}

/** The size d at which the volume fraction finer is f: the inverse of fractionFiner. */
export function sizeAtFraction({ dMin, dMax, Df }, f) {
  const clamped = Math.min(Math.max(f, 0), 1);
  const e = 3 - Df;
  if (Math.abs(e) < 1e-9) return dMin * (dMax / dMin) ** clamped;
  return (dMin ** e + clamped * (dMax ** e - dMin ** e)) ** (1 / e);
}

/**
 * What a rock with this clast-size distribution is made of: the matrix
 * percentage (finer than 0.1 mm), the percentage of clasts of 2 mm or more,
 * and the typical fragment size (the median, by volume, of the grains
 * coarser than the matrix; Sibson names crush breccias by it).
 */
export function rockComposition(dist) {
  const matrix = fractionFiner(dist, MATRIX_SIZE);
  return {
    matrixPct: 100 * matrix,
    clastPct2mm: 100 * (1 - fractionFiner(dist, BRECCIA_CLAST_SIZE)),
    fragmentSize: matrix >= 1 ? 0 : sizeAtFraction(dist, matrix + 0.5 * (1 - matrix)),
  };
}

/**
 * The rule-based comminution schedule (illustrative, stated on screen): as
 * the slip grows from 1 cm to 100 m (a log scale, t from 0 to 1), the
 * largest clast shrinks from 30 mm by 2.4 orders of magnitude, and Df rises
 * from 1.6 toward 2.58, the value predicted for constrained comminution
 * (Sammis, King & Biegel 1987). Real grinding depends on rock, stress, and fluids.
 */
export const COMMINUTION = Object.freeze({ slipMin: 0.01, slipMax: 100, dMin: 0.001, dMaxStart: 30, decades: 2.4, dfStart: 1.6, dfLimit: 2.58, rate: 4 });

export function comminutionState(slip) {
  const c = COMMINUTION;
  const t = Math.min(Math.max(Math.log10(slip / c.slipMin) / Math.log10(c.slipMax / c.slipMin), 0), 1);
  const dist = clastSizeDistribution({
    dMin: c.dMin,
    dMax: c.dMaxStart * 10 ** (-c.decades * t),
    Df: c.dfLimit - (c.dfLimit - c.dfStart) * Math.exp(-c.rate * t),
  });
  return { slip, t, dist, ...rockComposition(dist) };
}

/**
 * Clast sizes for a plane slice of `area` (mm²) through a rock with this
 * distribution: drawn from N(>d) ∝ d^(−(Df−1)) between dLow and dMax, until
 * they cover the area fraction of grains coarser than dLow, 1 − f(dLow).
 * Returned largest first, with the covered fraction.
 */
export function sampleClasts(dist, area, { seed = 1, dLow = MATRIX_SIZE, maxCount = 4000 } = {}) {
  const { dMax, Df } = dist;
  const target = 1 - fractionFiner(dist, dLow);
  const sizes = [];
  if (dLow >= dMax || target <= 0) return { sizes, target: Math.max(target, 0), covered: 0, exponent: Df - 1 };
  const k = Df - 1;
  if (!(k > 0)) throw new RangeError('The slice exponent Df − 1 must be positive.');
  const random = seededRandom(seed);
  const low = dLow ** -k;
  const high = dMax ** -k;
  let covered = 0;
  while (covered < target * area && sizes.length < maxCount) {
    const d = (high + random() * (low - high)) ** (-1 / k);
    sizes.push(d);
    covered += (Math.PI / 4) * d * d;
  }
  sizes.sort((a, b) => b - a);
  return { sizes, target, covered: covered / area, exponent: k };
}

/** An angular fragment outline around the origin with area π d²/4 (equal-area diameter d). */
export function clastPolygon(random, d, { elongation = 1, corners } = {}) {
  const count = corners ?? 5 + Math.floor(random() * 4);
  const start = random() * Math.PI * 2;
  const vertices = [];
  for (let index = 0; index < count; index += 1) {
    const angle = start + ((index + (random() - 0.5) * 0.6) / count) * Math.PI * 2;
    const radius = 0.72 + random() * 0.5;
    vertices.push({ x: Math.cos(angle) * radius * elongation, y: (Math.sin(angle) * radius) / elongation });
  }
  let doubled = 0;
  for (let index = 0; index < count; index += 1) {
    const a = vertices[index];
    const b = vertices[(index + 1) % count];
    doubled += a.x * b.y - b.x * a.y;
  }
  const scale = Math.sqrt((Math.PI * d * d) / 4 / (Math.abs(doubled) / 2));
  return vertices.map((vertex) => ({ x: vertex.x * scale, y: vertex.y * scale }));
}

function insidePolygon(vertices, x, y) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i, i += 1) {
    const a = vertices[i];
    const b = vertices[j];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Cell classes of a slab texture. */
export const SLAB_CELL = Object.freeze({ matrix: 0, clast: 1, fine: 2 });

/**
 * A slice of fault rock, `width` × `height` mm on an nx × ny grid of cells:
 * clasts coarser than two cells are fragment outlines packed without overlap,
 * largest first; the fragments between the matrix size (0.1 mm) and that size
 * are single cells; the rest is matrix. The fragment area matches
 * 1 − fractionFiner(dist, 0.1 mm) to within the grid's resolution, and the
 * outlines follow the slice exponent Df − 1. Clasts that find no room (or
 * that the size cap leaves out) pass their area to the fine fragments.
 */
export function slabTexture(dist, { width, height, nx, ny, seed = 7, foliated = false }) {
  const cell = width / nx;
  const cells = new Uint8Array(nx * ny);
  const total = nx * ny;
  const random = seededRandom(seed);
  const dDraw = Math.max(MATRIX_SIZE, 2 * cell);
  const area = width * height;
  const first = sampleClasts(dist, area, { seed: seed + 1, dLow: dDraw, maxCount: 6000 });
  const { exponent, target } = first;
  // Free cells, kept in a swap-remove list so a random free cell costs O(1).
  const free = new Int32Array(total);
  const where = new Int32Array(total);
  for (let index = 0; index < total; index += 1) {
    free[index] = index;
    where[index] = index;
  }
  let freeCount = total;
  const take = (index) => {
    const at = where[index];
    const last = free[freeCount - 1];
    free[at] = last;
    where[last] = at;
    free[freeCount - 1] = index;
    where[index] = freeCount - 1;
    freeCount -= 1;
  };
  const polygons = [];
  let clastCells = 0;
  /** Place one clast at a random free cell; its part outside the slab is cut off, as in a real slice. */
  const place = (d) => {
    const vertices = clastPolygon(random, d / cell, { elongation: foliated ? 2.4 : 1 });
    const xs = vertices.map((vertex) => vertex.x);
    const ys = vertices.map((vertex) => vertex.y);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    for (let attempt = 0; attempt < 40 && freeCount > 0; attempt += 1) {
      const start = free[Math.floor(random() * freeCount)];
      const cx = (start % nx) + 0.5;
      const cy = Math.floor(start / nx) + 0.5;
      const covered = [];
      let fits = true;
      for (let j = Math.max(0, Math.floor(cy + y0)); fits && j <= Math.min(ny - 1, Math.floor(cy + y1)); j += 1) {
        for (let i = Math.max(0, Math.floor(cx + x0)); i <= Math.min(nx - 1, Math.floor(cx + x1)); i += 1) {
          if (!insidePolygon(vertices, i + 0.5 - cx, j + 0.5 - cy)) continue;
          if (cells[j * nx + i] !== SLAB_CELL.matrix) { fits = false; break; }
          covered.push(j * nx + i);
        }
      }
      if (!fits) continue;
      if (!covered.length) covered.push(start);
      for (const index of covered) {
        cells[index] = SLAB_CELL.clast;
        take(index);
      }
      polygons.push({ cx, cy, d, vertices, cells: covered.length });
      clastCells += covered.length;
      return true;
    }
    return false;
  };
  // Largest first, then top up the area lost to the edges, to crowding, or to the size cap
  // with more clasts from the same distribution. What is still missing becomes fine fragments.
  const targetCells = target * total;
  let sizes = first.sizes;
  for (let round = 0; round < 4 && sizes.length; round += 1) {
    for (const d of sizes) {
      if (clastCells >= targetCells) break;
      place(d);
    }
    const missing = (targetCells - clastCells) / total;
    if (missing <= 0.002) break;
    const extra = sampleClasts(dist, area * (missing / target), { seed: seed + 2 + round, dLow: dDraw, maxCount: 3000 });
    sizes = extra.sizes;
  }
  const lostCells = Math.max(targetCells - clastCells, 0);
  const fineFraction = Math.max(fractionFiner(dist, dDraw) - fractionFiner(dist, MATRIX_SIZE), 0);
  let fineCells = Math.min(Math.round(fineFraction * total + lostCells), freeCount);
  while (fineCells > 0) {
    const index = free[Math.floor(random() * freeCount)];
    cells[index] = SLAB_CELL.fine;
    take(index);
    fineCells -= 1;
  }
  const fragmentCells = total - freeCount;
  return {
    cells,
    nx,
    ny,
    cell,
    polygons,
    dDraw,
    exponent,
    targetFragmentPct: 100 * (1 - fractionFiner(dist, MATRIX_SIZE)),
    drawnFragmentPct: (100 * fragmentCells) / total,
    drawnMatrixPct: (100 * freeCount) / total,
  };
}

/* ---------- Classification ---------- */

/**
 * Sibson's (1977) name for a fault rock. matrixPct: grains finer than 0.1 mm;
 * fragmentSize (mm) names crush breccias; foliated and glass pick the row.
 * Loose (incohesive) rocks: breccia if visible fragments are 30% or more.
 * Returns { name, series, row, column } (name null where the scheme has none).
 */
export function sibsonClass({ cohesive, matrixPct, fragmentSize = 0, foliated = false, glass = false }) {
  if (glass) return { name: 'pseudotachylyte', series: 'glass', row: 'glass', column: null };
  if (!cohesive) {
    const breccia = matrixPct <= 70;
    return {
      name: `${foliated ? 'foliated ' : ''}fault ${breccia ? 'breccia' : 'gouge'}`,
      series: 'incohesive',
      row: 'incohesive',
      column: breccia ? 'breccia' : 'gouge',
    };
  }
  const column = matrixPct < 10 ? 'low' : matrixPct < 50 ? 'proto' : matrixPct < 90 ? 'main' : 'ultra';
  if (foliated) {
    const names = { low: null, proto: 'protomylonite', main: 'mylonite', ultra: 'ultramylonite' };
    return { name: names[column], series: 'mylonite', row: 'foliated', column };
  }
  if (column === 'low') {
    const size = fragmentSize > 5 ? 'coarse' : fragmentSize >= 1 ? 'fine' : 'micro';
    const names = { coarse: 'crush breccia', fine: 'fine crush breccia', micro: 'crush microbreccia' };
    return { name: names[size], series: 'crush breccia', row: 'cohesive', column, size };
  }
  const names = { proto: 'protocataclasite', main: 'cataclasite', ultra: 'ultracataclasite' };
  return { name: names[column], series: 'cataclasite', row: 'cohesive', column };
}

/** Woodcock & Mort's (2008) breccia name from the percentage of clasts of 2 mm or more; null below 30% (not a breccia). */
export function woodcockMortClass(clastPct) {
  if (clastPct >= 75) return 'crackle breccia';
  if (clastPct >= 60) return 'mosaic breccia';
  if (clastPct >= 30) return 'chaotic breccia';
  return null;
}

/* ---------- Frictional heating ---------- */

/** Temperatures for melting on a fault (°C, stated): rock starts to melt near 1000 °C; quartz survives to about 1700 °C. */
export const MELTING = Object.freeze({ onset: 1000, quartz: 1700 });

/**
 * Adiabatic upper bound on the heating of a slip zone: ΔT = τ D / (ρ c w),
 * with τ in MPa, slip D and width w in metres, ρ in kg/m³, and c in J/(kg K).
 * No heat escapes and none is used to melt.
 */
export function frictionalHeating({ tau, slip, width, density = 2700, heatCapacity = 1000 }) {
  return (tau * 1e6 * slip) / (density * heatCapacity * width);
}

/* ---------- Fault-zone architecture ---------- */

/** Caine, Evans & Forster's (1996) architecture index Fa = damage / (core + damage); null for a zone of no width. */
export function architectureIndex(core, damage) {
  const total = core + damage;
  return total > 0 ? damage / total : null;
}

/** Widths (m) above which the core and the damage zones count as well developed here (a stated choice for this outcrop). */
export const WELL_DEVELOPED = Object.freeze({ core: 0.1, damage: 1 });

const END_MEMBERS = {
  'localized-conduit': { name: 'localized conduit', flow: 'Fluid moves along the slip surface; there is little core or damage to change it.' },
  'distributed-conduit': { name: 'distributed conduit', flow: 'Fractures carry fluid along the whole damage zone; no core blocks it.' },
  'localized-barrier': { name: 'localized barrier', flow: 'A fine-grained core blocks flow across the fault; there are few fractures to carry it along.' },
  'combined-conduit-barrier': { name: 'combined conduit–barrier', flow: 'Fluid moves along the damage zones, but the core blocks it from crossing.' },
};

/** Caine et al.'s end-member for a fault zone, from whether its core and its damage zones are well developed. */
export function permeabilityStructure({ core, damage }, limits = WELL_DEVELOPED) {
  const coreDeveloped = core >= limits.core;
  const damageDeveloped = damage >= limits.damage;
  const id = coreDeveloped
    ? damageDeveloped ? 'combined-conduit-barrier' : 'localized-barrier'
    : damageDeveloped ? 'distributed-conduit' : 'localized-conduit';
  return { id, ...END_MEMBERS[id], coreDeveloped, damageDeveloped, Fa: architectureIndex(core, damage) };
}

/** Fracture-density law (stated): background ρbg per metre, x0 in metres, decay exponent n (Savage & Brodsky 2011). */
export const DAMAGE = Object.freeze({ background: 0.5, x0: 0.5, n: 0.8 });

/**
 * Fractures per metre of scanline at a distance x (m) from the core's edge,
 * measured at right angles to the fault, for a damage zone of this width:
 * ρ(x) = ρ0 (1 + x/x0)^(−n), no lower than the background. ρ0 is set so the
 * decay reaches the background exactly at x = width.
 */
export function damageDensity(x, { width, background = DAMAGE.background, x0 = DAMAGE.x0, n = DAMAGE.n }) {
  if (!(width > 0)) return background;
  const peak = background * (1 + width / x0) ** n;
  return Math.max(background, peak * (1 + Math.max(x, 0) / x0) ** -n);
}

/** Density at the core's edge, ρ0, for a damage zone of this width. */
export function damagePeak(width, { background = DAMAGE.background, x0 = DAMAGE.x0, n = DAMAGE.n } = {}) {
  return width > 0 ? background * (1 + width / x0) ** n : background;
}

/** Where the density falls to the background: x = x0 ((ρ0/ρbg)^(1/n) − 1). */
export function damageZoneEdge({ peak, background = DAMAGE.background, x0 = DAMAGE.x0, n = DAMAGE.n }) {
  if (peak <= background) return 0;
  return x0 * ((peak / background) ** (1 / n) - 1);
}

/**
 * Where a point lies in the outcrop's fault zone. zone = { core, footwall,
 * hangingWall, dip }: widths in metres at right angles to the fault, which
 * strikes north and dips `dip` east through (0, 0, 0). Returns the signed
 * distance d from the fault's center plane (positive into the hanging wall,
 * east), the part ('core', 'hanging', 'foot', or 'host'), and the distance x
 * from the core's edge.
 */
export function zonePosition(zone, east, down = 0) {
  const d = east * Math.sin(zone.dip * RAD) - down * Math.cos(zone.dip * RAD);
  const half = zone.core / 2;
  if (Math.abs(d) <= half) return { d, part: 'core', x: 0 };
  const x = Math.abs(d) - half;
  const hanging = d > 0;
  const width = hanging ? zone.hangingWall : zone.footwall;
  return { d, part: x <= width ? (hanging ? 'hanging' : 'foot') : 'host', x, side: hanging ? 'hanging' : 'foot' };
}

/** Fracture density (per metre, at right angles to the fault) at signed distance d; the core has no fractures. */
export function zoneDensity(zone, d) {
  const half = zone.core / 2;
  if (Math.abs(d) <= half) return 0;
  const width = d > 0 ? zone.hangingWall : zone.footwall;
  return damageDensity(Math.abs(d) - half, { width, ...zone.law });
}

/**
 * Fracture traces on the horizontal outcrop surface (depth 0), halfLength m
 * north and south and halfWidth m east and west of the fault trace. Traces
 * are `length` m long, trending north ± `scatter` degrees (both conjugate
 * sets strike parallel to the fault). They are placed so that a scanline
 * running east–west crosses, on average, ρ(d) sin δ traces per metre: that
 * is ρ(d) per metre of distance at right angles to the fault.
 */
export function pavementTraces(zone, { halfLength, halfWidth, length = 3, scatter = 15, seed = 3 }) {
  const random = seededRandom(seed);
  const sinDip = Math.sin(zone.dip * RAD);
  const meanCos = scatter > 0 ? Math.sin(scatter * RAD) / (scatter * RAD) : 1;
  const intensity = (east) => (zoneDensity(zone, east * sinDip) * sinDip) / (length * meanCos);
  const peak = Math.max(damagePeak(zone.footwall, zone.law), damagePeak(zone.hangingWall, zone.law), zone.law?.background ?? DAMAGE.background);
  const maxIntensity = (peak * sinDip) / (length * meanCos);
  const north = [-halfLength - length / 2, halfLength + length / 2];
  const east = [-halfWidth - length / 2, halfWidth + length / 2];
  const candidates = Math.round(maxIntensity * (north[1] - north[0]) * (east[1] - east[0]));
  const traces = [];
  for (let index = 0; index < candidates; index += 1) {
    const n = north[0] + random() * (north[1] - north[0]);
    const e = east[0] + random() * (east[1] - east[0]);
    const keep = random() * maxIntensity < intensity(e);
    const turn = (random() * 2 - 1) * scatter * RAD;
    if (!keep) continue;
    const dn = (Math.cos(turn) * length) / 2;
    const de = (Math.sin(turn) * length) / 2;
    traces.push({ n1: n - dn, e1: e - de, n2: n + dn, e2: e + de });
  }
  return traces;
}

/**
 * Fracture traces on a vertical east–west face (a cross-section at right
 * angles to strike), from east e0 to e1 and depth 0 to `depth`. Most are
 * parallel to the fault (dipping δ east), the rest are its conjugate set
 * (dipping δ west). Along a line at right angles to the fault the fault-
 * parallel set gives about ρ(d) crossings per metre (schematic for the other set).
 */
export function sectionTraces(zone, { east: [e0, e1], depth, length = 3, seed = 5, conjugate = 0.35 }) {
  const random = seededRandom(seed);
  const peak = Math.max(damagePeak(zone.footwall, zone.law), damagePeak(zone.hangingWall, zone.law), zone.law?.background ?? DAMAGE.background);
  const maxIntensity = peak / length;
  const area = (e1 - e0 + length) * (depth + length);
  const candidates = Math.round(maxIntensity * area);
  const traces = [];
  for (let index = 0; index < candidates; index += 1) {
    const e = e0 - length / 2 + random() * (e1 - e0 + length);
    const z = -length / 2 + random() * (depth + length);
    const keep = random() * maxIntensity < zoneDensity(zone, zonePosition(zone, e, z).d) / length;
    const flip = random() < conjugate;
    const dip = (zone.dip + (random() - 0.5) * 16) * RAD;
    if (!keep) continue;
    // Direction down the dip, in (east, down): east-dipping (cos δ, sin δ), or west-dipping (−cos δ, sin δ).
    const de = ((flip ? -1 : 1) * Math.cos(dip) * length) / 2;
    const dz = (Math.sin(dip) * length) / 2;
    traces.push({ e1: e - de, z1: z - dz, e2: e + de, z2: z + dz });
  }
  return traces;
}

/**
 * Fracture traces on a vertical north–south face at `east` (parallel to
 * strike), from north n0 to n1 and depth 0 to `depth`. Planes that strike
 * north cut this face in nearly horizontal lines. Schematic, with the same density law.
 */
export function strikeFaceTraces(zone, { east, north: [n0, n1], depth, length = 3, scatter = 12, seed = 9 }) {
  const random = seededRandom(seed);
  const peak = Math.max(damagePeak(zone.footwall, zone.law), damagePeak(zone.hangingWall, zone.law), zone.law?.background ?? DAMAGE.background);
  const maxIntensity = peak / length;
  const candidates = Math.round(maxIntensity * (n1 - n0 + length) * (depth + length));
  const traces = [];
  for (let index = 0; index < candidates; index += 1) {
    const n = n0 - length / 2 + random() * (n1 - n0 + length);
    const z = -length / 2 + random() * (depth + length);
    const keep = random() * maxIntensity < zoneDensity(zone, zonePosition(zone, east, z).d) / length;
    const turn = (random() * 2 - 1) * scatter * RAD;
    if (!keep) continue;
    const dn = (Math.cos(turn) * length) / 2;
    const dz = (Math.sin(turn) * length) / 2;
    traces.push({ n1: n - dn, z1: z - dz, n2: n + dn, z2: z + dz });
  }
  return traces;
}

/** East coordinates where an east–west scanline at `north` crosses the traces. */
export function scanlineCrossings(traces, north) {
  const crossings = [];
  for (const trace of traces) {
    if (trace.n1 === trace.n2) continue;
    const t = (north - trace.n1) / (trace.n2 - trace.n1);
    if (t < 0 || t > 1) continue;
    crossings.push(trace.e1 + t * (trace.e2 - trace.e1));
  }
  return crossings.sort((a, b) => a - b);
}

/**
 * Scanline density: the crossings, binned by distance d at right angles to
 * the fault (d = east · sin δ), in fractures per metre of d. Bins that fall
 * in the core count nothing.
 */
export function scanlineDensity(zone, crossings, { from, to, bin = 1 }) {
  const sinDip = Math.sin(zone.dip * RAD);
  const count = Math.round((to - from) / bin);
  const bins = Array.from({ length: count }, (_, index) => ({ from: from + index * bin, to: from + (index + 1) * bin, count: 0 }));
  for (const east of crossings) {
    const d = east * sinDip;
    if (Math.abs(d) <= zone.core / 2) continue;
    const index = Math.floor((d - from) / bin);
    if (index >= 0 && index < count) bins[index].count += 1;
  }
  return bins.map((item) => ({ ...item, density: item.count / bin }));
}

/* ---------- Widths and depth ---------- */

/** Published scatter of fault-zone widths with displacement D (m), after Fossen (2016): core D/1000 to D/10 (typical D/100); one-sided damage zone about D, within an order of magnitude either way. */
export function widthScaling(D) {
  return {
    core: { low: D / 1000, typical: D / 100, high: D / 10 },
    damage: { low: D / 10, typical: D, high: 10 * D },
  };
}

/**
 * Temperatures (°C) that bound the fault-rock zones in quartz-rich crust
 * (stated): cohesive rock from about 100 °C, where quartz cement and healing
 * speed up; crystal plasticity in calcite from about 250 °C, quartz 300 °C,
 * and feldspar 450 °C (PSGT). Earthquakes nucleate mostly between about 100
 * and 300 °C.
 */
export const ZONE_TEMPERATURES = Object.freeze({ cohesive: 100, calcite: 250, quartz: 300, feldspar: 450 });

/** Depth (km) of a temperature for a linear geotherm T = T0 + G z. */
export function depthOfTemperature(temperature, gradient, surface = 10) {
  return Math.max(temperature - surface, 0) / gradient;
}

/** The fault-rock zones of quartz-rich crust for a geothermal gradient G (°C/km): tops and bottoms in km. */
export function faultRockZones(gradient, { surface = 10 } = {}) {
  const z = (temperature) => depthOfTemperature(temperature, gradient, surface);
  const T = ZONE_TEMPERATURES;
  return [
    { id: 'zone-incohesive', name: 'gouge and breccia (loose)', top: 0, bottom: z(T.cohesive) },
    { id: 'zone-cataclasite', name: 'cataclasites; pseudotachylyte in earthquakes', top: z(T.cohesive), bottom: z(T.quartz) },
    { id: 'zone-quartz', name: 'mylonites; feldspar still breaks', top: z(T.quartz), bottom: z(T.feldspar) },
    { id: 'zone-mylonite', name: 'mylonites; feldspar flows too', top: z(T.feldspar), bottom: Infinity },
  ];
}
