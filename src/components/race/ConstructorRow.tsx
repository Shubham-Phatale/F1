import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { ConstructorStanding } from '../../types';
import { formatPosition, formatPoints } from '../../utils/formatters';

interface ConstructorRowProps {
  standing: ConstructorStanding;
  index: number;
}

const ConstructorRow: React.FC<ConstructorRowProps> = ({ standing, index }) => {
  return (
    <>
      <View style={styles.row}>
        {/* Position */}
        <View style={styles.positionContainer}>
          <Text variant="bodyMedium" style={styles.position}>
            {formatPosition(standing.position)}
          </Text>
        </View>

        {/* Constructor Info */}
        <View style={styles.constructorInfo}>
          <Text variant="bodyMedium" style={styles.constructorName}>
            {standing.constructor.name}
          </Text>
          <Text variant="labelSmall" style={styles.nationality}>
            {standing.constructor.nationality}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text variant="labelSmall" style={styles.statLabel}>
              W
            </Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {standing.wins}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="labelSmall" style={styles.statLabel}>
              Pts
            </Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {formatPoints(standing.points)}
            </Text>
          </View>
        </View>
      </View>

      {/* Divider - only if not the last item (max 10 constructors) */}
      {index < 9 && <Divider />}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  positionContainer: {
    width: 40,
    alignItems: 'center',
  },
  position: {
    fontWeight: 'bold',
  },
  constructorInfo: {
    flex: 1,
  },
  constructorName: {
    fontWeight: '500',
    marginBottom: 4,
  },
  nationality: {
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 35,
  },
  statLabel: {
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontWeight: '500',
  },
});

export default ConstructorRow;
