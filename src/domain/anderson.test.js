import { describe, expect, it } from 'vitest';
import { ANDERSON_REGIMES, andersonAxes, andersonFaults, faultSlip, principalStressTensor, slipSense } from './anderson.js';
import { lineVector, planePole } from './orientation.js';
import { dot } from './vector.js';

const axisVector = (axis) => lineVector(axis.trend, axis.plunge);
const STRESS = { sigma1: 100, sigma2: 60, sigma3: 20 };

describe('Andersonian stress axes', () => {
  it('makes the named principal stress vertical', () => {
    for (const [regime, { vertical }] of Object.entries(ANDERSON_REGIMES)) {
      const axes = andersonAxes(regime, 0);
      expect(axes[vertical].plunge, regime).toBe(90);
      for (const key of ['sigma1', 'sigma2', 'sigma3'].filter((candidate) => candidate !== vertical)) expect(axes[key].plunge, regime).toBe(0);
    }
  });

  it('aligns σ1 (or σ2 in the normal regime) with the maximum horizontal stress', () => {
    expect(andersonAxes('thrust', 30).sigma1).toEqual({ trend: 30, plunge: 0 });
    expect(andersonAxes('strike-slip', 30).sigma3).toEqual({ trend: 120, plunge: 0 });
    expect(andersonAxes('normal', 30).sigma2).toEqual({ trend: 30, plunge: 0 });
  });

  it('keeps the three axes mutually perpendicular', () => {
    for (const regime of Object.keys(ANDERSON_REGIMES)) {
      const axes = andersonAxes(regime, 47);
      expect(dot(axisVector(axes.sigma1), axisVector(axes.sigma2))).toBeCloseTo(0, 12);
      expect(dot(axisVector(axes.sigma2), axisVector(axes.sigma3))).toBeCloseTo(0, 12);
      expect(dot(axisVector(axes.sigma1), axisVector(axes.sigma3))).toBeCloseTo(0, 12);
    }
  });
});

describe('Andersonian fault planes', () => {
  it('predicts normal faults dipping 45° + φ/2 (about 60°), striking parallel to σ2', () => {
    const result = andersonFaults('normal', 0.6, 0);
    expect(result.dip).toBeCloseTo(60.482, 3);
    expect(result.faults.map((plane) => plane.dipDirection)).toEqual([90, 270]);
    expect(result.faults.map((plane) => plane.strike)).toEqual([0, 180]);
  });

  it('predicts thrust faults dipping 45° − φ/2 (about 30°)', () => {
    const result = andersonFaults('thrust', 0.6, 0);
    expect(result.dip).toBeCloseTo(29.518, 3);
    expect(result.faults.map((plane) => plane.dipDirection)).toEqual([0, 180]);
  });

  it('predicts vertical strike-slip faults at ±β from σ1', () => {
    const result = andersonFaults('strike-slip', 0.6, 0);
    expect(result.dip).toBe(90);
    expect(result.faults[0].strike).toBeCloseTo(29.518, 3);
    expect(result.faults[1].strike).toBeCloseTo(330.482, 3);
  });

  it('puts every fault at β from σ1 and makes it contain σ2', () => {
    for (const regime of Object.keys(ANDERSON_REGIMES)) {
      for (const mu of [0, 0.4, 0.6, 1]) {
        const { axes, faults, beta } = andersonFaults(regime, mu, 25);
        for (const plane of faults) {
          const pole = planePole(plane);
          expect(dot(pole, axisVector(axes.sigma2)), `${regime} μ=${mu}`).toBeCloseTo(0, 9);
          const angleToSigma1 = (Math.asin(Math.min(1, Math.abs(dot(pole, axisVector(axes.sigma1))))) * 180) / Math.PI;
          expect(angleToSigma1, `${regime} μ=${mu}`).toBeCloseTo(beta, 9);
        }
      }
    }
  });

  it('steepens normal faults and flattens thrusts as friction increases', () => {
    expect(andersonFaults('normal', 1, 0).dip).toBeGreaterThan(andersonFaults('normal', 0.4, 0).dip);
    expect(andersonFaults('thrust', 1, 0).dip).toBeLessThan(andersonFaults('thrust', 0.4, 0).dip);
    expect(andersonFaults('normal', 0, 0).dip).toBe(45);
  });
});

describe('slip on Andersonian faults', () => {
  it('builds the tensor so each principal axis is an eigenvector', () => {
    const axes = andersonAxes('normal', 0);
    const tensor = principalStressTensor(axes, STRESS);
    // σ1 vertical: σ_DD = σ1; σ3 east–west: σ_EE = σ3.
    expect(tensor[2][2]).toBeCloseTo(100, 12);
    expect(tensor[1][1]).toBeCloseTo(20, 12);
    expect(tensor[0][0]).toBeCloseTo(60, 12);
  });

  it('gives normal slip in the normal regime and reverse slip in the thrust regime', () => {
    for (const [regime, sense] of [['normal', 'normal'], ['thrust', 'reverse']]) {
      const { axes, faults } = andersonFaults(regime, 0.6, 0);
      const tensor = principalStressTensor(axes, STRESS);
      for (const plane of faults) {
        const { slip } = faultSlip(tensor, plane);
        expect(slipSense(plane, slip), regime).toBe(sense);
        expect(dot(slip, axisVector(axes.sigma2)), regime).toBeCloseTo(0, 9);
      }
    }
  });

  it('makes the fault clockwise from σ1 sinistral and its conjugate dextral', () => {
    const { axes, faults } = andersonFaults('strike-slip', 0.6, 0);
    const tensor = principalStressTensor(axes, STRESS);
    expect(slipSense(faults[0], faultSlip(tensor, faults[0]).slip)).toBe('sinistral');
    expect(slipSense(faults[1], faultSlip(tensor, faults[1]).slip)).toBe('dextral');
  });

  it('moves a normal-fault hanging wall down the dip', () => {
    const { axes, faults } = andersonFaults('normal', 0.6, 0);
    const { slip } = faultSlip(principalStressTensor(axes, STRESS), faults[0]);
    // Plane dips east: the hanging wall moves east and down.
    expect(slip.y).toBeGreaterThan(0);
    expect(slip.z).toBeGreaterThan(0);
    expect(Math.hypot(slip.x, slip.y, slip.z)).toBeCloseTo(1, 12);
  });
});
