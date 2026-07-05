import { colors } from '@/theme/colors';

describe('theme colors', () => {
  test('accent is the shifted crimson (not official F1 red)', () => {
    expect(colors.accent).toBe('#dc0a2d');
    expect(colors.accent).not.toBe('#e10600');
  });
  test('dark background and podium tokens exist', () => {
    expect(colors.background).toBe('#0b0b0f');
    expect(colors.podiumGold).toBe('#ffd23f');
    expect(colors.podiumSilver).toBe('#c8c8d0');
    expect(colors.podiumBronze).toBe('#cd7f4d');
  });
  test('redesign tile/line/accent-soft tokens exist', () => {
    expect(colors.tile).toBe('#24242B');
    expect(colors.lineStrong).toBe('rgba(255,255,255,0.13)');
    expect(colors.accentSoft).toBe('rgba(220,10,45,0.15)');
  });
});
