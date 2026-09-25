import { describe, expect, it } from 'vitest';
import { formatNumber } from './format.js';

describe('number formatting for live equations', () => {
  it('drops trailing zeros and uses a true minus sign', () => {
    expect(formatNumber(3)).toBe('3');
    expect(formatNumber(-4)).toBe('−4');
    expect(formatNumber(2.5)).toBe('2.5');
    expect(formatNumber(Math.sqrt(13))).toBe('3.61');
    expect(formatNumber(-0.0001)).toBe('0');
    expect(formatNumber(0.6, 3)).toBe('0.6');
  });
});
