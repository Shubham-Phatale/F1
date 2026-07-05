import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme';

interface Props {
  position: string | number;
}

function podiumColor(pos: number): string {
  if (pos === 1) return colors.podiumGold;
  if (pos === 2) return colors.podiumSilver;
  if (pos === 3) return colors.podiumBronze;
  return colors.surfaceRaised;
}

export const PositionBadge: React.FC<Props> = ({ position }) => {
  const num = parseInt(String(position), 10);
  const isPodium = num >= 1 && num <= 3;
  const bg = podiumColor(num);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: isPodium ? '#1a1400' : colors.textPrimary }]}>
        {position}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontWeight: '800', fontSize: 12 },
});
