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
          return (
            <View key={result.position} style={styles.column}>
              <PositionBadge position={result.position} />
              <View style={styles.badgeWrap}>
                <DriverBadge code={code} teamColor={teamColor} size={44} />
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
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  badgeWrap: {
    marginTop: 8,
    marginBottom: 6,
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
