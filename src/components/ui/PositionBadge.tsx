import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontFamily } from '@/theme';

interface Props {
  position: string | number;
}

interface Medal {
  bg: string;
  text: string;
}

function medal(pos: number): Medal {
  if (pos === 1) return { bg: colors.podiumGold, text: '#3a2c00' };
  if (pos === 2) return { bg: colors.podiumSilver, text: '#26262b' };
  if (pos === 3) return { bg: colors.podiumBronze, text: '#2a1400' };
  return { bg: colors.tile, text: colors.textSecondary };
}

export const PositionBadge: React.FC<Props> = ({ position }) => {
  const num = parseInt(String(position), 10);
  const { bg, text } = medal(num);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{position}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: fontFamily.mono, fontSize: 14 },
});
