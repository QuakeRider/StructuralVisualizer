import { describe, expect, it } from 'vitest';
import {
  COMMINUTION,
  DAMAGE,
  MATRIX_SIZE,
  SLAB_CELL,
  architectureIndex,
  clastPolygon,
  clastSizeDistribution,
  comminutionState,
  damageDensity,
  damagePeak,
  damageZoneEdge,
  depthOfTemperature,
  faultRockZones,
  fractionFiner,
  frictionalHeating,
  pavementTraces,
  sectionTraces,
  permeabilityStructure,
  rockComposition,
  sampleClasts,
  scanlineCrossings,
  scanlineDensity,
  seededRandom,
  sibsonClass,
  sizeAtFraction,
  slabTexture,
  widthScaling,
  woodcockMortClass,
  zoneDensity,
  zonePosition,
} from './faultRocks.js';

describe('clast-size distribution', () => {
  it('rejects impossible distributions', () => {
    expect(() => clastSizeDistribution({ dMin: 1, dMax: 1, Df: 2.6 })).toThrow();
    expect(() => clastSizeDistribution({ dMin: 0, dMax: 1, Df: 3 })).toThrow();
  });

  it('is linear in d when Df = 2', () => {
    const dist = clastSizeDistribution({ dMin: 0, dMax: 10, Df: 2 });
    expect(fractionFiner(dist, 2.5)).toBeCloseTo(0.25, 12);
    expect(fractionFiner(dist, 5)).toBeCloseTo(0.5, 12);
  });

  it('goes from 0 at dMin to 1 at dMax, and uses the logarithm at Df = 3', () => {
    const dist = { dMin: 0.001, dMax: 10, Df: 2.58 };
    expect(fractionFiner(dist, 0.001)).toBe(0);
    expect(fractionFiner(dist, 10)).toBe(1);
    expect(fractionFiner(dist, 20)).toBe(1);
    expect(fractionFiner({ dMin: 1, dMax: 100, Df: 3 }, 10)).toBeCloseTo(0.5, 12);
  });

  it('matches a hand value at Df = 2.58', () => {
    // (0.1^0.42 − 0.001^0.42) / (20^0.42 − 0.001^0.42) ≈ 0.0938
    const dist = { dMin: 0.001, dMax: 20, Df: 2.58 };
    const e = 0.42;
    expect(fractionFiner(dist, 0.1)).toBeCloseTo((0.1 ** e - 0.001 ** e) / (20 ** e - 0.001 ** e), 12);
    expect(fractionFiner(dist, 0.1)).toBeCloseTo(0.0938, 3);
  });

  it('inverts fractionFiner', () => {
    for (const Df of [1.6, 2.58, 3, 3.2]) {
      const dist = { dMin: 0.001, dMax: 30, Df };
      for (const d of [0.01, 0.1, 1, 12]) expect(sizeAtFraction(dist, fractionFiner(dist, d))).toBeCloseTo(d, 8);
    }
  });

  it('describes the rock: matrix, clasts of 2 mm or more, and the median fragment', () => {
    const dist = { dMin: 0, dMax: 10, Df: 2 };
    const rock = rockComposition(dist);
    expect(rock.matrixPct).toBeCloseTo(1, 10);
    expect(rock.clastPct2mm).toBeCloseTo(80, 10);
    // Median of the grains coarser than 0.1 mm, by volume: halfway from 0.1 to 10.
    expect(rock.fragmentSize).toBeCloseTo(5.05, 10);
  });
});

describe('comminution schedule', () => {
  it('shrinks the largest clast and raises Df toward 2.58 as slip grows', () => {
    const start = comminutionState(COMMINUTION.slipMin);
    const end = comminutionState(COMMINUTION.slipMax);
    expect(start.dist.dMax).toBeCloseTo(30, 10);
    expect(start.dist.Df).toBeCloseTo(1.6, 10);
    expect(end.dist.dMax).toBeCloseTo(30 * 10 ** -2.4, 10);
    expect(end.dist.Df).toBeGreaterThan(2.55);
    expect(end.dist.Df).toBeLessThan(2.58);
    let previous = -1;
    for (let slip = 0.01; slip <= 100; slip *= 2) {
      const state = comminutionState(slip);
      expect(state.matrixPct).toBeGreaterThan(previous);
      previous = state.matrixPct;
    }
  });

  it('passes through every cohesive, random-fabric class', () => {
    const names = new Set();
    for (let index = 0; index <= 200; index += 1) {
      const state = comminutionState(0.01 * 10 ** (index / 50));
      names.add(sibsonClass({ cohesive: true, ...state }).name);
    }
    for (const name of ['crush breccia', 'fine crush breccia', 'protocataclasite', 'cataclasite', 'ultracataclasite']) expect(names).toContain(name);
  });
});

describe('texture sampling', () => {
  it('draws slice sizes from the exponent Df − 1 and covers 1 − f(dLow)', () => {
    const dist = { dMin: 0.001, dMax: 20, Df: 2.58 };
    const { sizes, target, covered, exponent } = sampleClasts(dist, 1e4, { seed: 4, dLow: 0.5, maxCount: 20000 });
    expect(exponent).toBeCloseTo(1.58, 12);
    expect(target).toBeCloseTo(1 - fractionFiner(dist, 0.5), 12);
    expect(covered).toBeGreaterThanOrEqual(target);
    expect(covered - target).toBeLessThan(0.01);
    // Log–log slope of the cumulative count between 0.5 and 2 mm.
    const countAbove = (d) => sizes.filter((size) => size > d).length;
    const slope = Math.log(countAbove(2) / countAbove(0.5)) / Math.log(2 / 0.5);
    expect(slope).toBeCloseTo(-1.58, 1);
  });

  it('gives equal-area fragment outlines', () => {
    const vertices = clastPolygon(seededRandom(2), 4);
    let doubled = 0;
    vertices.forEach((a, index) => {
      const b = vertices[(index + 1) % vertices.length];
      doubled += a.x * b.y - b.x * a.y;
    });
    expect(Math.abs(doubled) / 2).toBeCloseTo(Math.PI * 4, 8);
  });

  it('draws a slab whose fragment area matches the model', () => {
    for (const slip of [0.05, 1, 10, 60]) {
      const { dist, matrixPct } = comminutionState(slip);
      const field = Math.max(6, Math.min(100, 3 * dist.dMax));
      const slab = slabTexture(dist, { width: field, height: field * 0.6, nx: 240, ny: 144, seed: 5 });
      expect(slab.targetFragmentPct).toBeCloseTo(100 - matrixPct, 10);
      expect(Math.abs(slab.drawnMatrixPct - matrixPct), `slip ${slip}`).toBeLessThan(2);
      expect(slab.cells.filter((value) => value === SLAB_CELL.clast).length).toBeGreaterThan(0);
    }
  });

  it('draws only matrix when every grain is finer than 0.1 mm', () => {
    const slab = slabTexture({ dMin: 0.001, dMax: 0.08, Df: 2.58 }, { width: 6, height: 3.6, nx: 60, ny: 36 });
    expect(slab.drawnMatrixPct).toBe(100);
    expect(slab.polygons).toHaveLength(0);
  });
});

describe('Sibson and Woodcock & Mort names', () => {
  it('splits loose rocks at 30% visible fragments', () => {
    expect(sibsonClass({ cohesive: false, matrixPct: 70 }).name).toBe('fault breccia');
    expect(sibsonClass({ cohesive: false, matrixPct: 71 }).name).toBe('fault gouge');
    expect(sibsonClass({ cohesive: false, matrixPct: 90, foliated: true }).name).toBe('foliated fault gouge');
  });

  it('names the cataclasite series at 10, 50, and 90% matrix', () => {
    const name = (matrixPct) => sibsonClass({ cohesive: true, matrixPct, fragmentSize: 8 }).name;
    expect(name(9.9)).toBe('crush breccia');
    expect(name(10)).toBe('protocataclasite');
    expect(name(49.9)).toBe('protocataclasite');
    expect(name(50)).toBe('cataclasite');
    expect(name(89.9)).toBe('cataclasite');
    expect(name(90)).toBe('ultracataclasite');
  });

  it('names crush breccias by fragment size', () => {
    const name = (fragmentSize) => sibsonClass({ cohesive: true, matrixPct: 5, fragmentSize }).name;
    expect(name(6)).toBe('crush breccia');
    expect(name(5)).toBe('fine crush breccia');
    expect(name(1)).toBe('fine crush breccia');
    expect(name(0.9)).toBe('crush microbreccia');
  });

  it('names the foliated series and glass', () => {
    const name = (matrixPct) => sibsonClass({ cohesive: true, matrixPct, foliated: true }).name;
    expect(name(5)).toBeNull();
    expect(name(30)).toBe('protomylonite');
    expect(name(70)).toBe('mylonite');
    expect(name(95)).toBe('ultramylonite');
    expect(sibsonClass({ cohesive: true, matrixPct: 50, glass: true }).name).toBe('pseudotachylyte');
  });

  it('names breccias at 30, 60, and 75% clasts of 2 mm or more', () => {
    expect(woodcockMortClass(29.9)).toBeNull();
    expect(woodcockMortClass(30)).toBe('chaotic breccia');
    expect(woodcockMortClass(59.9)).toBe('chaotic breccia');
    expect(woodcockMortClass(60)).toBe('mosaic breccia');
    expect(woodcockMortClass(74.9)).toBe('mosaic breccia');
    expect(woodcockMortClass(75)).toBe('crackle breccia');
  });
});

describe('frictional heating', () => {
  it('reproduces the lesson example: 50 MPa, 1 m, 1 cm gives about 1850 K', () => {
    expect(frictionalHeating({ tau: 50, slip: 1, width: 0.01 })).toBeCloseTo(1851.85, 1);
    expect(frictionalHeating({ tau: 50, slip: 1, width: 0.001 })).toBeCloseTo(18518.5, 0);
  });
});

describe('fault-zone architecture', () => {
  it('has an architecture index of 0 with no damage zone and 1 with no core', () => {
    expect(architectureIndex(2, 0)).toBe(0);
    expect(architectureIndex(0, 5)).toBe(1);
    expect(architectureIndex(1, 3)).toBeCloseTo(0.75, 12);
    expect(architectureIndex(0, 0)).toBeNull();
  });

  it('picks the four end-members from the development of core and damage zone', () => {
    expect(permeabilityStructure({ core: 0.01, damage: 0.2 }).id).toBe('localized-conduit');
    expect(permeabilityStructure({ core: 0.01, damage: 10 }).id).toBe('distributed-conduit');
    expect(permeabilityStructure({ core: 2, damage: 0.2 }).id).toBe('localized-barrier');
    expect(permeabilityStructure({ core: 2, damage: 10 }).id).toBe('combined-conduit-barrier');
    expect(permeabilityStructure({ core: 2, damage: 10 }).Fa).toBeCloseTo(10 / 12, 12);
  });

  it('decays the fracture density to the background exactly at the damage-zone edge', () => {
    const width = 6;
    const peak = damagePeak(width);
    expect(damageDensity(0, { width })).toBeCloseTo(peak, 12);
    expect(damageDensity(width, { width })).toBeCloseTo(DAMAGE.background, 12);
    expect(damageDensity(width + 5, { width })).toBe(DAMAGE.background);
    expect(damageZoneEdge({ peak })).toBeCloseTo(width, 10);
    // Lesson step 3: ρ0 = 3 per m over 0.5 per m gives x = 0.5 (6^1.25 − 1) ≈ 4.20 m.
    expect(damageZoneEdge({ peak: 3 })).toBeCloseTo(4.195, 3);
    expect(damageZoneEdge({ peak: 0.4 })).toBe(0);
  });

  it('locates points in the zone across a fault dipping 60° east', () => {
    const zone = { core: 1, footwall: 4, hangingWall: 8, dip: 60 };
    expect(zonePosition(zone, 0).part).toBe('core');
    expect(zonePosition(zone, 4).part).toBe('hanging');
    expect(zonePosition(zone, -4).part).toBe('foot');
    expect(zonePosition(zone, -6).part).toBe('host');
    // Down the dip, the fault moves east: at depth 10 m it is 10 cot 60° east.
    expect(zonePosition(zone, 10 / Math.tan(Math.PI / 3), 10).d).toBeCloseTo(0, 10);
    expect(zoneDensity(zone, 0.3)).toBe(0);
  });

  it('generates pavement traces whose scanline counts match the density law', () => {
    const zone = { core: 1, footwall: 5, hangingWall: 9, dip: 60 };
    const bins = new Map();
    const runs = 150;
    for (let seed = 1; seed <= runs; seed += 1) {
      const traces = pavementTraces(zone, { halfLength: 20, halfWidth: 20, seed });
      for (const north of [-10, 0, 10]) {
        for (const item of scanlineDensity(zone, scanlineCrossings(traces, north), { from: -14, to: 14, bin: 2 })) {
          bins.set(item.from, (bins.get(item.from) ?? 0) + item.density / (3 * runs));
        }
      }
    }
    for (const [from, measured] of bins) {
      // The model's average over the bin (skipping bins that straddle the core). Traces
      // are counted where they cross, but placed by their midpoints, which blurs the edges a little.
      if (Math.abs(from + 1) < 1.5) continue;
      let expected = 0;
      for (let k = 0; k < 20; k += 1) expected += zoneDensity(zone, from + (k + 0.5) * 0.1) / 20;
      expect(Math.abs(measured - expected) / expected, `bin at ${from} m`).toBeLessThan(0.1);
    }
  });

  it('puts more section traces next to the core than in the host rock', () => {
    const zone = { core: 1, footwall: 5, hangingWall: 9, dip: 60 };
    const traces = sectionTraces(zone, { east: [-20, 20], depth: 20, seed: 2 });
    const middle = (trace) => zonePosition(zone, (trace.e1 + trace.e2) / 2, (trace.z1 + trace.z2) / 2);
    const near = traces.filter((trace) => { const p = middle(trace); return p.part !== 'core' && p.x < 2; }).length;
    const far = traces.filter((trace) => { const p = middle(trace); return p.part === 'host' && p.x < 13; }).length;
    // The near band (2 m each side) is narrower than the far one, yet holds more traces.
    expect(near).toBeGreaterThan(far);
    expect(traces.every((trace) => Math.abs(Math.hypot(trace.e2 - trace.e1, trace.z2 - trace.z1) - 3) < 1e-9)).toBe(true);
  });
});

describe('widths and depth', () => {

  it('scales the core with D/100 and the damage zone with D', () => {
    const widths = widthScaling(50);
    expect(widths.core.typical).toBeCloseTo(0.5, 12);
    expect(widths.core.low).toBeCloseTo(0.05, 12);
    expect(widths.core.high).toBeCloseTo(5, 12);
    expect(widths.damage.typical).toBe(50);
  });

  it('moves the fault-rock zones with the geothermal gradient', () => {
    expect(depthOfTemperature(300, 25, 10)).toBeCloseTo(11.6, 12);
    const cool = faultRockZones(20);
    const hot = faultRockZones(40);
    expect(cool[1].bottom).toBeCloseTo(14.5, 12);
    expect(hot[1].bottom).toBeCloseTo(7.25, 12);
    expect(cool.map((zone) => zone.id)).toEqual(['zone-incohesive', 'zone-cataclasite', 'zone-quartz', 'zone-mylonite']);
    for (let index = 1; index < cool.length; index += 1) expect(cool[index].top).toBe(cool[index - 1].bottom);
  });

  it('keeps the matrix size at 0.1 mm', () => {
    expect(MATRIX_SIZE).toBe(0.1);
  });
});
