import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchRaceResults,
  fetchQualifyingResults,
  setSelectedRaceId,
} from '@/redux/slices/resultsSlice';
import { formatDate } from '@/utils/formatters';
import ResultsTable from '@/components/race/ResultsTable';
import LapTimeTable from '@/components/race/LapTimeTable';
import { ScreenContainer, BackButton, SurfaceCard, Flag, Skeleton } from '@/components/ui';
import { colors, fontFamily } from '@/theme';

type DisplayTab = 'results' | 'qualifying';

interface RaceDetailsScreenProps {
  route: {
    params: {
      raceId: string;
      season: string;
      round: string;
    };
  };
}

const RaceDetailsScreen: React.FC<RaceDetailsScreenProps> = ({ route }) => {
  const dispatch = useAppDispatch();

  // Extract route params
  const { raceId, season, round } = route.params;

  // Local state for tab display
  const [displayTab, setDisplayTab] = useState<DisplayTab>('results');

  // Get races data
  const racesState = useAppSelector(state => state.races);
  const { allRaces } = racesState;

  // Get results data
  const resultsState = useAppSelector(state => state.results);
  const { results, qualifyingResults, loading } = resultsState;

  // Find race from allRaces by matching round
  const race = allRaces.find(r => r.round === round);

  // Set selected race ID and fetch data when params change
  useEffect(() => {
    dispatch(setSelectedRaceId(raceId));
    dispatch(fetchRaceResults({ season, round }));
    dispatch(fetchQualifyingResults({ season, round }));
  }, [raceId, season, round, dispatch]);

  const country = race?.circuit?.location?.country ?? '';

  return (
    <ScreenContainer>
      <BackButton />
      {/* Styled circuit banner */}
      {race && (
        <SurfaceCard accentColor={colors.accent} style={styles.banner}>
          <View style={styles.bannerTitleRow}>
            <Text style={styles.raceName} numberOfLines={2}>
              {race.raceName}
            </Text>
            {country ? <Flag country={country} width={28} /> : null}
          </View>
          <Text style={styles.location}>
            {race.circuit?.location
              ? `${race.circuit.location.locality}, ${race.circuit.location.country}`
              : 'Location TBD'}
          </Text>
          <Text style={styles.date}>{formatDate(race.date)}</Text>
        </SurfaceCard>
      )}

      {/* Tab Selector */}
      <View style={styles.tabSelectorContainer}>
        <SegmentedButtons
          value={displayTab}
          onValueChange={value => setDisplayTab(value as DisplayTab)}
          buttons={[
            { value: 'results', label: 'Results' },
            { value: 'qualifying', label: 'Qualifying' },
          ]}
          style={styles.tabSelector}
        />
      </View>

      {/* Loading State */}
      {loading && <Skeleton height={60} count={3} />}

      {/* Results Tab */}
      {displayTab === 'results' && !loading && (
        <View>
          {results.length > 0 ? (
            <ResultsTable results={results} />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No race results available</Text>
            </View>
          )}
        </View>
      )}

      {/* Qualifying Tab */}
      {displayTab === 'qualifying' && !loading && (
        <View>
          {qualifyingResults.length > 0 ? (
            <LapTimeTable results={qualifyingResults} title="Qualifying Results" />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No qualifying results available</Text>
            </View>
          )}
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginTop: 12,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  raceName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: fontFamily.heading,
  },
  location: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fontFamily.body,
    marginTop: 8,
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fontFamily.body,
    marginTop: 4,
  },
  tabSelectorContainer: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  tabSelector: {
    alignSelf: 'center',
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
    fontFamily: fontFamily.body,
  },
});

export default RaceDetailsScreen;
