import { getTeamColor } from '@/theme/teamColors';
import { getCountryIso2 } from '@/theme/countryCodes';

describe('teamColors', () => {
  test('known teams map to their OpenF1 hex (case/space insensitive)', () => {
    expect(getTeamColor('Red Bull Racing').toLowerCase()).toBe('#3671c6');
    expect(getTeamColor('red_bull').toLowerCase()).toBe('#3671c6');
    expect(getTeamColor('Ferrari').toLowerCase()).toBe('#e8002d');
  });
  test('unknown team returns neutral default', () => {
    expect(getTeamColor('Nonexistent')).toBe('#666a73');
  });
});

describe('countryCodes', () => {
  test('maps race countries to ISO2', () => {
    expect(getCountryIso2('Bahrain')).toBe('bh');
    expect(getCountryIso2('UK')).toBe('gb');
    expect(getCountryIso2('United Kingdom')).toBe('gb');
    expect(getCountryIso2('Unknownland')).toBeNull();
  });
});
