import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { DriverStanding } from '../../types';
import { formatPosition, formatDriverName, formatPoints } from '../../utils/formatters';

interface DriverRowProps {
  standing: DriverStanding;
  index: number;
  onPress?: () => void;
}

const DriverRow: React.FC<DriverRowProps> = ({ standing, index, onPress }) => {
  return (
    <>
      <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
        {/* Position */}
        <View style={styles.positionContainer}>
          <Text variant="bodyMedium" style={styles.position}>
            {formatPosition(standing.position)}
          </Text>
        </View>

        {/* Driver Info */}
        <View style={styles.driverInfo}>
          <Text variant="bodyMedium" style={styles.driverName}>
            {formatDriverName(standing.driver.givenName, standing.driver.familyName)}
          </Text>
          {standing.constructors.length > 0 && (
            <Text variant="labelSmall" style={styles.constructorName}>
              {standing.constructors[0].name}
            </Text>
          )}
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
      </Pressable>

      {/* Divider - only if not the last item */}
      {index < 19 && <Divider />}
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
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontWeight: '500',
    marginBottom: 4,
  },
  constructorName: {
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

export default DriverRow;
