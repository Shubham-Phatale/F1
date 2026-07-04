import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import { QualifyingResult } from '../../types';
import { formatDriverName, formatPosition } from '../../utils/formatters';

interface LapTimeTableProps {
  results: QualifyingResult[];
  title?: string;
}

const LapTimeTable: React.FC<LapTimeTableProps> = ({
  results,
  title = 'Qualifying Results',
}) => {
  const renderRow = ({ item, index }: { item: QualifyingResult; index: number }) => {
    // Get best lap time: Q3 > Q2 > Q1
    const bestLapTime = item.q3 || item.q2 || item.q1 || '--:--';

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

          {/* Best Lap Time */}
          <View style={styles.timeContainer}>
            <Text variant="bodyMedium" style={styles.lapTime}>
              {bestLapTime}
            </Text>
          </View>
        </View>

        {/* Divider - only if not the last item */}
        {index < results.length - 1 && <Divider />}
      </>
    );
  };

  return (
    <Card style={styles.card}>
      {/* Card Title */}
      <Card.Title
        title={title}
        titleVariant="titleMedium"
        style={styles.cardTitle}
        titleStyle={styles.cardTitleText}
      />

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
  cardTitle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  timeContainer: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  lapTime: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
});

export default LapTimeTable;
