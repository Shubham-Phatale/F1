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
import { ScreenContainer, SectionHeader, Skeleton, Reveal } from '@/components/ui';
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
  }, [lastRace?.round, selectedSeason]);

  // Build MiniStandings rows. Home shows a 2-row preview per the redesign.
  const driverRows: MiniStandingRow[] = driverStandings.slice(0, 2).map((s, i) => {
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

  const goToStandings = () => navigation.navigate('Standings');

  const goToFullResults = () => {
    if (!lastRace || !selectedSeason) return;
    navigation.navigate('RaceDetails', {
      raceId: lastRace.raceId,
      season: selectedSeason,
      round: lastRace.round,
    });
  };

  const lastRoundLabel = lastRace
    ? `Round ${lastRace.round} · ${lastRace.circuit?.circuitName ?? lastRace.raceName}`
    : undefined;

  return (
    <ScreenContainer>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>F1 2026</Text>
        <Text style={styles.subtitle}>
          {selectedSeason ? `SEASON ${selectedSeason}` : 'LOADING SEASON…'}
        </Text>
      </View>

      {/* Error Message */}
      {(racesError || standingsError) && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{racesError || standingsError}</Text>
        </View>
      )}

      {/* Up Next */}
      <Reveal index={0}>
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
      </Reveal>

      {/* Last Race */}
      <Reveal index={1}>
        <SectionHeader title="Last Race" />
        {podiumLoading ? (
          <Skeleton height={120} count={1} />
        ) : podium.length > 0 && lastRace ? (
          <PodiumCard
            raceName={lastRace.raceName}
            country={lastRace.circuit?.location?.country}
            podium={podium}
            roundLabel={lastRoundLabel}
            onFullResults={goToFullResults}
          />
        ) : null}
      </Reveal>

      {/* Drivers Championship */}
      {driverRows.length > 0 && (
        <Reveal index={2}>
          <MiniStandings
            title="Drivers Championship"
            rows={driverRows}
            onViewAll={goToStandings}
          />
        </Reveal>
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
    fontSize: 32,
    fontFamily: fontFamily.display,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fontFamily.bodySemi,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
