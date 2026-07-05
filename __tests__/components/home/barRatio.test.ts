import { barRatio } from '@/components/home/MiniStandings';

describe('barRatio', () => {
  it('returns full width for the leader', () => {
    expect(barRatio(310, 310)).toBe(1);
  });

  it('returns a proportional fraction below the leader', () => {
    expect(barRatio(155, 310)).toBeCloseTo(0.5);
  });

  it('clamps to 1 when points exceed the max', () => {
    expect(barRatio(400, 310)).toBe(1);
  });

  it('returns 0 for non-positive or invalid input', () => {
    expect(barRatio(0, 310)).toBe(0);
    expect(barRatio(100, 0)).toBe(0);
    expect(barRatio(NaN, 310)).toBe(0);
  });
});
