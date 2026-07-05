import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchRacesByYear, setSelectedSeason } from '@/redux/slices/racesSlice';
import RaceCard from '@/components/race/RaceCard';
import { ScreenContainer, Skeleton } from '@/components/ui';
import { colors, fontFamily } from '@/theme';

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

  // Index of the first upcoming race (date >= today) to highlight
  const now = new Date();
  const nextUpcomingIndex = allRaces.findIndex(race => new Date(race.date) >= now);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>F1 Calendar</Text>
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
          <Text style={styles.raceCount}>{allRaces.length} races</Text>
        </View>
      )}

      {/* Loading State */}
      {loading && <Skeleton height={100} count={5} />}

      {/* Races List */}
      {!loading && allRaces.length > 0 && (
        <View>
          {allRaces.map((race, index) => (
            <RaceCard key={race.raceId} race={race} highlight={index === nextUpcomingIndex} />
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
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontFamily: fontFamily.heading,
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
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyStateContainer: {
    marginHorizontal: 16,
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  footer: {
    height: 20,
  },
});

export default CalendarScreen;
