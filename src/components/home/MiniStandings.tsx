import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
}

export const MiniStandings: React.FC<Props> = ({ title, rows, onViewAll }) => (
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
      {rows.map(row => (
        <View
          key={row.position}
          style={[styles.row, row.emphasize && styles.rowEmphasized]}
        >
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
      ))}
    </View>
  </View>
);

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
