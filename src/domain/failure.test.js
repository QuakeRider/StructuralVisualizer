import { describe, expect, it } from 'vitest';
import { andersonAxes, principalStressTensor } from './anderson.js';
import {
  BYERLEE,
  byerlee,
  coulombAngles,
  coulombShearStrength,
  dilationTendency,
  frictionAngle,
  frictionCheck,
  mohrCircle,
  mohrCircles3D,
  mohrPoint,
  newFaultSigma1,
  principalCosines,
  principalMagnitudes,
  reactivationSigma1,
  sigma1AtFailure,
  slipTendency,
  slipTendencyGrid,
} from './failure.js';
import { lineVector, planeFromDipDirection, planeFromStrike, planeUpwardNormal } from './orientation.js';
import { equalAreaPoint, lineFromVector } from './stereonet.js';

describe('Coulomb failure angles', () => {
  it('turns the friction coefficient into the friction angle', () => {
    expect(frictionAngle(0)).toBe(0);
    expect(frictionAngle(1)).toBeCloseTo(45, 12);
    expect(frictionAngle(0.6)).toBeCloseTo(30.964, 3);
  });

  it('puts the failure plane at 45° − φ/2 from σ1', () => {
    const angles = coulombAngles(0.6);
    expect(angles.phi).toBeCloseTo(30.964, 3);
    expect(angles.beta).toBeCloseTo(29.518, 3);
    expect(angles.theta).toBeCloseTo(60.482, 3);
    expect(angles.twoTheta).toBeCloseTo(120.964, 3);
    expect(angles.beta + angles.theta).toBeCloseTo(90, 12);
  });

  it('reduces to the 45° plane of maximum shear stress when there is no friction', () => {
    const angles = coulombAngles(0);
    expect(angles.beta).toBe(45);
    expect(angles.theta).toBe(45);
  });
});

describe('Mohr circle and the Coulomb envelope', () => {
  it('places the circle from σ1 and σ3', () => {
    expect(mohrCircle(100, 20)).toEqual({ center: 60, radius: 40 });
  });

  it('plots a plane at 2θ, with θ measured from σ1 to the plane normal', () => {
    expect(mohrPoint(100, 20, 0)).toEqual({ sigmaN: 100, tau: 0 });
    const at45 = mohrPoint(100, 20, 45);
    expect(at45.sigmaN).toBeCloseTo(60, 12);
    expect(at45.tau).toBeCloseTo(40, 12);
    expect(mohrPoint(100, 20, 90).sigmaN).toBeCloseTo(20, 12);
  });

  it('computes shear strength on the Coulomb line', () => {
    expect(coulombShearStrength(50, { cohesion: 10, mu: 0.6 })).toBeCloseTo(40, 12);
  });

  it('finds the σ1 whose circle just touches the envelope, at the predicted angle', () => {
    for (const mu of [0.2, 0.6, 0.85, 1]) {
      const strength = { cohesion: 10, mu };
      const sigma1 = sigma1AtFailure(20, strength);
      const point = mohrPoint(sigma1, 20, coulombAngles(mu).theta);
      expect(point.tau).toBeCloseTo(coulombShearStrength(point.sigmaN, strength), 9);
      // Tangent: every other plane stays below the line.
      for (let theta = 0; theta <= 90; theta += 1) {
        const other = mohrPoint(sigma1, 20, theta);
        expect(other.tau).toBeLessThanOrEqual(coulombShearStrength(other.sigmaN, strength) + 1e-9);
      }
    }
    // Cohesionless: σ1/σ3 = (√(1 + μ²) + μ)².
    expect(sigma1AtFailure(20, { cohesion: 0, mu: 0.6 })).toBeCloseTo(20 * (Math.sqrt(1.36) + 0.6) ** 2, 9);
  });
});

describe('Byerlee friction and slip tendency (B6)', () => {
  // Normal-faulting regime: σ1 vertical, σ2 north–south, σ3 east–west.
  const axes = andersonAxes('normal', 0);
  const axisVectors = Object.fromEntries(Object.entries(axes).map(([key, axis]) => [key, lineVector(axis.trend, axis.plunge)]));
  const stress = (sigma1, sigma3 = 30) => principalStressTensor(axes, principalMagnitudes(sigma1, sigma3));
  const normalOf = (plane) => planeUpwardNormal(plane);

  it('follows the two segments of Byerlee’s law, which meet at 200 MPa', () => {
    expect(byerlee(50)).toBeCloseTo(42.5, 12);
    expect(byerlee(300)).toBeCloseTo(230, 12);
    expect(byerlee(BYERLEE.transition)).toBeCloseTo(170, 12);
    expect(byerlee(BYERLEE.transition - 1e-6)).toBeCloseTo(170, 4);
  });

  it('puts σ2 halfway between σ1 and σ3, and builds the three Mohr circles', () => {
    expect(principalMagnitudes(150, 30)).toEqual({ sigma1: 150, sigma2: 90, sigma3: 30 });
    const circles = mohrCircles3D({ sigma1: 150, sigma2: 90, sigma3: 30 });
    expect(circles.map(({ center, radius }) => [center, radius])).toEqual([[90, 60], [120, 30], [60, 30]]);
  });

  it('plots any plane inside the region between the three circles', () => {
    const magnitudes = principalMagnitudes(150, 30);
    const [big, upper, lower] = mohrCircles3D(magnitudes);
    for (let dipDirection = 0; dipDirection < 360; dipDirection += 37) {
      for (let dip = 5; dip <= 90; dip += 17) {
        const { sigmaN, tau } = frictionCheck(stress(150), normalOf(planeFromDipDirection(dipDirection, dip)));
        const distance = (circle) => Math.hypot(sigmaN - circle.center, tau);
        expect(distance(big)).toBeLessThanOrEqual(big.radius + 1e-9);
        expect(distance(upper)).toBeGreaterThanOrEqual(upper.radius - 1e-9);
        expect(distance(lower)).toBeGreaterThanOrEqual(lower.radius - 1e-9);
      }
    }
  });

  it('computes Ts = τ/σn′ and says when a plane slips', () => {
    // A plane containing σ2 whose normal is 45° from σ1 plots at the top of the big circle.
    const plane = planeFromDipDirection(90, 45);
    const check = frictionCheck(stress(150), normalOf(plane));
    expect(check.sigmaN).toBeCloseTo(90, 9);
    expect(check.tau).toBeCloseTo(60, 9);
    expect(check.ts).toBeCloseTo(60 / 90, 9);
    expect(check.slips).toBe(false);
    // Pore pressure lowers σn′ but leaves τ alone.
    const wet = frictionCheck(stress(150), normalOf(plane), 20);
    expect(wet.tau).toBeCloseTo(60, 9);
    expect(wet.sigmaNEff).toBeCloseTo(70, 9);
    expect(slipTendency(stress(150), normalOf(plane), 20)).toBeCloseTo(60 / 70, 9);
  });

  it('gives dilation tendency 1 for planes normal to σ3 and 0 for planes normal to σ1', () => {
    const magnitudes = principalMagnitudes(150, 30);
    expect(dilationTendency(stress(150), axisVectors.sigma3, magnitudes)).toBeCloseTo(1, 12);
    expect(dilationTendency(stress(150), axisVectors.sigma1, magnitudes)).toBeCloseTo(0, 12);
    expect(dilationTendency(stress(150), axisVectors.sigma2, magnitudes)).toBeCloseTo(0.5, 12);
  });

  it('reactivates the best-oriented plane at σ1/σ3 = (√(1 + μ²) + μ)²', () => {
    const best = planeFromDipDirection(90, 90 - coulombAngles(BYERLEE.mu).beta);
    const cosines = principalCosines(normalOf(best), axisVectors);
    const sigma1 = reactivationSigma1(cosines, { sigma3: 30 });
    expect(sigma1).toBeCloseTo(30 * (Math.sqrt(1 + 0.85 ** 2) + 0.85) ** 2, 9);
    expect(sigma1).toBeCloseTo(140.3, 1);
    // At that σ1 the plane sits exactly on the friction line.
    const check = frictionCheck(stress(sigma1), normalOf(best));
    expect(check.tau).toBeCloseTo(check.strength, 9);
    // Pore pressure lowers the σ1 needed.
    expect(reactivationSigma1(cosines, { sigma3: 30, pf: 10 })).toBeLessThan(sigma1);
  });

  it('needs more stress for a misoriented plane, and locks a badly misoriented one', () => {
    const at = (dip) => reactivationSigma1(principalCosines(normalOf(planeFromDipDirection(90, dip)), axisVectors), { sigma3: 30 });
    // Plane containing σ2 at θr from σ1: σ1/σ3 = (1 + μ cot θr)/(1 − μ tan θr).
    const sibson = (thetaR) => 30 * (1 + 0.85 / Math.tan(thetaR)) / (1 - 0.85 * Math.tan(thetaR));
    expect(at(80)).toBeCloseTo(sibson((10 * Math.PI) / 180), 9);
    expect(at(80)).toBeGreaterThan(at(65));
    expect(at(30)).toBe(Infinity);
    // A 45° plane reaches σn′ = 200 MPa just as it slips, where both Byerlee segments agree.
    expect(at(45)).toBeCloseTo(370, 9);
  });

  it('breaks intact rock at a σ1 set by the Coulomb line in effective stress', () => {
    const intact = { cohesion: 20, mu: 0.85 };
    expect(newFaultSigma1(30, intact)).toBeCloseTo(sigma1AtFailure(30, intact), 12);
    expect(newFaultSigma1(30, intact)).toBeCloseTo(226.8, 1);
    expect(newFaultSigma1(30, { ...intact, pf: 10 })).toBeCloseTo(sigma1AtFailure(20, intact) + 10, 12);
  });

  it('maps slip tendency over the stereonet, with the highest values near the Coulomb pole', () => {
    const tensor = stress(150);
    const grid = slipTendencyGrid(tensor, { size: 60 });
    expect(grid.values).toHaveLength(3600);
    expect(grid.slips.some(Boolean)).toBe(true);
    expect(Number.isNaN(grid.values[0])).toBe(true);
    // The best plane dips 90° − β toward 090°; its pole plunges β toward 270°.
    const beta = coulombAngles(BYERLEE.mu).beta;
    const best = frictionCheck(tensor, normalOf(planeFromDipDirection(90, 90 - beta))).ts;
    expect(grid.max).toBeLessThanOrEqual(best + 1e-6);
    expect(grid.max).toBeGreaterThan(best - 0.02);
    // Sample the cell under that pole.
    const pole = equalAreaPoint(lineFromVector(normalOf(planeFromDipDirection(90, 90 - beta))));
    const column = Math.floor(((pole.x + 1) / 2) * 60);
    const row = Math.floor(((1 - pole.y) / 2) * 60);
    expect(grid.values[row * 60 + column]).toBeGreaterThan(best - 0.03);
    expect(grid.slips[row * 60 + column]).toBe(1);
    // Dry at σ1/σ3 = 4, below the (√(1 + μ²) + μ)² ≈ 4.68 needed, nothing slips.
    expect(slipTendencyGrid(stress(120), { size: 30 }).slips.some(Boolean)).toBe(false);
    // A horizontal plane (pole at the center) has no shear stress.
    expect(grid.values[30 * 60 + 30]).toBeLessThan(0.05);
    // Strike-slip vertical planes at ±β from σ1 in the strike-slip regime.
    const ssAxes = andersonAxes('strike-slip', 0);
    const ssTensor = principalStressTensor(ssAxes, principalMagnitudes(150, 30));
    const ss = frictionCheck(ssTensor, normalOf(planeFromStrike(beta, 90))).ts;
    expect(ss).toBeCloseTo(best, 9);
  });
});
