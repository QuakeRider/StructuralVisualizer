import { describe, expect, it } from 'vitest';
import {
  RELAY,
  classifyDrag,
  contourRadius,
  displacementAt,
  displacementProfile,
  dlLength,
  dlScaling,
  dragDisplacement,
  ellipticalDisplacement,
  farFieldOffset,
  faultDisplacement,
  linkSegments,
  relayFaults,
  relaySystem,
  segmentProfile,
  tipRadius,
} from './faultGrowth.js';
import { planeFromStrike } from './orientation.js';
import { dot, magnitude } from './vector.js';

const FIELD = { a: 400, b: 240, dMax: 80, model: 'elliptical' };

describe('displacement on an isolated fault', () => {
  it('measures the elliptical radius from the center: 1 on the tip line', () => {
    expect(tipRadius(400, 240, 0, 0)).toBe(0);
    expect(tipRadius(400, 240, 400, 0)).toBeCloseTo(1);
    expect(tipRadius(400, 240, 0, -240)).toBeCloseTo(1);
    expect(tipRadius(400, 240, 200, 120)).toBeCloseTo(Math.SQRT1_2);
  });

  it('is largest at the center and zero on and outside the tip line (elliptical model)', () => {
    expect(ellipticalDisplacement(400, 240, 80, 0, 0)).toBe(80);
    expect(ellipticalDisplacement(400, 240, 80, 200, 0)).toBeCloseTo(69.28, 2);
    expect(ellipticalDisplacement(400, 240, 80, 400, 0)).toBe(0);
    expect(ellipticalDisplacement(400, 240, 80, 450, 10)).toBe(0);
    expect(ellipticalDisplacement(400, 240, 80, 0, 120)).toBeCloseTo(69.28, 2);
  });

  it('offers a linear taper as a second idealized model', () => {
    const linear = { ...FIELD, model: 'linear' };
    expect(displacementAt(linear, 0, 0)).toBe(80);
    expect(displacementAt(linear, 200, 0)).toBeCloseTo(40);
    expect(displacementAt(linear, 400, 0)).toBe(0);
    expect(displacementAt(FIELD, 200, 0)).toBeCloseTo(69.28, 2);
  });

  it('gives a uniform displacement for a fault whose tips are far away', () => {
    expect(displacementAt({ uniform: true, dMax: 6 }, 1e5, -1e5)).toBe(6);
  });

  it('places contours of equal displacement on ellipses', () => {
    const r = contourRadius(40, 80, 'elliptical');
    expect(ellipticalDisplacement(400, 240, 80, 400 * r, 0)).toBeCloseTo(40);
    expect(contourRadius(40, 80, 'linear')).toBeCloseTo(0.5);
    expect(contourRadius(0, 80, 'elliptical')).toBe(1);
  });

  it('slices a profile along strike: shorter and lower away from the center line', () => {
    const center = displacementProfile(FIELD, { w: 0 });
    expect(center.halfLength).toBeCloseTo(400);
    expect(center.peak).toBeCloseTo(80);
    const upper = displacementProfile(FIELD, { w: -144 });
    expect(upper.halfLength).toBeCloseTo(320, 0);
    expect(upper.peak).toBeCloseTo(64, 0);
    expect(upper.points[0].d).toBe(0);
    expect(Math.max(...upper.points.map((point) => point.d))).toBeCloseTo(upper.peak, 1);
    expect(displacementProfile(FIELD, { w: 300 }).halfLength).toBe(0);
  });

  it('reaches half its maximum 87% of the way to the tip (elliptical), halfway (linear)', () => {
    const u = 400 * Math.sqrt(0.75);
    expect(displacementAt(FIELD, u, 0)).toBeCloseTo(40);
    expect(displacementAt({ ...FIELD, model: 'linear' }, 200, 0)).toBeCloseTo(40);
  });
});

describe('displacement–length scaling', () => {
  it('computes D = c Lⁿ and inverts it', () => {
    expect(dlScaling(2000, 0.03)).toBeCloseTo(60);
    expect(dlScaling(2000, 0.03, 1)).toBeCloseTo(60);
    expect(dlScaling(100, 0.01, 1.5)).toBeCloseTo(10);
    expect(dlLength(60, 0.03)).toBeCloseTo(2000);
    expect(dlLength(10, 0.01, 1.5)).toBeCloseTo(100);
  });

  it('keeps D/L = c at every size when n = 1 (self-similar faults)', () => {
    for (const length of [10, 1e3, 1e5]) expect(dlScaling(length, 0.02) / length).toBeCloseTo(0.02);
    expect(dlScaling(1e4, 0.02, 1.2) / 1e4).toBeGreaterThan(dlScaling(1e2, 0.02, 1.2) / 1e2);
  });
});

describe('the 3D displacement field of a normal fault', () => {
  const fault = { center: { x: 0, y: 0, z: 250 }, plane: planeFromStrike(0, 60), field: FIELD, decay: null };

  it('moves the hanging wall down the dip and the footwall up it, D apart at the fault', () => {
    const hanging = faultDisplacement({ x: 0, y: 1, z: 250 }, fault);
    const foot = faultDisplacement({ x: 0, y: -1, z: 250 }, fault);
    expect(hanging.side).toBe('hanging');
    expect(foot.side).toBe('foot');
    expect(hanging.vector.z).toBeGreaterThan(0);
    expect(hanging.vector.y).toBeGreaterThan(0);
    expect(foot.vector.z).toBeLessThan(0);
    const gap = { x: hanging.vector.x - foot.vector.x, y: hanging.vector.y - foot.vector.y, z: hanging.vector.z - foot.vector.z };
    expect(magnitude(gap)).toBeCloseTo(80, 0);
    // The motion is parallel to the fault: no opening.
    expect(dot(gap, { x: 0, y: -Math.sin(Math.PI / 3), z: Math.cos(Math.PI / 3) })).toBeCloseTo(0, 6);
  });

  it('does nothing beyond the tip line', () => {
    expect(magnitude(faultDisplacement({ x: 450, y: 1, z: 250 }, fault).vector)).toBe(0);
  });

  it('fades away from the fault when it has a decay length', () => {
    const decaying = { ...fault, decay: 300 };
    const near = faultDisplacement({ x: 0, y: 2, z: 250 }, decaying).amount;
    const far = faultDisplacement({ x: 0, y: 200, z: 250 }, decaying).amount;
    expect(far).toBeLessThan(near);
  });
});

describe('fault drag', () => {
  it('keeps the slip D on the fault and changes the far-field offset', () => {
    for (const k of [-0.5, 0, 0.5]) expect(2 * dragDisplacement(0, { slip: 60, k, width: 80 })).toBeCloseTo(60);
    expect(2 * dragDisplacement(1e4, { slip: 60, k: 0.5, width: 80 })).toBeCloseTo(30);
    expect(farFieldOffset(60, 0.5)).toBe(30);
    expect(farFieldOffset(60, -0.5)).toBe(90);
  });

  it('names reverse drag (the rock beside the fault moved most) and normal drag', () => {
    expect(classifyDrag(0.4)).toBe('reverse drag');
    expect(classifyDrag(-0.4)).toBe('normal drag');
    expect(classifyDrag(0)).toBe('no drag');
    expect(dragDisplacement(50, { slip: 60, k: 0.4, width: 80 })).toBeLessThan(30);
    expect(dragDisplacement(50, { slip: 60, k: -0.4, width: 80 })).toBeGreaterThan(30);
  });
});

describe('growth by linkage', () => {
  it('moves the segments from underlap through overlap to a breach', () => {
    expect(relaySystem(0).stage).toBe('underlapping');
    expect(relaySystem(0).overlap).toBe(RELAY.minOverlap);
    expect(relaySystem(0.45).stage).toBe('overlapping');
    const breached = relaySystem(0.6);
    expect(breached.stage).toBe('breached');
    expect(breached.overlap).toBeCloseTo(RELAY.breachOverlap);
    expect(breached.linked).toBe(0);
    expect(relaySystem(1).linked).toBe(1);
  });

  it('grows each segment’s displacement with its length (D = cL)', () => {
    const { segments } = relaySystem(0.3);
    for (const segment of segments) expect(segment.dMax).toBeCloseTo(RELAY.ratio * 2 * segment.halfLength);
    expect(segments[0].to).toBeCloseTo(relaySystem(0.3).overlap / 2);
    expect(segments[1].from).toBeCloseTo(-relaySystem(0.3).overlap / 2);
  });

  it('sums the segment profiles (soft linkage) and adds the linked slip after the breach', () => {
    const early = relaySystem(0.45);
    const at = early.profile(0);
    expect(at.total).toBeCloseTo(at.A + at.B);
    expect(linkSegments([{ ...early.segments[0] }, { ...early.segments[1] }], 0)).toBeCloseTo(at.A + at.B);
    expect(segmentProfile(early.segments[0], early.segments[0].center)).toBeCloseTo(early.segments[0].dMax);
    const mature = relaySystem(1);
    for (const x of [-300, -40, 0, 40, 300]) {
      const point = mature.profile(x);
      expect(point.total).toBeCloseTo(Math.max(point.target, point.A + point.B), 6);
      expect(point.extraA + point.extraB + point.extraBreach).toBeCloseTo(point.total - point.A - point.B, 6);
    }
  });

  it('leaves a displacement deficit at the breach: the linked fault is under-displaced for its length', () => {
    const { profile } = relaySystem(0.6);
    const center = profile(0);
    expect(center.total).toBeLessThan(center.target);
  });

  it('puts the breach across the ramp, from segment A to segment B', () => {
    const { breach } = relaySystem(0.8);
    expect(breach.from.y).toBeCloseTo(-RELAY.stepover / 2);
    expect(breach.to.y).toBeCloseTo(RELAY.stepover / 2);
    expect(relaySystem(0.5).breach).toBeNull();
  });
});

describe('the relay ramp in 3D', () => {
  const elevation = (faults, x, y) => faults.reduce((sum, fault) => sum + faultDisplacement({ x, y, z: RELAY.depth }, fault).vector.z, 0);

  it('tilts the ramp between the segments down toward the south (toward the middle of A)', () => {
    const faults = relayFaults(relaySystem(0.5));
    // z is down: the southern ramp sits deeper than the northern ramp.
    expect(elevation(faults, -60, 0)).toBeGreaterThan(elevation(faults, 60, 0));
  });

  it('matches the along-strike profile at the reference depth and adds a breach fault once breached', () => {
    const system = relaySystem(0.8);
    const faults = relayFaults(system);
    expect(faults.map((fault) => fault.id)).toEqual(['A', 'B', 'breach']);
    const point = system.profile(-200);
    expect(faults[0].profile(-200, 0)).toBeCloseTo(point.A + point.extraA, 6);
    expect(faults[2].profile(0, 0)).toBeCloseTo(system.profile(0).extraBreach, 6);
    expect(faults[2].profile(500, 0)).toBe(0);
  });
});
