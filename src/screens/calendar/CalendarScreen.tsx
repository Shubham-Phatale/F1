import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchRacesByYear, setSelectedSeason } from '@/redux/slices/racesSlice';
import RaceCard from '@/components/race/RaceCard';
import SkeletonLoader from '@/components/common/SkeletonLoader';

const CalendarScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  // Get races state from Redux
  const { selectedSeason, allRaces, loading } = useAppSelector(state => state.races);

  // Local state for display season
  const [displaySeason, setDisplaySeason] = useState<string>(selectedSeason);

  // Handle season change
  useEffect(() => {
    setDisplaySeason(selectedSeason);
  }, [selectedSeason]);

  // Fetch races when display season changes
  useEffect(() => {
    if (displaySeason) {
      dispatch(fetchRacesByYear(displaySeason));
      dispatch(setSelectedSeason(displaySeason));
    }
  }, [displaySeason, dispatch]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          F1 Calendar
        </Text>
      </View>

      {/* Season Selector */}
      <View style={styles.seasonSelectorContainer}>
        <SegmentedButtons
          value={displaySeason}
          onValueChange={setDisplaySeason}
          buttons={[
            { value: '2024', label: '2024' },
            { value: '2025', label: '2025' },
            { value: '2026', label: '2026' },
          ]}
          style={styles.seasonSelector}
        />
      </View>

      {/* Race Count */}
      {!loading && (
        <View style={styles.raceCountContainer}>
          <Text variant="bodySmall" style={styles.raceCount}>
            {allRaces.length} races
          </Text>
        </View>
      )}

      {/* Loading State */}
      {loading && <SkeletonLoader height={200} count={5} />}

      {/* Races List */}
      {!loading && allRaces.length > 0 && (
        <View>
          {allRaces.map(race => (
            <RaceCard key={race.raceId} race={race} />
          ))}
        </View>
      )}

      {/* Empty State */}
      {!loading && allRaces.length === 0 && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No races found for this season</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontWeight: 'bold',
  },
  seasonSelectorContainer: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  seasonSelector: {
    alignSelf: 'center',
  },
  raceCountContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  raceCount: {
    color: '#666',
  },
  emptyStateContainer: {
    marginHorizontal: 16,
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#999',
    fontSize: 14,
  },
  footer: {
    height: 20,
  },
});

export default CalendarScreen;
