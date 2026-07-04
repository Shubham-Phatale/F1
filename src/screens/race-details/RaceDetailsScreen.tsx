import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons, Divider } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchRaceResults,
  fetchQualifyingResults,
  setSelectedRaceId,
} from '@/redux/slices/resultsSlice';
import { formatDate } from '@/utils/formatters';
import ResultsTable from '@/components/race/ResultsTable';
import LapTimeTable from '@/components/race/LapTimeTable';
import SkeletonLoader from '@/components/common/SkeletonLoader';

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      {race && (
        <>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.raceName}>
              {race.raceName}
            </Text>
            <Text variant="bodySmall" style={styles.date}>
              {formatDate(race.date)}
            </Text>
            <Text variant="bodySmall" style={styles.location}>
              {race.circuit?.location
                ? `${race.circuit.location.locality}, ${race.circuit.location.country}`
                : 'Location TBD'}
            </Text>
          </View>
          <Divider />
        </>
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
      {loading && <SkeletonLoader height={60} count={3} />}

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
    paddingVertical: 16,
  },
  raceName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    color: '#666',
    marginBottom: 4,
  },
  location: {
    color: '#999',
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
    color: '#999',
    fontSize: 14,
  },
  footer: {
    height: 20,
  },
});

export default RaceDetailsScreen;
