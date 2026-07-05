import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SurfaceCard, DriverBadge } from '@/components/ui';
import { colors, fontFamily, getTeamColor } from '@/theme';
import { HeadToHeadComparison } from '../../types';

interface HeadToHeadCardProps {
  comparison: HeadToHeadComparison;
}

interface ComparisonRow {
  label: string;
  value1: number;
  value2: number;
}

const HeadToHeadCard: React.FC<HeadToHeadCardProps> = ({ comparison }) => {
  const driver1Name = `${comparison.driver1.givenName} ${comparison.driver1.familyName}`;
  const driver2Name = `${comparison.driver2.givenName} ${comparison.driver2.familyName}`;

  const code1 =
    comparison.driver1.code || comparison.driver1.familyName.slice(0, 3).toUpperCase();
  const code2 =
    comparison.driver2.code || comparison.driver2.familyName.slice(0, 3).toUpperCase();

  const rows: ComparisonRow[] = [
    {
      label: 'Head-to-Head Wins',
      value1: comparison.driver1Wins,
      value2: comparison.driver2Wins,
    },
    {
      label: 'Pole Positions',
      value1: comparison.driver1PolePositions,
      value2: comparison.driver2PolePositions,
    },
    {
      label: 'Fastest Laps',
      value1: comparison.driver1FastestLaps,
      value2: comparison.driver2FastestLaps,
    },
  ];

  const renderValue = (value: number, isBetter: boolean) => (
    <View style={styles.valueColumn}>
      <Text style={[styles.value, isBetter ? styles.valueWinner : styles.valueNeutral]}>
        {value}
      </Text>
    </View>
  );

  return (
    <SurfaceCard>
      <View style={styles.header}>
        <View style={styles.driverHeader}>
          <DriverBadge code={code1} teamColor={getTeamColor(comparison.driver1.nationality)} />
          <Text style={styles.driverName} numberOfLines={2}>
            {driver1Name}
          </Text>
        </View>
        <Text style={styles.vs}>VS</Text>
        <View style={[styles.driverHeader, styles.driverHeaderRight]}>
          <Text style={[styles.driverName, styles.driverNameRight]} numberOfLines={2}>
            {driver2Name}
          </Text>
          <DriverBadge code={code2} teamColor={getTeamColor(comparison.driver2.nationality)} />
        </View>
      </View>

      <Text style={styles.subheader}>
        {comparison.racesMet} races met
        {comparison.draws > 0 ? ` · ${comparison.draws} draws` : ''}
      </Text>

      <View style={styles.divider} />

      {rows.map((row, index) => (
        <View key={row.label}>
          <View style={styles.row}>
            {renderValue(row.value1, row.value1 > row.value2)}
            <View style={styles.labelColumn}>
              <Text style={styles.label}>{row.label}</Text>
            </View>
            {renderValue(row.value2, row.value2 > row.value1)}
          </View>
          {index < rows.length - 1 && <View style={styles.rowDivider} />}
        </View>
      ))}

      {comparison.competitionYears.length > 0 && (
        <>
          <View style={styles.divider} />
          <Text style={styles.years}>
            Competed together: {comparison.competitionYears.join(', ')}
          </Text>
        </>
      )}
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  driverHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driverHeaderRight: {
    justifyContent: 'flex-end',
  },
  driverName: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
  },
  driverNameRight: {
    textAlign: 'right',
  },
  vs: {
    marginHorizontal: 12,
    color: colors.accent,
    fontFamily: fontFamily.heading,
    fontSize: 16,
  },
  subheader: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  valueColumn: {
    flex: 1,
    alignItems: 'center',
  },
  labelColumn: {
    flex: 2,
    alignItems: 'center',
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  value: {
    fontFamily: fontFamily.heading,
    fontSize: 20,
  },
  valueWinner: {
    color: colors.accent,
  },
  valueNeutral: {
    color: colors.textSecondary,
  },
  years: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
  },
});

export default HeadToHeadCard;
