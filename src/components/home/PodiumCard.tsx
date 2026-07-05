import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RaceResult } from '@/types';
import { SurfaceCard, Flag, PositionBadge, DriverBadge } from '@/components/ui';
import { colors, fontFamily, getTeamColor } from '@/theme';

interface Props {
  raceName: string;
  country?: string;
  podium: RaceResult[];
}

export const PodiumCard: React.FC<Props> = ({ raceName, country, podium }) => {
  if (!podium || podium.length === 0) return null;

  return (
    <SurfaceCard>
      <View style={styles.headerRow}>
        <Text style={styles.raceName}>{raceName}</Text>
        {country ? <Flag country={country} width={28} /> : null}
      </View>

      <View style={styles.podiumRow}>
        {podium.map(result => {
          const teamColor = getTeamColor(result.constructor.name);
          const code =
            result.driver.code || result.driver.familyName.slice(0, 3).toUpperCase();
          const isFirst = result.position === '1';
          const isSecond = result.position === '2';
          const glowStyle = isFirst
            ? styles.glowGold
            : isSecond
            ? styles.glowSilver
            : styles.glowBronze;
          return (
            <View
              key={result.position}
              style={[styles.column, isFirst && styles.columnFirst]}
            >
              <PositionBadge position={result.position} />
              <View style={[styles.badgeWrap, glowStyle]}>
                <DriverBadge code={code} teamColor={teamColor} size={isFirst ? 52 : 44} />
              </View>
              <Text style={styles.familyName} numberOfLines={1}>
                {result.driver.familyName}
              </Text>
              <Text style={styles.teamName} numberOfLines={1}>
                {result.constructor.name}
              </Text>
            </View>
          );
        })}
      </View>
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  raceName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: fontFamily.heading,
  },
  podiumRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnFirst: {
    marginTop: -10,
  },
  badgeWrap: {
    marginTop: 8,
    marginBottom: 6,
  },
  glowGold: {
    shadowColor: colors.podiumGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  glowSilver: {
    shadowColor: colors.podiumSilver,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  glowBronze: {
    shadowColor: colors.podiumBronze,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  familyName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fontFamily.bodySemi,
    textAlign: 'center',
  },
  teamName: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default PodiumCard;
