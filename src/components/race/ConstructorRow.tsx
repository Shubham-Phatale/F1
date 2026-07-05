import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ConstructorStanding } from '../../types';
import { formatPoints } from '../../utils/formatters';
import { PositionBadge, PressableScale } from '@/components/ui';
import { colors, fontFamily, getTeamColor } from '@/theme';

interface ConstructorRowProps {
  standing: ConstructorStanding;
  index: number;
  onPress?: () => void;
}

const ConstructorRow: React.FC<ConstructorRowProps> = ({ standing, onPress }) => {
  const teamColor = getTeamColor(standing.constructor.name);
  const isLeader = standing.position === '1';

  return (
    <PressableScale style={styles.row} onPress={onPress} disabled={!onPress}>
      <PositionBadge position={standing.position} />

      {/* Team color swatch */}
      <View style={[styles.swatch, { backgroundColor: teamColor }]} />

      {/* Constructor Info */}
      <View style={styles.constructorInfo}>
        <Text style={styles.constructorName}>{standing.constructor.name}</Text>
        <Text style={styles.nationality}>
          {standing.constructor.nationality}
        </Text>
      </View>

      {/* Points */}
      <View style={styles.pointsContainer}>
        <Text style={[styles.points, isLeader && styles.pointsLeader]}>
          {formatPoints(standing.points)}
        </Text>
        <Text style={styles.pointsLabel}>PTS</Text>
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 11,
  },
  constructorInfo: {
    flex: 1,
  },
  constructorName: {
    color: colors.textPrimary,
    fontFamily: fontFamily.heading,
    fontSize: 16,
  },
  nationality: {
    color: colors.textSecondary,
    fontFamily: fontFamily.body,
    fontSize: 12,
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    color: colors.textPrimary,
    fontFamily: fontFamily.mono,
    fontSize: 22,
  },
  pointsLeader: {
    color: colors.accent,
  },
  pointsLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.bodySemi,
    fontSize: 10,
    textTransform: 'uppercase',
  },
});

export default ConstructorRow;
