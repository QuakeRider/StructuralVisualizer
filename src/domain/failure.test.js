import { describe, expect, it } from 'vitest';
import { coulombAngles, coulombShearStrength, frictionAngle, mohrCircle, mohrPoint, sigma1AtFailure } from './failure.js';

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
