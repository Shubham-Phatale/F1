import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PositionBadge, DriverBadge } from '@/components/ui';
import { colors, fontFamily, SCREEN_GUTTER } from '@/theme';

interface LeaderboardRowProps {
  rank: number;
  displayName: string;
  points: number;
  highlight?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  rank,
  displayName,
  points,
  highlight = false,
}) => {
  return (
    <View style={[styles.row, highlight && styles.rowHighlight]}>
      <PositionBadge position={rank} />

      <DriverBadge code={getInitials(displayName)} size={36} />

      <Text style={styles.name} numberOfLines={1}>
        {displayName}
      </Text>

      <Text style={styles.points}>{points}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: SCREEN_GUTTER,
  },
  rowHighlight: {
    backgroundColor: 'rgba(220, 10, 45, 0.12)',
  },
  name: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
  },
  points: {
    color: colors.accent,
    fontFamily: fontFamily.heading,
    fontSize: 18,
  },
});
