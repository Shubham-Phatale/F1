import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RaceResult } from '@/types';
import { SurfaceCard, FlagChip, DriverBadge } from '@/components/ui';
import { colors, fontFamily, radii, typeScale, getTeamColor } from '@/theme';

interface Props {
  raceName: string;
  country?: string;
  podium: RaceResult[];
  roundLabel?: string;
  onFullResults?: () => void;
}

type PodiumColor = string;

const STEP_HEIGHT: Record<string, number> = { '1': 58, '2': 42, '3': 30 };
const BADGE_SIZE: Record<string, number> = { '1': 52, '2': 46, '3': 46 };

function podiumColor(position: string): PodiumColor {
  if (position === '1') return colors.podiumGold;
  if (position === '2') return colors.podiumSilver;
  return colors.podiumBronze;
}

/** Convert a #rrggbb color to an rgba() string at the given alpha. */
function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const PodiumStep: React.FC<{ result: RaceResult }> = ({ result }) => {
  const isFirst = result.position === '1';
  const teamColor = getTeamColor(result.constructor.name);
  const code = result.driver.code || result.driver.familyName.slice(0, 3).toUpperCase();
  const accent = podiumColor(result.position);
  const height = STEP_HEIGHT[result.position] ?? 30;
  const badgeSize = BADGE_SIZE[result.position] ?? 46;

  return (
    <View style={[styles.column, isFirst && styles.columnFirst]}>
      <View style={styles.driverBlock}>
        {isFirst ? (
          <Ionicons name="trophy" size={16} color={colors.podiumGold} style={styles.crown} />
        ) : null}
        <View style={isFirst ? styles.badgeGlow : undefined}>
          <DriverBadge code={code} teamColor={teamColor} size={badgeSize} />
        </View>
        <Text style={styles.familyName} numberOfLines={1}>
          {result.driver.familyName}
        </Text>
        <Text style={styles.teamName} numberOfLines={1}>
          {result.constructor.name}
        </Text>
      </View>

      <View style={[styles.step, { height }, isFirst && styles.stepFirstGlow]}>
        <View style={[styles.stepAccent, { backgroundColor: accent }]} />
        <LinearGradient
          colors={[withAlpha(accent, 0.28), withAlpha(accent, 0)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
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
        {country ? <FlagChip country={country} width={34} /> : null}
      </View>

      <View style={styles.podiumRow}>
        {displayOrder.map(result => (
          <PodiumStep key={result.position} result={result} />
        ))}
      </View>

      {(fastest && fastestTime) || onFullResults ? (
        <>
          <View style={styles.footerDivider} />
          <View style={styles.footerRow}>
            {fastest && fastestTime ? (
              <View style={styles.fastestLap}>
                <Ionicons name="timer-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.fastestText}>
                  Fastest lap {fastestCode} {fastestTime}
                </Text>
              </View>
            ) : (
              <View />
            )}
            {onFullResults ? (
              <Pressable onPress={onFullResults} hitSlop={8}>
                <Text style={styles.fullResults}>Full results →</Text>
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
    gap: 10,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  raceName: {
    ...typeScale.h2,
    color: colors.textPrimary,
  },
  roundLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fontFamily.body,
    marginTop: 2,
  },
  podiumRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnFirst: {
    marginBottom: 0,
  },
  driverBlock: {
    alignItems: 'center',
    marginBottom: 8,
  },
  crown: {
    marginBottom: 2,
  },
  badgeGlow: {
    shadowColor: colors.podiumGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 10,
  },
  familyName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fontFamily.bodySemi,
    textAlign: 'center',
    marginTop: 8,
  },
  teamName: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fontFamily.body,
    textAlign: 'center',
    marginTop: 2,
  },
  step: {
    alignSelf: 'stretch',
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepFirstGlow: {
    shadowColor: colors.podiumGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  stepAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  rank: {
    fontSize: 22,
    fontFamily: fontFamily.mono,
  },
  footerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 16,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fastestLap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fastestText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fontFamily.mono,
  },
  fullResults: {
    color: colors.accent,
    fontSize: 12,
    fontFamily: fontFamily.bodySemi,
  },
});

export default PodiumCard;
