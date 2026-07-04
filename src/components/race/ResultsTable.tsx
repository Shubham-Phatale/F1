import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import { RaceResult } from '../../types';
import {
  formatPosition,
  formatDriverName,
  formatPoints,
  isRaceFinished,
  getRaceStatus,
} from '../../utils/formatters';

interface ResultsTableProps {
  results: RaceResult[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const renderRow = ({ item, index }: { item: RaceResult; index: number }) => {
    const finished = isRaceFinished(item.status);
    const statusColor = finished ? '#666' : '#2196f3';

    return (
      <>
        <View style={styles.row}>
          {/* Position */}
          <View style={styles.positionContainer}>
            <Text variant="bodyMedium" style={styles.position}>
              {formatPosition(item.position)}
            </Text>
          </View>

          {/* Driver Info */}
          <View style={styles.driverInfo}>
            <Text variant="bodyMedium" style={styles.driverName}>
              {formatDriverName(item.driver.givenName, item.driver.familyName)}
            </Text>
            <Text variant="labelSmall" style={styles.teamName}>
              {item.constructor.name}
            </Text>
          </View>

          {/* Race Stats */}
          <View style={styles.statsContainer}>
            {/* Laps */}
            <View style={styles.statItem}>
              <Text variant="labelSmall" style={styles.statLabel}>
                Laps
              </Text>
              <Text variant="bodyMedium" style={styles.statValue}>
                {item.laps}
              </Text>
            </View>

            {/* Points or Status */}
            <View style={styles.statusItem}>
              <Text
                variant="bodyMedium"
                style={[styles.statusValue, { color: statusColor, fontWeight: 'bold' }]}
              >
                {finished ? formatPoints(item.points) : getRaceStatus(item.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider - only if not the last item */}
        {index < results.length - 1 && <Divider />}
      </>
    );
  };

  return (
    <Card style={styles.card}>
      <FlatList
        data={results}
        renderItem={renderRow}
        keyExtractor={(_, index) => index.toString()}
        scrollEnabled={false}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  positionContainer: {
    width: 32,
    alignItems: 'center',
  },
  position: {
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teamName: {
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 40,
  },
  statLabel: {
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontWeight: '500',
  },
  statusItem: {
    alignItems: 'center',
    minWidth: 50,
  },
  statusValue: {
    textAlign: 'center',
  },
});

export default ResultsTable;
