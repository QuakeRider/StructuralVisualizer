import { describe, expect, it } from 'vitest';
import { abs, bound, column, frac, hat, live, math, mi, mn, paren, signedTerm, sqrt, squared, sub, tuple, vec } from './mathml.js';

describe('MathML builder', () => {
  it('builds nested MathML and escapes text', () => {
    expect(mi('x')).toBe('<mi>x</mi>');
    expect(mn('<3')).toBe('<mn>&lt;3</mn>');
    expect(sub(mi('v'), mi('x'))).toBe('<msub><mi>v</mi><mi>x</mi></msub>');
    expect(sqrt(mn('9'))).toBe('<msqrt><mn>9</mn></msqrt>');
    expect(frac(mn('1'), mn('2'))).toBe('<mfrac><mn>1</mn><mn>2</mn></mfrac>');
    expect(math(mi('x'))).toBe('<div class="math-line"><math displaystyle="true"><mi>x</mi></math></div>');
  });

  it('writes vectors in bold and hats as accents', () => {
    expect(vec('v')).toBe('<mi>𝐯</mi>');
    expect(() => vec('q')).toThrow(RangeError);
    expect(hat(vec('v'))).toBe('<mover accent="true"><mi>𝐯</mi><mo>^</mo></mover>');
    expect(abs(vec('v'))).toContain('<mo class="fence">|</mo>');
    expect(column(mn('1'), mn('2'))).toBe(paren('<mtable><mtr><mtd><mn>1</mn></mtd></mtr><mtr><mtd><mn>2</mn></mtd></mtr></mtable>'));
  });

  it('marks bound symbols and live slots for the equation panel', () => {
    expect(bound('comp-x', mi('v'))).toBe('<mrow data-scene-ref="comp-x" data-sym=""><mi>v</mi></mrow>');
    expect(live('magnitude', 'vector')).toBe('<mrow data-scene-ref="vector" data-live="magnitude"></mrow>');
  });

  it('formats live numbers with true minus signs and bracketed negatives', () => {
    expect(squared(3)).toBe('<msup><mn>3</mn><mn>2</mn></msup>');
    expect(squared(-4)).toBe(`<msup>${paren('<mn>−4</mn>')}<mn>2</mn></msup>`);
    expect(signedTerm(-1)).toBe(paren('<mn>−1</mn>'));
    expect(signedTerm(2)).toBe('<mn>2</mn>');
    expect(tuple([3, -4])).toBe(paren('<mn>3</mn><mo>,</mo><mn>−4</mn>'));
  });
});
