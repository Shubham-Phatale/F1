import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { DriverStanding } from '../../types';
import { formatDriverName, formatPoints } from '../../utils/formatters';
import { PositionBadge, DriverBadge, PressableScale } from '@/components/ui';
import { colors, fontFamily, getTeamColor } from '@/theme';

interface DriverRowProps {
  standing: DriverStanding;
  index: number;
  onPress?: () => void;
}

const DriverRow: React.FC<DriverRowProps> = ({ standing, index, onPress }) => {
  const teamName = standing.constructors[0]?.name ?? '';
  const teamColor = getTeamColor(teamName);
  const code =
    standing.driver.code || standing.driver.familyName.slice(0, 3).toUpperCase();

  return (
    <>
      <PressableScale style={styles.row} onPress={onPress} disabled={!onPress}>
        <PositionBadge position={standing.position} />

        <DriverBadge code={code} teamColor={teamColor} size={40} />

        {/* Driver Info */}
        <View style={styles.driverInfo}>
          <Text variant="bodyMedium" style={styles.driverName}>
            {formatDriverName(standing.driver.givenName, standing.driver.familyName)}
          </Text>
          {standing.constructors.length > 0 && (
            <Text variant="labelSmall" style={styles.constructorName}>
              {standing.constructors[0].name}
            </Text>
          )}
        </View>

        {/* Points */}
        <View style={styles.pointsContainer}>
          <Text variant="bodyMedium" style={styles.points}>
            {formatPoints(standing.points)}
          </Text>
          <Text variant="labelSmall" style={styles.pointsLabel}>
            PTS
          </Text>
        </View>
      </PressableScale>

      {/* Divider - only if not the last item */}
      {index < 19 && <View style={styles.divider} />}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bodySemi,
    marginBottom: 2,
  },
  constructorName: {
    color: colors.textSecondary,
    fontFamily: fontFamily.body,
  },
  pointsContainer: {
    alignItems: 'flex-end',
    minWidth: 48,
  },
  points: {
    color: colors.textPrimary,
    fontFamily: fontFamily.heading,
    fontSize: 16,
  },
  pointsLabel: {
    color: colors.textMuted,
    letterSpacing: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
});

export default DriverRow;
