import React, { useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCurrentSeason, fetchRacesByYear } from '@/redux/slices/racesSlice';
import { fetchStandings } from '@/redux/slices/standingsSlice';
import RaceCard from '@/components/race/RaceCard';
import StatCard from '@/components/race/StatCard';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import { formatDate, formatPosition, formatPoints } from '@/utils/formatters';

const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  // Get races state
  const racesState = useAppSelector(state => state.races);
  const { selectedSeason, allRaces, loading: racesLoading, error: racesError } = racesState;

  // Get standings state
  const standingsState = useAppSelector(state => state.standings);
  const { driverStandings, loading: standingsLoading, error: standingsError } = standingsState;

  // Fetch current season on component mount
  useEffect(() => {
    dispatch(fetchCurrentSeason());
  }, [dispatch]);

  // Fetch races when season changes
  useEffect(() => {
    if (selectedSeason) {
      dispatch(fetchRacesByYear(selectedSeason));
    }
  }, [selectedSeason, dispatch]);

  // Fetch standings when season changes
  useEffect(() => {
    if (selectedSeason) {
      dispatch(fetchStandings({ season: selectedSeason }));
    }
  }, [selectedSeason, dispatch]);

  // Determine if loading
  const isLoading = racesLoading || standingsLoading;

  // Get latest race (first race in the list)
  const latestRace = allRaces && allRaces.length > 0 ? allRaces[0] : null;

  // Get championship leader (first standing)
  const championshipLeader =
    driverStandings && driverStandings.length > 0 ? driverStandings[0] : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.mainTitle}>
          F1 2026
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {selectedSeason ? `Season ${selectedSeason}` : 'Loading season...'}
        </Text>
      </View>

      {/* Error Message */}
      {(racesError || standingsError) && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{racesError || standingsError}</Text>
        </View>
      )}

      {/* Latest Race Section */}
      <View style={styles.sectionContainer}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Latest Race
        </Text>

        {isLoading ? (
          <SkeletonLoader height={200} count={1} />
        ) : latestRace ? (
          <RaceCard race={latestRace} />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No races available</Text>
          </View>
        )}
      </View>

      {/* Championship Leader Section */}
      <View style={styles.sectionContainer}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Championship Leader
        </Text>

        {isLoading ? (
          <SkeletonLoader height={100} count={3} />
        ) : championshipLeader ? (
          <View>
            {/* Driver Name Card */}
            <View style={styles.driverNameCard}>
              <Text variant="titleMedium" style={styles.driverName}>
                {championshipLeader.driver.givenName} {championshipLeader.driver.familyName}
              </Text>
              <Text variant="bodyMedium" style={styles.driverTeam}>
                {championshipLeader.constructors[0]?.name || 'Team TBD'}
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                label="Position"
                value={formatPosition(championshipLeader.position)}
                icon="trophy"
                variant="success"
              />
              <StatCard
                label="Points"
                value={formatPoints(championshipLeader.points)}
                icon="star"
                variant="default"
              />
              <StatCard
                label="Wins"
                value={championshipLeader.wins}
                icon="flag-checkered"
                variant="warning"
              />
            </View>
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No standings available</Text>
          </View>
        )}
      </View>

      {/* Footer spacer */}
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
  mainTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  sectionContainer: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  driverNameCard: {
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  driverName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  driverTeam: {
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 12,
    gap: 8,
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

export default HomeScreen;
