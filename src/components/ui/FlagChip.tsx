import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, fontFamily, radii, getCountryIso2 } from '@/theme';

interface Props {
  country: string;
  width?: number;
  showCode?: boolean;
}

/** Derive the 3-letter uppercase code shown beside the flag. */
function countryCode(country: string): string {
  const iso2 = getCountryIso2(country);
  if (iso2) return iso2.toUpperCase();
  return country.slice(0, 3).toUpperCase();
}

/**
 * Rounded-rect chip holding the API flag image with a `lineStrong` hairline
 * border. When `showCode`, the 3-letter country code sits to the right in the
 * mono-semibold numeral face.
 */
export const FlagChip: React.FC<Props> = ({ country, width = 34, showCode = false }) => {
  const iso2 = getCountryIso2(country);
  const height = Math.round((width * 2) / 3);

  return (
    <View style={styles.container}>
      {iso2 ? (
        <Image
          source={{ uri: `https://flagcdn.com/w80/${iso2}.png` }}
          style={[styles.flag, { width, height }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.flag, styles.flagFallback, { width, height }]} />
      )}
      {showCode ? <Text style={styles.code}>{countryCode(country)}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flag: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  flagFallback: {
    backgroundColor: colors.tile,
  },
  code: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fontFamily.monoSemi,
    letterSpacing: 0.5,
  },
});

export default FlagChip;
