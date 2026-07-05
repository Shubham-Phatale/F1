import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCurrentSeason, fetchRacesByYear } from '@/redux/slices/racesSlice';
import { fetchStandings } from '@/redux/slices/standingsSlice';
import { ergastService } from '@/services/ergastAPI';
import { Race, RaceResult } from '@/types';
import { getRaceLockTime } from '@/utils/predictionRules';
import { NextRaceCard } from '@/components/home/NextRaceCard';
import { PodiumCard } from '@/components/home/PodiumCard';
import { MiniStandings, MiniStandingRow } from '@/components/home/MiniStandings';
import { ScreenContainer, SectionHeader, Skeleton } from '@/components/ui';
import { colors, fontFamily, getTeamColor } from '@/theme';
import { formatPoints } from '@/utils/formatters';

const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<BottomTabNavigationProp<HomeTabParamList>>();

  // Get races state
  const racesState = useAppSelector(state => state.races);
  const { selectedSeason, allRaces, loading: racesLoading, error: racesError } = racesState;

  // Get standings state
  const standingsState = useAppSelector(state => state.standings);
  const {
    driverStandings,
    constructorStandings,
    loading: standingsLoading,
    error: standingsError,
  } = standingsState;

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

  const isLoading = racesLoading || standingsLoading;

  // Next race = the first upcoming race whose prediction lock time is in the future.
  const nextRace: Race | null = (() => {
    if (!allRaces || allRaces.length === 0) return null;
    const now = Date.now();
    return allRaces.find(r => getRaceLockTime(r.date, r.time) > now) ?? null;
  })();

  // Last race = the most recent race that has already happened; fall back to the
  // last scheduled race so something always shows.
  const lastRace: Race | null = (() => {
    if (!allRaces || allRaces.length === 0) return null;
    const now = Date.now();
    const past = allRaces.filter(r => new Date(r.date).getTime() <= now);
    if (past.length > 0) return past[past.length - 1];
    return allRaces[allRaces.length - 1];
  })();

  // Podium for the last race, fetched locally.
  const [podium, setPodium] = useState<RaceResult[]>([]);
  const [podiumLoading, setPodiumLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!lastRace || !selectedSeason) {
      setPodium([]);
      return;
    }
    setPodiumLoading(true);
    ergastService
      .getRaceResults(selectedSeason, lastRace.round)
      .then(results => {
        if (!alive) return;
        const top3 = results
          .filter(r => ['1', '2', '3'].includes(r.position))
          .sort((a, b) => Number(a.position) - Number(b.position));
        setPodium(top3);
      })
      .catch(() => {
        if (alive) setPodium([]);
      })
      .finally(() => {
        if (alive) setPodiumLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastRace?.round, selectedSeason]);

  // Build MiniStandings rows.
  const driverRows: MiniStandingRow[] = driverStandings.slice(0, 5).map((s, i) => {
    const teamName = s.constructors[0]?.name;
    const code = s.driver.code || s.driver.familyName.slice(0, 3).toUpperCase();
    const primary = s.driver.givenName
      ? `${s.driver.givenName.charAt(0)}. ${s.driver.familyName}`
      : s.driver.familyName;
    return {
      position: s.position,
      primary,
      secondary: teamName,
      points: formatPoints(s.points),
      teamColor: getTeamColor(teamName ?? ''),
      badgeText: code,
      emphasize: i === 0,
    };
  });

  const constructorRows: MiniStandingRow[] = constructorStandings.slice(0, 5).map((s, i) => ({
    position: s.position,
    primary: s.constructor.name,
    secondary: s.constructor.nationality,
    points: formatPoints(s.points),
    teamColor: getTeamColor(s.constructor.name),
    emphasize: i === 0,
  }));

  const goToStandings = () => navigation.navigate('Standings');

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

      {/* Up Next */}
      <SectionHeader title="Up Next" />
      {isLoading ? (
        <Skeleton height={140} count={1} />
      ) : nextRace ? (
        <NextRaceCard race={nextRace} />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No upcoming races</Text>
        </View>
      )}

      {/* Last Race */}
      <SectionHeader title="Last Race" />
      {podiumLoading ? (
        <Skeleton height={120} count={1} />
      ) : podium.length > 0 && lastRace ? (
        <PodiumCard
          raceName={lastRace.raceName}
          country={lastRace.circuit?.location?.country}
          podium={podium}
        />
      ) : null}

      {/* Drivers Championship */}
      {driverRows.length > 0 && (
        <MiniStandings
          title="Drivers Championship"
          rows={driverRows}
          onViewAll={goToStandings}
        />
      )}

      {/* Constructors Championship */}
      {constructorRows.length > 0 && (
        <MiniStandings
          title="Constructors Championship"
          rows={constructorRows}
          onViewAll={goToStandings}
        />
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
