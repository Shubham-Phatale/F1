import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, fontFamily, getCountryIso2 } from '@/theme';

interface Props {
  country: string;
  width?: number;
}

/** Derive the 3-letter uppercase fallback code from the country name. */
function fallbackCode(country: string): string {
  return country.slice(0, 3).toUpperCase();
}

/**
 * A rounded-6 image slot holding the real API flag image (flagcdn) that fills
 * the box. When no ISO2 match exists, the 3-letter code is shown centered as a
 * fallback. This is an image slot only — the code is never rendered beside the
 * flag.
 */
export const FlagChip: React.FC<Props> = ({ country, width = 40 }) => {
  const iso2 = getCountryIso2(country);
  const height = Math.round((width * 27) / 40);

  return (
    <View style={[styles.chip, { width, height }]}>
      {iso2 ? (
        <Image
          source={{ uri: `https://flagcdn.com/w80/${iso2}.png` }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.code}>{fallbackCode(country)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.tile,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fontFamily.mono,
  },
});

export default FlagChip;
