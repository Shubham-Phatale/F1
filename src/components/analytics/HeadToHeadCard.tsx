import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
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
      <Text
        variant="titleLarge"
        style={[styles.value, isBetter ? styles.valueWinner : styles.valueNeutral]}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.driverName} numberOfLines={2}>
            {driver1Name}
          </Text>
          <Text variant="titleMedium" style={styles.vs}>
            VS
          </Text>
          <Text variant="titleMedium" style={[styles.driverName, styles.driverNameRight]} numberOfLines={2}>
            {driver2Name}
          </Text>
        </View>

        <Text variant="labelMedium" style={styles.subheader}>
          {comparison.racesMet} races met
          {comparison.draws > 0 ? ` · ${comparison.draws} draws` : ''}
        </Text>

        <Divider style={styles.divider} />

        {rows.map((row, index) => (
          <View key={row.label}>
            <View style={styles.row}>
              {renderValue(row.value1, row.value1 > row.value2)}
              <View style={styles.labelColumn}>
                <Text variant="labelSmall" style={styles.label}>
                  {row.label}
                </Text>
              </View>
              {renderValue(row.value2, row.value2 > row.value1)}
            </View>
            {index < rows.length - 1 && <Divider style={styles.rowDivider} />}
          </View>
        ))}

        {comparison.competitionYears.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <Text variant="labelSmall" style={styles.years}>
              Competed together: {comparison.competitionYears.join(', ')}
            </Text>
          </>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  driverName: {
    flex: 1,
    fontWeight: 'bold',
  },
  driverNameRight: {
    textAlign: 'right',
  },
  vs: {
    marginHorizontal: 12,
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  subheader: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  rowDivider: {
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
    color: '#666',
    textAlign: 'center',
  },
  value: {
    fontWeight: 'bold',
  },
  valueWinner: {
    color: '#2e7d32',
  },
  valueNeutral: {
    color: '#333',
  },
  years: {
    textAlign: 'center',
    color: '#666',
  },
});

export default HeadToHeadCard;
