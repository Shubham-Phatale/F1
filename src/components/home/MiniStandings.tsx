import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SectionHeader, PositionBadge, DriverBadge } from '@/components/ui';
import { colors, fontFamily, SCREEN_GUTTER } from '@/theme';

export interface MiniStandingRow {
  position: string;
  primary: string;
  secondary?: string;
  points: string;
  teamColor?: string;
  badgeText?: string;
  emphasize?: boolean;
}

interface Props {
  title: string;
  rows: MiniStandingRow[];
  onViewAll?: () => void;
  maxPoints?: number;
}

/** Ratio (0..1) of a row's points relative to the leader's points. */
export function barRatio(points: number, maxPoints: number): number {
  if (!Number.isFinite(points) || points <= 0) return 0;
  if (!Number.isFinite(maxPoints) || maxPoints <= 0) return 0;
  return Math.min(1, points / maxPoints);
}

function parsePoints(points: string): number {
  const parsed = parseFloat(points);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Hex team color at ~22% alpha for a subtle accent bar. */
function barColor(teamColor?: string): string {
  if (teamColor && /^#[0-9a-fA-F]{6}$/.test(teamColor)) {
    return `${teamColor}38`;
  }
  return `${colors.accent}38`;
}

const AnimatedBar: React.FC<{ ratio: number; color: string }> = ({ ratio, color }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(ratio, { duration: 600 });
  }, [ratio, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.bar, { backgroundColor: color }, animatedStyle]}
    />
  );
};

export const MiniStandings: React.FC<Props> = ({ title, rows, onViewAll, maxPoints }) => {
  const computedMax =
    maxPoints ?? rows.reduce((max, row) => Math.max(max, parsePoints(row.points)), 0);

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.headerTitle}>
          <SectionHeader title={title} />
        </View>
        {onViewAll ? (
          <Pressable onPress={onViewAll} hitSlop={8} style={styles.viewAll}>
            <Text style={styles.viewAllText}>View all →</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.list}>
        {rows.map(row => {
          const ratio = row.emphasize
            ? 1
            : barRatio(parsePoints(row.points), computedMax);
          return (
            <View
              key={row.position}
              style={[styles.row, row.emphasize && styles.rowEmphasized]}
            >
              <AnimatedBar ratio={ratio} color={barColor(row.teamColor)} />

              <PositionBadge position={row.position} />

              {row.badgeText ? (
                <DriverBadge code={row.badgeText} teamColor={row.teamColor} size={row.emphasize ? 40 : 34} />
              ) : (
                <View style={[styles.dot, { backgroundColor: row.teamColor ?? colors.surfaceRaised }]} />
              )}

              <View style={styles.info}>
                <Text
                  style={[styles.primary, row.emphasize && styles.primaryEmphasized]}
                  numberOfLines={1}
                >
                  {row.primary}
                </Text>
                {row.secondary ? (
                  <Text style={styles.secondary} numberOfLines={1}>
                    {row.secondary}
                  </Text>
                ) : null}
              </View>

              <Text style={[styles.points, row.emphasize && styles.pointsEmphasized]}>
                {row.points}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flex: 1,
  },
  viewAll: {
    paddingHorizontal: SCREEN_GUTTER,
    marginTop: 18,
    marginBottom: 8,
  },
  viewAllText: {
    color: colors.accent,
    fontSize: 12,
    fontFamily: fontFamily.bodySemi,
  },
  list: {
    marginHorizontal: SCREEN_GUTTER,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowEmphasized: {
    backgroundColor: colors.surfaceRaised,
    paddingVertical: 12,
  },
  bar: {
    ...StyleSheet.absoluteFillObject,
    right: undefined,
    borderRadius: 14,
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 9,
  },
  info: {
    flex: 1,
  },
  primary: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fontFamily.bodySemi,
  },
  primaryEmphasized: {
    fontSize: 16,
  },
  secondary: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fontFamily.body,
    marginTop: 2,
  },
  points: {
    color: colors.accent,
    fontSize: 16,
    fontFamily: fontFamily.heading,
    minWidth: 44,
    textAlign: 'right',
  },
  pointsEmphasized: {
    fontSize: 18,
  },
});

export default MiniStandings;
