import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { RaceResult } from '../../types';
import {
  formatDriverName,
  formatPoints,
  isRaceFinished,
  getRaceStatus,
} from '../../utils/formatters';
import { SurfaceCard, PositionBadge } from '@/components/ui';
import { colors, fontFamily } from '@/theme';

interface ResultsTableProps {
  results: RaceResult[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const renderRow = ({ item }: { item: RaceResult; index: number }) => {
    const finished = isRaceFinished(item.status);
    const hasFastestLap = item.fastestLap?.rank === '1';

    return (
      <View style={styles.row}>
        {/* Position */}
        <PositionBadge position={item.position} />

        {/* Driver Info */}
        <View style={styles.driverInfo}>
          <Text
            style={[styles.driverName, hasFastestLap && { color: colors.positive }]}
            numberOfLines={1}
          >
            {formatDriverName(item.driver.givenName, item.driver.familyName)}
          </Text>
          <Text style={styles.teamName} numberOfLines={1}>
            {item.constructor.name}
          </Text>
        </View>

        {/* Points / Status */}
        <View style={styles.statusContainer}>
          <Text
            style={[styles.statusValue, { color: finished ? colors.textPrimary : colors.accent }]}
          >
            {finished ? formatPoints(item.points) : getRaceStatus(item.status)}
          </Text>
          <Text style={styles.lapsLabel}>{item.laps} laps</Text>
        </View>
      </View>
    );
  };

  return (
    <SurfaceCard style={styles.card}>
      <FlatList
        data={results}
        renderItem={renderRow}
        keyExtractor={(_, index) => index.toString()}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SurfaceCard>
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
  statusContainer: {
    alignItems: 'flex-end',
    minWidth: 56,
  },
  statusValue: {
    fontSize: 14,
    fontFamily: fontFamily.heading,
  },
  lapsLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fontFamily.body,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});

export default ResultsTable;
