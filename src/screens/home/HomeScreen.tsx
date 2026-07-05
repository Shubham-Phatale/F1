import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCurrentSeason, fetchRacesByYear } from '@/redux/slices/racesSlice';
import { fetchStandings } from '@/redux/slices/standingsSlice';
import RaceCard from '@/components/race/RaceCard';
import {
  ScreenContainer,
  SectionHeader,
  SurfaceCard,
  StatCard,
  DriverBadge,
  Skeleton,
} from '@/components/ui';
import { colors, fontFamily, getTeamColor } from '@/theme';
import { formatPosition, formatPoints } from '@/utils/formatters';

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
    <ScreenContainer>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>F1 2026</Text>
        <Text style={styles.subtitle}>
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
      <SectionHeader title="Latest Race" />
      {isLoading ? (
        <Skeleton height={120} count={1} />
      ) : latestRace ? (
        <RaceCard race={latestRace} />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No races available</Text>
        </View>
      )}

      {/* Championship Leader Section */}
      <SectionHeader title="Championship Leader" />
      {isLoading ? (
        <Skeleton height={100} count={3} />
      ) : championshipLeader ? (
        <SurfaceCard>
          <View style={styles.leaderRow}>
            <DriverBadge
              code={
                championshipLeader.driver.code ||
                championshipLeader.driver.familyName.slice(0, 3).toUpperCase()
              }
              teamColor={getTeamColor(championshipLeader.constructors[0]?.name ?? '')}
            />
            <View style={styles.leaderInfo}>
              <Text style={styles.driverName}>
                {championshipLeader.driver.givenName} {championshipLeader.driver.familyName}
              </Text>
              <Text style={styles.driverTeam}>
                {championshipLeader.constructors[0]?.name ?? 'Team TBD'}
              </Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <StatCard label="Position" value={formatPosition(championshipLeader.position)} accent />
            <StatCard label="Points" value={formatPoints(championshipLeader.points)} />
            <StatCard label="Wins" value={championshipLeader.wins} />
          </View>
        </SurfaceCard>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No standings available</Text>
        </View>
      )}

      {/* Footer spacer */}
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
  mainTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontFamily: fontFamily.heading,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  errorText: {
    color: colors.accent,
    fontSize: 14,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leaderInfo: {
    flex: 1,
  },
  driverName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fontFamily.bodySemi,
  },
  driverTeam: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
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

export default HomeScreen;
