import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { ConstructorStanding } from '../../types';
import { formatPoints } from '../../utils/formatters';
import { PositionBadge, TeamColorBar } from '@/components/ui';
import { colors, fontFamily, getTeamColor } from '@/theme';

interface ConstructorRowProps {
  standing: ConstructorStanding;
  index: number;
  onPress?: () => void;
}

const ConstructorRow: React.FC<ConstructorRowProps> = ({ standing, index, onPress }) => {
  const teamColor = getTeamColor(standing.constructor.name);

  return (
    <>
      <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
        <PositionBadge position={standing.position} />

        <TeamColorBar color={teamColor} width={3} />

        {/* Constructor Info */}
        <View style={styles.constructorInfo}>
          <Text variant="bodyMedium" style={styles.constructorName}>
            {standing.constructor.name}
          </Text>
          <Text variant="labelSmall" style={styles.nationality}>
            {standing.constructor.nationality}
          </Text>
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
      </Pressable>

      {/* Divider - only if not the last item (max 10 constructors) */}
      {index < 9 && <View style={styles.divider} />}
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
  constructorInfo: {
    flex: 1,
  },
  constructorName: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bodySemi,
    marginBottom: 2,
  },
  nationality: {
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

export default ConstructorRow;
