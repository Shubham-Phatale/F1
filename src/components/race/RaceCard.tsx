import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Race } from '../../types';
import { formatDate, formatTime } from '../../utils/formatters';

interface RaceCardProps {
  race: Race;
  onPress?: () => void;
}

const RaceCard: React.FC<RaceCardProps> = ({ race, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          {/* Race Title */}
          <Text variant="titleLarge" style={styles.title}>
            {race.raceName}
          </Text>

          {/* First Row: Date and Circuit */}
          <View style={styles.row}>
            <View style={styles.infoBlock}>
              <Text variant="labelSmall" style={styles.label}>
                Date
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {formatDate(race.date)}
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <Text variant="labelSmall" style={styles.label}>
                Circuit
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {race.circuit?.circuitName ?? 'TBD'}
              </Text>
            </View>
          </View>

          {/* Second Row: Location and Time */}
          <View style={styles.row}>
            <View style={styles.infoBlock}>
              <Text variant="labelSmall" style={styles.label}>
                Location
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {race.circuit?.location
                  ? `${race.circuit.location.locality}, ${race.circuit.location.country}`
                  : 'Location TBD'}
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <Text variant="labelSmall" style={styles.label}>
                Time
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {formatTime(race.time)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 12,
  },
  infoBlock: {
    flex: 1,
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontWeight: '500',
  },
});

export default RaceCard;
