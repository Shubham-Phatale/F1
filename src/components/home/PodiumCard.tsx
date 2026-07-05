import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { RaceResult } from '@/types';
import { SurfaceCard, FlagChip, DriverBadge } from '@/components/ui';
import { colors, fontFamily, getTeamColor } from '@/theme';

interface Props {
  raceName: string;
  country?: string;
  podium: RaceResult[];
  roundLabel?: string;
  onFullResults?: () => void;
}

const STEP_HEIGHT: Record<string, number> = { '1': 58, '2': 42, '3': 30 };
const BADGE_SIZE: Record<string, number> = { '1': 60, '2': 52, '3': 52 };

function podiumColor(position: string): string {
  if (position === '1') return colors.podiumGold;
  if (position === '2') return colors.podiumSilver;
  return colors.podiumBronze;
}

/** Vertical gradient stops for a podium step by position. */
function stepGradient(position: string): [string, string] {
  const color = podiumColor(position);
  const top = position === '1' ? 0.2 : 0.16;
  const bottom = position === '1' ? 0.03 : 0.02;
  return [withAlpha(color, top), withAlpha(color, bottom)];
}

/** Convert a #rrggbb color to an rgba() string at the given alpha. */
function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const PodiumColumn: React.FC<{ result: RaceResult }> = ({ result }) => {
  const isFirst = result.position === '1';
  const teamColor = getTeamColor(result.constructor.name);
  const code = result.driver.code || result.driver.familyName.slice(0, 3).toUpperCase();
  const accent = podiumColor(result.position);
  const height = STEP_HEIGHT[result.position] ?? 30;
  const badgeSize = BADGE_SIZE[result.position] ?? 52;

  return (
    <View style={styles.column}>
      {isFirst ? (
        <MaterialCommunityIcons name="crown" size={18} color={colors.podiumGold} />
      ) : null}
      <DriverBadge code={code} teamColor={teamColor} size={badgeSize} />
      <Text style={styles.familyName} numberOfLines={1}>
        {result.driver.familyName}
      </Text>
      <Text style={styles.teamName} numberOfLines={1}>
        {result.constructor.name}
      </Text>

      <View style={[styles.step, { height }]}>
        <LinearGradient
          colors={stepGradient(result.position)}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.stepAccent, { backgroundColor: accent }]} />
        <Text style={[styles.rank, { color: accent }]}>{result.position}</Text>
      </View>
    </View>
  );
};

export const PodiumCard: React.FC<Props> = ({
  raceName,
  country,
  podium,
  roundLabel,
  onFullResults,
}) => {
  if (!podium || podium.length === 0) return null;

  const byPosition = (pos: string) => podium.find(r => r.position === pos);
  // Visual order: P2 · P1 · P3 (winner centered).
  const displayOrder = ['2', '1', '3']
    .map(byPosition)
    .filter((r): r is RaceResult => Boolean(r));

  // Fastest lap = the result whose fastestLap.rank === '1'. Hidden if none.
  const fastest = podium.find(r => r.fastestLap?.rank === '1');
  const fastestCode = fastest
    ? fastest.driver.code || fastest.driver.familyName.slice(0, 3).toUpperCase()
    : null;
  const fastestTime = fastest?.fastestLap?.time?.time;
  const hasFastest = Boolean(fastest && fastestTime);

  return (
    <SurfaceCard>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.raceName} numberOfLines={1}>
            {raceName}
          </Text>
          {roundLabel ? (
            <Text style={styles.roundLabel} numberOfLines={1}>
              {roundLabel}
            </Text>
          ) : null}
        </View>
        {country ? <FlagChip country={country} width={40} /> : null}
      </View>

      <View style={styles.podiumRow}>
        {displayOrder.map(result => (
          <PodiumColumn key={result.position} result={result} />
        ))}
      </View>

      {hasFastest || onFullResults ? (
        <>
          <View style={styles.footerDivider} />
          <View style={styles.footerRow}>
            {hasFastest ? (
              <View style={styles.fastestLap}>
                <MaterialIcons name="timer" size={16} color={colors.textSecondary} />
                <Text style={styles.fastestText}>
                  Fastest lap{' '}
                  <Text style={styles.fastestCode}>{fastestCode}</Text>{' '}
                  <Text style={styles.fastestTime}>{fastestTime}</Text>
                </Text>
              </View>
            ) : (
              <View />
            )}
            {onFullResults ? (
              <Pressable onPress={onFullResults} hitSlop={8} style={styles.fullResultsBtn}>
                <Text style={styles.fullResults}>Full results</Text>
                <MaterialIcons name="arrow-forward" size={15} color={colors.accent} />
              </Pressable>
            ) : null}
          </View>
        </>
      ) : null}
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  raceName: {
    color: colors.textPrimary,
    fontSize: 19,
    fontFamily: fontFamily.heading,
    letterSpacing: -0.2,
  },
  roundLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fontFamily.body,
    marginTop: 3,
  },
  podiumRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
    marginTop: 18,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  familyName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fontFamily.heading,
    textAlign: 'center',
  },
  teamName: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fontFamily.body,
    textAlign: 'center',
  },
  step: {
    width: '100%',
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    marginTop: 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepAccent: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 3,
    borderRadius: 2,
  },
  rank: {
    fontSize: 19,
    fontFamily: fontFamily.mono,
  },
  footerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
  },
  fastestLap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  fastestText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fontFamily.body,
  },
  fastestCode: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bodySemi,
  },
  fastestTime: {
    color: colors.textPrimary,
    fontFamily: fontFamily.mono,
  },
  fullResultsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fullResults: {
    color: colors.accent,
    fontSize: 13,
    fontFamily: fontFamily.bodySemi,
  },
});

export default PodiumCard;
