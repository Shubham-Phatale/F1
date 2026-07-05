import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { QualifyingResult } from '../../types';
import { formatDriverName } from '../../utils/formatters';
import { SurfaceCard, PositionBadge, SectionHeader } from '@/components/ui';
import { colors, fontFamily } from '@/theme';

interface LapTimeTableProps {
  results: QualifyingResult[];
  title?: string;
}

const LapTimeTable: React.FC<LapTimeTableProps> = ({ results, title = 'Qualifying Results' }) => {
  const renderRow = ({ item }: { item: QualifyingResult; index: number }) => {
    // Get best lap time: Q3 > Q2 > Q1
    const bestLapTime = item.q3 || item.q2 || item.q1 || '--:--';

    return (
      <View style={styles.row}>
        {/* Position */}
        <PositionBadge position={item.position} />

        {/* Driver Info */}
        <View style={styles.driverInfo}>
          <Text style={styles.driverName} numberOfLines={1}>
            {formatDriverName(item.driver.givenName, item.driver.familyName)}
          </Text>
          <Text style={styles.teamName} numberOfLines={1}>
            {item.constructor.name}
          </Text>
        </View>

        {/* Best Lap Time */}
        <Text style={styles.lapTime}>{bestLapTime}</Text>
      </View>
    );
  };

  return (
    <View>
      <SectionHeader title={title} />
      <SurfaceCard style={styles.card}>
        <FlatList
          data={results}
          renderItem={renderRow}
          keyExtractor={(_, index) => index.toString()}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </SurfaceCard>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fontFamily.bodySemi,
  },
  teamName: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fontFamily.body,
    marginTop: 2,
  },
  lapTime: {
    color: colors.accent,
    fontSize: 14,
    fontFamily: fontFamily.heading,
    minWidth: 70,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});

export default LapTimeTable;
