import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PositionBadge, DriverBadge } from '@/components/ui';
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

export const MiniStandings: React.FC<Props> = ({ title, rows, onViewAll }) => {
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>{title}</Text>
        {onViewAll ? (
          <Pressable onPress={onViewAll} hitSlop={8} style={styles.viewAll}>
            <Text style={styles.viewAllText}>View all</Text>
            <MaterialIcons name="arrow-forward" size={15} color={colors.accent} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.list}>
        {rows.map(row => {
          const isLeader = row.emphasize;
          return (
            <View key={row.position} style={styles.row}>
              <PositionBadge position={row.position} />

              {row.badgeText ? (
                <DriverBadge code={row.badgeText} teamColor={row.teamColor} size={42} />
              ) : (
                <View
                  style={[styles.dot, { backgroundColor: row.teamColor ?? colors.surfaceRaised }]}
                />
              )}

              <View style={styles.info}>
                <Text style={styles.primary} numberOfLines={1}>
                  {row.primary}
                </Text>
                {row.secondary ? (
                  <Text style={styles.secondary} numberOfLines={1}>
                    {row.secondary}
                  </Text>
                ) : null}
              </View>

              <Text style={[styles.points, isLeader && styles.pointsLeader]}>
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
    paddingHorizontal: SCREEN_GUTTER,
    marginTop: 18,
    marginBottom: 8,
  },
  headerLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fontFamily.bodySemi,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: colors.accent,
    fontSize: 13,
    fontFamily: fontFamily.bodySemi,
  },
  list: {
    marginHorizontal: SCREEN_GUTTER,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  dot: {
    width: 42,
    height: 42,
    borderRadius: 11,
  },
  info: {
    flex: 1,
  },
  primary: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fontFamily.heading,
  },
  secondary: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fontFamily.body,
    marginTop: 2,
  },
  points: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: fontFamily.mono,
  },
  pointsLeader: {
    color: colors.accent,
  },
});

export default MiniStandings;
