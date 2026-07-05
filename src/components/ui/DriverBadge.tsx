import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme';

interface Props {
  code: string;
  teamColor?: string;
  size?: number;
}

export const DriverBadge: React.FC<Props> = ({ code, teamColor = colors.surfaceRaised, size = 40 }) => (
  <View
    style={[
      styles.badge,
      { width: size, height: size, borderRadius: size * 0.26, backgroundColor: teamColor },
    ]}
  >
    <Text style={[styles.text, { fontSize: size * 0.3 }]}>{code}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#ffffff', fontWeight: '800', letterSpacing: 0.5 },
});
