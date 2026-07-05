import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontFamily } from '@/theme';

interface Props {
  code: string;
  teamColor?: string;
  size?: number;
}

/**
 * Returns true when a team color is light enough to need dark text for
 * contrast. Uses relative luminance; also exact-matches known light colors
 * (Mercedes teal #27F4D2).
 */
function isLightColor(hex?: string): boolean {
  if (!hex) return false;
  const value = hex.replace('#', '');
  if (value.length !== 6) return false;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

export const DriverBadge: React.FC<Props> = ({ code, teamColor, size = 40 }) => {
  const dark = isLightColor(teamColor);
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: 11,
          backgroundColor: teamColor ?? colors.surfaceRaised,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.3, color: dark ? '#06231D' : '#ffffff' }]}>
        {code}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fontFamily.heading, letterSpacing: 0.5 },
});
