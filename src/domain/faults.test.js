import { describe, expect, it } from 'vitest';
import { andersonAxes, faultSlip, principalStressTensor } from './anderson.js';
import {
  auxiliaryPlane,
  classifySlip,
  firstMotion,
  kinematicAxes,
  lineRakeFromSlipRake,
  planeThrough,
  rakeFromSlip,
  resolvedShearDirection,
  slipComponents,
  slipFromRake,
  tiltAxes,
  traceSeparation,
  wellLog,
} from './faults.js';
import { lineToRake, lineVector, planeFromStrike, planePole, rakeVector } from './orientation.js';
import { lineFromVector } from './stereonet.js';
import { dot } from './vector.js';

const EAST_60 = planeFromStrike(0, 60);
const EAST_30 = planeFromStrike(0, 30);
const VERTICAL_N = planeFromStrike(0, 90);
const closeVector = (a, b, digits = 9) => {
  expect(a.x).toBeCloseTo(b.x, digits);
  expect(a.y).toBeCloseTo(b.y, digits);
  expect(a.z).toBeCloseTo(b.z, digits);
};
const axisMod180 = (line) => ((line.trend % 180) + 180) % 180;

describe('rake of a line in a plane (O4 convention)', () => {
  it('measures from the strike direction toward the dip direction', () => {
    closeVector(rakeVector(EAST_60, 0), { x: 1, y: 0, z: 0 });
    closeVector(rakeVector(EAST_60, 90), lineVector(90, 60));
    closeVector(rakeVector(EAST_60, 180), { x: -1, y: 0, z: 0 });
  });

  it('gives sin(plunge) = sin(rake) sin(dip) and round-trips', () => {
    const line = lineFromVector(rakeVector(EAST_60, 40));
    expect(line.plunge).toBeCloseTo(Math.asin(Math.sin((40 * Math.PI) / 180) * Math.sin(Math.PI / 3)) * (180 / Math.PI), 9);
    expect(line.plunge).toBeCloseTo(33.83, 2);
    for (const rake of [0, 15, 90, 137, 180]) expect(lineToRake(EAST_60, rakeVector(EAST_60, rake))).toBeCloseTo(rake === 180 ? 0 : rake, 9);
    // The sense of the vector does not matter for a line.
    const v = rakeVector(EAST_60, 40);
    expect(lineToRake(EAST_60, { x: -v.x, y: -v.y, z: -v.z })).toBeCloseTo(40, 9);
  });
});

describe('slip vector and rake', () => {
  it('uses λ = 90° for reverse, −90° for normal, 0° for sinistral, 180° for dextral', () => {
    closeVector(slipFromRake(EAST_60, -90), lineVector(90, 60));
    const up = slipFromRake(EAST_60, 90);
    expect(up.z).toBeLessThan(0);
    closeVector(slipFromRake(EAST_60, 0), { x: 1, y: 0, z: 0 });
    closeVector(slipFromRake(EAST_60, 180), { x: -1, y: 0, z: 0 });
    expect(classifySlip(EAST_60, -90).name).toBe('normal');
    expect(classifySlip(EAST_60, 90).name).toBe('reverse');
    expect(classifySlip(EAST_30, 90).name).toBe('thrust');
    expect(classifySlip(EAST_60, 0).name).toBe('sinistral');
    expect(classifySlip(EAST_60, 180).name).toBe('dextral');
  });

  it('agrees with the B7 slip sense for a vertical fault (east block moving south is dextral)', () => {
    closeVector(slipFromRake(VERTICAL_N, 180), { x: -1, y: 0, z: 0 });
    expect(classifySlip(VERTICAL_N, 180).strikeSense).toBe('dextral');
    expect(classifySlip(VERTICAL_N, 90).dipSense).toBe('hanging-up');
  });

  it('names oblique slip in every quadrant', () => {
    expect(classifySlip(EAST_60, -135).name).toBe('oblique normal–dextral');
    expect(classifySlip(EAST_60, -45).name).toBe('oblique normal–sinistral');
    expect(classifySlip(EAST_60, 45).name).toBe('oblique reverse–sinistral');
    expect(classifySlip(EAST_60, 135).name).toBe('oblique reverse–dextral');
    // Within 20° of pure dip-slip or strike-slip, the slip takes the pure name.
    expect(classifySlip(EAST_60, -75).kind).toBe('dip-slip');
    expect(classifySlip(EAST_60, 165).kind).toBe('strike-slip');
  });

  it('round-trips rake and splits slip into strike-slip and dip-slip parts', () => {
    for (const rake of [-170, -90, -30, 0, 45, 90, 180]) expect(rakeFromSlip(EAST_60, slipFromRake(EAST_60, rake))).toBeCloseTo(rake, 9);
    const parts = slipComponents(EAST_60, { ...slipFromRake(EAST_60, 30), x: slipFromRake(EAST_60, 30).x * 120, y: slipFromRake(EAST_60, 30).y * 120, z: slipFromRake(EAST_60, 30).z * 120 });
    expect(parts.strikeSlip).toBeCloseTo(103.92, 2);
    expect(parts.dipSlip).toBeCloseTo(60, 9);
  });

  it('converts slip rake to slickenline rake', () => {
    expect(lineRakeFromSlipRake(-90)).toBe(90);
    expect(lineRakeFromSlipRake(-30)).toBe(30);
    expect(lineRakeFromSlipRake(30)).toBe(150);
    expect(lineRakeFromSlipRake(180)).toBe(0);
  });
});

describe('Wallace–Bott: slip parallel to the resolved shear traction', () => {
  const tensorFor = (regime, ratio = 0.5, trend = 0) => principalStressTensor(andersonAxes(regime, trend), { sigma1: 130, sigma2: 30 + ratio * 100, sigma3: 30 });

  it('matches the B7 hanging-wall slip and lies in the plane', () => {
    const tensor = tensorFor('normal');
    for (const plane of [EAST_60, planeFromStrike(45, 60), planeFromStrike(300, 35)]) {
      const slip = resolvedShearDirection(tensor, plane);
      closeVector(slip, faultSlip(tensor, plane).slip);
      expect(dot(slip, planePole(plane))).toBeCloseTo(0, 12);
    }
  });

  it('gives pure normal slip for a plane containing σ2 in the normal regime, and pure thrust slip in the thrust regime', () => {
    expect(rakeFromSlip(EAST_60, resolvedShearDirection(tensorFor('normal'), EAST_60))).toBeCloseTo(-90, 9);
    expect(rakeFromSlip(planeFromStrike(90, 30), resolvedShearDirection(tensorFor('thrust'), planeFromStrike(90, 30)))).toBeCloseTo(90, 9);
  });

  it('predicts oblique slip on a plane oblique to the stress axes, depending on the stress ratio', () => {
    const plane = planeFromStrike(45, 60);
    const half = rakeFromSlip(plane, resolvedShearDirection(tensorFor('normal', 0.5), plane));
    // The plane dips SE; extension is east–west, so the hanging wall slides east of down-dip.
    expect(half).toBeCloseTo(-56.3, 1);
    expect(classifySlip(plane, half).name).toBe('oblique normal–sinistral');
    // With σ2 = σ3 the horizontal stresses are equal: slip goes straight down the dip.
    expect(rakeFromSlip(plane, resolvedShearDirection(tensorFor('normal', 0), plane))).toBeCloseTo(-90, 9);
    // With σ2 near σ1 the slip turns toward strike-slip.
    expect(rakeFromSlip(plane, resolvedShearDirection(tensorFor('normal', 0.9), plane))).toBeGreaterThan(-50);
  });

  it('returns null on a principal plane', () => {
    expect(resolvedShearDirection(tensorFor('normal'), planeFromStrike(0, 0))).toBeNull();
  });

  it('keeps pure normal slip while σ1 tilts about σ2, until σ1 reaches the fault plane', () => {
    const axes = andersonAxes('normal', 0);
    const rakeAt = (tilt) => {
      const tensor = principalStressTensor(tiltAxes(axes, tilt), { sigma1: 130, sigma2: 80, sigma3: 30 });
      return rakeFromSlip(EAST_60, resolvedShearDirection(tensor, EAST_60));
    };
    // Tilting about north (σ2): positive angles swing σ1 toward the west.
    const tilted = tiltAxes(axes, 20).sigma1;
    expect(tilted.trend).toBeCloseTo(270, 9);
    expect(tilted.plunge).toBeCloseTo(70, 9);
    for (const tilt of [-25, -10, 0, 20, 45]) expect(rakeAt(tilt)).toBeCloseTo(-90, 9);
    // σ1 past the fault plane (30° east of vertical): the slip flips to reverse.
    expect(rakeAt(-35)).toBeCloseTo(90, 9);
  });
});

describe('kinematic axes and the beach ball', () => {
  const axesFor = (plane, rake) => kinematicAxes(planePole(plane), slipFromRake(plane, rake));

  it('puts P near vertical and T horizontal for a normal fault', () => {
    const { P, T, B } = axesFor(EAST_60, -90);
    expect(P).toEqual({ trend: expect.closeTo(270, 9), plunge: expect.closeTo(75, 9) });
    expect(T).toEqual({ trend: expect.closeTo(90, 9), plunge: expect.closeTo(15, 9) });
    expect(B.plunge).toBeCloseTo(0, 9);
    expect(axisMod180(B)).toBeCloseTo(0, 9);
  });

  it('puts P horizontal and T near vertical for a thrust', () => {
    const { P, T } = axesFor(EAST_30, 90);
    expect(P).toEqual({ trend: expect.closeTo(270, 9), plunge: expect.closeTo(15, 9) });
    expect(T).toEqual({ trend: expect.closeTo(90, 9), plunge: expect.closeTo(75, 9) });
  });

  it('puts P and T horizontal at 45° to a vertical strike-slip fault, with B vertical', () => {
    const dextral = axesFor(VERTICAL_N, 180);
    expect(axisMod180(dextral.P)).toBeCloseTo(45, 9);
    expect(axisMod180(dextral.T)).toBeCloseTo(135, 9);
    expect(dextral.B.plunge).toBeCloseTo(90, 9);
    const sinistral = axesFor(VERTICAL_N, 0);
    expect(axisMod180(sinistral.P)).toBeCloseTo(135, 9);
  });

  it('makes P, T, and B mutually perpendicular and 45° from the fault', () => {
    const plane = planeFromStrike(120, 50);
    const { vectors } = axesFor(plane, -40);
    expect(dot(vectors.P, vectors.T)).toBeCloseTo(0, 12);
    expect(dot(vectors.P, vectors.B)).toBeCloseTo(0, 12);
    expect(Math.abs(dot(vectors.P, planePole(plane)))).toBeCloseTo(Math.SQRT1_2, 12);
  });

  it('uses the slip vector as the pole of the auxiliary plane', () => {
    const aux = auxiliaryPlane(slipFromRake(EAST_60, -90));
    expect(aux.dip).toBeCloseTo(30, 9);
    expect(aux.dipDirection).toBeCloseTo(270, 9);
  });

  it('shades the T quadrants (compressional first motions) and leaves P white', () => {
    const n = planePole(EAST_60);
    const slip = slipFromRake(EAST_60, -90);
    const { vectors } = kinematicAxes(n, slip);
    expect(firstMotion(vectors.T, n, slip)).toBe('compressional');
    expect(firstMotion(vectors.P, n, slip)).toBe('dilatational');
    // A normal fault: the center of the net (straight down) is white.
    expect(firstMotion({ x: 0, y: 0, z: 1 }, n, slip)).toBe('dilatational');
    // A thrust: the center is shaded.
    expect(firstMotion({ x: 0, y: 0, z: 1 }, planePole(EAST_30), slipFromRake(EAST_30, 90))).toBe('compressional');
  });
});

describe('slip vs separation', () => {
  const center = { x: 0, y: 0, z: 250 };
  const fault = planeThrough(planePole(EAST_60), center);
  const map = planeThrough({ x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 0 });

  it('computes separation (𝐦·𝐃)/(𝐦·𝐮) along the fault trace', () => {
    const dike = planeThrough(planePole(planeFromStrike(60, 90)), center);
    const offset = { x: 0, y: 60, z: 103.92 }; // 120 m of pure normal slip.
    const result = traceSeparation({ fault, marker: dike, view: map, offset, direction: { x: 1, y: 0, z: 0 } });
    const m = dike.normal;
    expect(result.distance).toBeCloseTo((m.x * 0 + m.y * 60 + m.z * 103.92) / m.x, 9);
    // Both crossing points lie on the map surface and on the fault.
    for (const point of Object.values(result.points)) {
      expect(point.z).toBeCloseTo(0, 9);
      expect(dot(fault.normal, { x: point.x - center.x, y: point.y - center.y, z: point.z - center.z })).toBeCloseTo(0, 9);
    }
    expect(result.points.hangingWall.x - result.points.footwall.x).toBeCloseTo(result.distance, 9);
  });

  it('shows no separation at all when the slip lies in the marker plane', () => {
    const dike = planeThrough(planePole(planeFromStrike(60, 45)), center);
    // Slip along the line where the fault and the dike meet lies in both planes.
    const n1 = fault.normal;
    const n2 = dike.normal;
    const line = { x: n1.y * n2.z - n1.z * n2.y, y: n1.z * n2.x - n1.x * n2.z, z: n1.x * n2.y - n1.y * n2.x };
    const offset = { x: line.x * 100, y: line.y * 100, z: line.z * 100 };
    expect(traceSeparation({ fault, marker: dike, view: map, offset }).distance).toBeCloseTo(0, 9);
  });

  it('shows pure strike-slip as dip separation in a cross-section through a dipping bed', () => {
    const vertical = planeThrough(planePole(VERTICAL_N), center);
    const bed = planeThrough(planePole(planeFromStrike(90, 30)), center); // dips south
    const section = planeThrough({ x: 1, y: 0, z: 0 }, { x: -500, y: 0, z: 0 });
    const dextral = { x: -100, y: 0, z: 0 }; // east block moves south
    const result = traceSeparation({ fault: vertical, marker: bed, view: section, offset: dextral, direction: { x: 0, y: 0, z: 1 } });
    // Moving the east block 100 m south lowers the south-dipping bed by 100 tan 30° in the section.
    expect(Math.abs(result.distance)).toBeCloseTo(100 * Math.tan(Math.PI / 6), 9);
  });

  it('logs missing section across a normal fault and repeated section across a reverse fault', () => {
    const well = { x: -300, y: 50 };
    const base = { fault, well, top: 0, bottom: 500, thickness: 62.5 };
    const normal = wellLog({ ...base, offset: { x: 0, y: 60, z: 103.92 }, top: 103.92 });
    expect(normal.faultDepth).toBeCloseTo(250 + 50 * Math.tan(Math.PI / 3), 6);
    expect(normal.gap.kind).toBe('missing');
    expect(normal.gap.thickness).toBeCloseTo(103.92, 6);
    expect(normal.pieces[0].layer).toBe(0);
    const reverse = wellLog({ ...base, offset: { x: 0, y: -60, z: -103.92 } });
    expect(reverse.gap.kind).toBe('repeated');
    expect(reverse.gap.thickness).toBeCloseTo(103.92, 6);
    // The layers just above the fault appear again just below it.
    const aboveLayer = reverse.pieces.filter((piece) => piece.wall === 'hanging').at(-1).layer;
    const belowLayer = reverse.pieces.find((piece) => piece.wall === 'foot').layer;
    expect(belowLayer).toBeLessThan(aboveLayer);
  });
});
