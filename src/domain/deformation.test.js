import { describe, expect, it } from 'vitest';
import { STRESS_STATES, scalePreset } from './stressStates.js';
import { applyDeformation, computeDeformation, volumeChangePercent } from './deformation.js';

describe('stress-state catalog', () => {
  it('contains ten uniquely identified presets', () => {
    expect(STRESS_STATES).toHaveLength(10);
    expect(new Set(STRESS_STATES.map((state) => state.id)).size).toBe(10);
    expect(STRESS_STATES.map((state) => state.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('scales every tensor component from a preset', () => {
    const tension = scalePreset(STRESS_STATES[0], 25);
    expect(tension.xx).toBe(-25);
    expect(tension.yy).toBe(0);
    expect(Object.keys(tension)).toEqual(['xx', 'yy', 'zz', 'xy', 'xz', 'yz']);
  });
});

describe('qualitative deformation mapping', () => {
  it('lengthens a block along uniaxial tension', () => {
    const stress = scalePreset(STRESS_STATES[0], 30);
    const { matrix } = computeDeformation(stress);
    const point = applyDeformation([1, 0, 0], matrix);
    expect(point[0]).toBeGreaterThan(1);
    expect(matrix[1][1]).toBeLessThan(1);
  });

  it('shortens a block along uniaxial compression', () => {
    const stress = scalePreset(STRESS_STATES[4], 30);
    const { matrix } = computeDeformation(stress);
    expect(matrix[0][0]).toBeLessThan(1);
    expect(matrix[1][1]).toBeGreaterThan(1);
  });

  it('keeps a pure-shear state volume preserving', () => {
    const stress = scalePreset(STRESS_STATES[7], 30);
    const deformation = computeDeformation(stress);
    expect(volumeChangePercent(deformation.determinant)).toBeCloseTo(0, 8);
    expect(deformation.matrix[0][1]).not.toBe(0);
  });

  it('reduces volume under triaxial compression', () => {
    const stress = scalePreset(STRESS_STATES[8], 30);
    const deformation = computeDeformation(stress);
    expect(volumeChangePercent(deformation.determinant)).toBeLessThan(0);
  });
});
