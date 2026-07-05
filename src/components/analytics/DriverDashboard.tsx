import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SurfaceCard, StatCard } from '@/components/ui';
import { colors, fontFamily } from '@/theme';
import { DriverStats } from '../../types';

interface DriverDashboardProps {
  stats: DriverStats;
  driverName?: string;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ stats, driverName }) => {
  return (
    <SurfaceCard>
      {driverName ? <Text style={styles.header}>{driverName}</Text> : null}
      <Text style={styles.subheader}>Career Performance</Text>

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
          <StatCard label="Avg Finish" value={stats.averageFinish.toFixed(1)} />
        </View>
        <View style={styles.row}>
          <StatCard label="Best Finish" value={`P${stats.bestFinish}`} />
          <StatCard label="Worst Finish" value={`P${stats.worstFinish}`} />
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

export default DriverDashboard;
