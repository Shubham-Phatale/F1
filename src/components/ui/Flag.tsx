import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { getCountryIso2 } from '@/theme';

interface Props {
  country: string;
  width?: number;
}

export const Flag: React.FC<Props> = ({ country, width = 24 }) => {
  const iso2 = getCountryIso2(country);
  if (!iso2) return null;
  const height = Math.round((width * 3) / 4);
  return (
    <Image
      source={{ uri: `https://flagcdn.com/w80/${iso2}.png` }}
      style={[styles.flag, { width, height }]}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  flag: { borderRadius: 3 },
});
