import { describe, expect, it } from 'vitest';
import { formatNumber, formatSquared, formatVector } from './format.js';

describe('number formatting for live equations', () => {
  it('drops trailing zeros and uses a true minus sign', () => {
    expect(formatNumber(3)).toBe('3');
    expect(formatNumber(-4)).toBe('−4');
    expect(formatNumber(2.5)).toBe('2.5');
    expect(formatNumber(Math.sqrt(13))).toBe('3.61');
    expect(formatNumber(-0.0001)).toBe('0');
    expect(formatNumber(0.6, 3)).toBe('0.6');
  });

  it('wraps negative numbers in parentheses before squaring', () => {
    expect(formatSquared(3)).toBe('3²');
    expect(formatSquared(-4)).toBe('(−4)²');
  });

  it('writes vectors as component lists', () => {
    expect(formatVector({ x: 3, y: -4, z: 0 })).toBe('(3, −4, 0)');
    expect(formatVector({ x: 3, y: -4, z: 0 }, { dimension: 2 })).toBe('(3, −4)');
  });
});
