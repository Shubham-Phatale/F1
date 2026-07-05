import { scorePrediction } from '@/utils/scoring';

describe('scorePrediction', () => {
  const actual: [string, string, string] = ['ver', 'lec', 'ham'];

  test('perfect podium = 18 (5+5+5 + 3 bonus)', () => {
    const s = scorePrediction(['ver', 'lec', 'ham'], actual);
    expect(s.perSlot).toEqual([5, 5, 5]);
    expect(s.bonus).toBe(3);
    expect(s.total).toBe(18);
  });

  test('near-miss (right 3, P2/P3 swapped) = 9', () => {
    const s = scorePrediction(['ver', 'ham', 'lec'], actual);
    // ver exact +5, ham on podium wrong spot +2, lec on podium wrong spot +2, no bonus
    expect(s.total).toBe(9);
    expect(s.bonus).toBe(0);
  });

  test('one exact, two off-podium = 5', () => {
    const s = scorePrediction(['ver', 'nor', 'pia'], actual);
    expect(s.perSlot).toEqual([5, 0, 0]);
    expect(s.total).toBe(5);
  });

  test('all wrong = 0', () => {
    const s = scorePrediction(['nor', 'pia', 'alo'], actual);
    expect(s.total).toBe(0);
  });

  test('right driver wrong spot only = 2', () => {
    // predict lec at P1; lec is actually P2 -> on podium, wrong spot
    const s = scorePrediction(['lec', 'nor', 'pia'], actual);
    expect(s.perSlot).toEqual([2, 0, 0]);
    expect(s.total).toBe(2);
  });
});
