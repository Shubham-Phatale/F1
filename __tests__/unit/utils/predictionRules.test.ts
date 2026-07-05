import { getRaceLockTime, isPredictionOpen, validatePodium } from '@/utils/predictionRules';

describe('predictionRules', () => {
  test('lock time uses date + time (UTC)', () => {
    const t = getRaceLockTime('2024-03-02', '15:00:00Z');
    expect(t).toBe(Date.parse('2024-03-02T15:00:00Z'));
  });

  test('lock time without time = start of that UTC day', () => {
    const t = getRaceLockTime('2024-03-02', undefined);
    expect(t).toBe(Date.parse('2024-03-02T00:00:00Z'));
  });

  test('open before lock, closed at/after lock', () => {
    const date = '2024-03-02';
    const time = '15:00:00Z';
    const lock = Date.parse('2024-03-02T15:00:00Z');
    expect(isPredictionOpen(date, time, lock - 1000)).toBe(true);
    expect(isPredictionOpen(date, time, lock)).toBe(false);
    expect(isPredictionOpen(date, time, lock + 1000)).toBe(false);
  });

  test('validatePodium requires 3 distinct non-empty drivers', () => {
    expect(validatePodium('ver', 'lec', 'ham').valid).toBe(true);
    expect(validatePodium('ver', 'ver', 'ham').valid).toBe(false);
    expect(validatePodium('ver', '', 'ham').valid).toBe(false);
  });
});
