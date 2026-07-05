import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SurfaceCard, StatCard } from '@/components/ui';
import { colors, fontFamily, getTeamColor } from '@/theme';
import { ConstructorStats } from '../../types';

interface ConstructorComparisonProps {
  stats: ConstructorStats;
  constructors?: ConstructorStats[];
}

const ConstructorComparison: React.FC<ConstructorComparisonProps> = ({ stats }) => {
  const teamColor = getTeamColor(stats.constructor.name);
  return (
    <SurfaceCard accentColor={teamColor}>
      <Text style={styles.header}>{stats.constructor.name}</Text>
      <Text style={styles.subheader}>Team Performance</Text>

      <View style={styles.grid}>
        <View style={styles.row}>
          <StatCard label="Races" value={stats.totalRaces} />
          <StatCard label="Points" value={stats.totalPoints} accent />
        </View>
        <View style={styles.row}>
          <StatCard label="Wins" value={stats.totalWins} />
          <StatCard label="Podiums" value={stats.podiums} />
        </View>
        <View style={styles.row}>
          <StatCard label="Poles" value={stats.polePositions} />
          <StatCard label="Fastest Laps" value={stats.fastestLaps} />
        </View>
        <View style={styles.row}>
          <StatCard label="Championships" value={stats.championships} />
          <StatCard label="Drivers" value={stats.driverCount} />
        </View>
        <View style={styles.row}>
          <StatCard label="Avg Driver Rating" value={stats.averageDriverRating.toFixed(1)} />
        </View>
      </View>
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  header: {
    color: colors.textPrimary,
    fontSize: 20,
    fontFamily: fontFamily.heading,
    marginBottom: 4,
  },
  subheader: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fontFamily.bodySemi,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});

export default ConstructorComparison;
