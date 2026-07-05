import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DriverStanding } from '../../types';
import { formatDriverName, formatPoints } from '../../utils/formatters';
import { PositionBadge, DriverBadge, PressableScale } from '@/components/ui';
import { colors, fontFamily, getTeamColor } from '@/theme';

interface DriverRowProps {
  standing: DriverStanding;
  index: number;
  onPress?: () => void;
}

const DriverRow: React.FC<DriverRowProps> = ({ standing, onPress }) => {
  const teamName = standing.constructors[0]?.name ?? '';
  const teamColor = getTeamColor(teamName);
  const code =
    standing.driver.code || standing.driver.familyName.slice(0, 3).toUpperCase();
  const isLeader = standing.position === '1';

  return (
    <PressableScale style={styles.row} onPress={onPress} disabled={!onPress}>
      <PositionBadge position={standing.position} />

      <DriverBadge code={code} teamColor={teamColor} size={44} />

      {/* Driver Info */}
      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>
          {formatDriverName(standing.driver.givenName, standing.driver.familyName)}
        </Text>
        {standing.constructors.length > 0 && (
          <Text style={styles.constructorName}>
            {standing.constructors[0].name}
          </Text>
        )}
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
  driverInfo: {
    flex: 1,
  },
  driverName: {
    color: colors.textPrimary,
    fontFamily: fontFamily.heading,
    fontSize: 16,
  },
  constructorName: {
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

export default DriverRow;
