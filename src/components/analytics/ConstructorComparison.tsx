import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import StatCard from '../race/StatCard';
import { ConstructorStats } from '../../types';

interface ConstructorComparisonProps {
  stats: ConstructorStats;
  constructors?: ConstructorStats[];
}

const ConstructorComparison: React.FC<ConstructorComparisonProps> = ({ stats }) => {
  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <Text variant="titleLarge" style={styles.header}>
          {stats.constructor.name}
        </Text>
        <Text variant="labelLarge" style={styles.subheader}>
          Team Performance
        </Text>

        <View style={styles.grid}>
          <View style={styles.row}>
            <StatCard label="Races" value={stats.totalRaces} icon="flag-checkered" />
            <StatCard label="Points" value={stats.totalPoints} icon="star" />
          </View>
          <View style={styles.row}>
            <StatCard label="Wins" value={stats.totalWins} icon="trophy" variant="success" />
            <StatCard label="Podiums" value={stats.podiums} icon="podium" variant="success" />
          </View>
          <View style={styles.row}>
            <StatCard label="Poles" value={stats.polePositions} icon="timer-outline" />
            <StatCard label="Fastest Laps" value={stats.fastestLaps} icon="lightning-bolt" />
          </View>
          <View style={styles.row}>
            <StatCard
              label="Championships"
              value={stats.championships}
              icon="crown"
              variant="success"
            />
            <StatCard label="Drivers" value={stats.driverCount} icon="account-multiple" />
          </View>
          <View style={styles.row}>
            <StatCard
              label="Avg Driver Rating"
              value={stats.averageDriverRating.toFixed(1)}
              icon="chart-line"
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  content: {
    padding: 16,
  },
  header: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subheader: {
    color: '#666',
    marginBottom: 16,
  },
  grid: {
    marginHorizontal: -4,
  },
  row: {
    flexDirection: 'row',
  },
});

export default ConstructorComparison;
