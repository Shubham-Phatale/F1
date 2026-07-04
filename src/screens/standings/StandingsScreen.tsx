import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchStandings } from '@/redux/slices/standingsSlice';
import DriverRow from '@/components/race/DriverRow';
import ConstructorRow from '@/components/race/ConstructorRow';
import SkeletonLoader from '@/components/common/SkeletonLoader';

type StandingsType = 'drivers' | 'constructors';

type StandingsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const StandingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<StandingsNavigationProp>();

  // Local state for standings type
  const [standingsType, setStandingsType] = useState<StandingsType>('drivers');

  // Get races state to access selectedSeason
  const racesState = useAppSelector(state => state.races);
  const { selectedSeason } = racesState;

  // Get standings state
  const standingsState = useAppSelector(state => state.standings);
  const { driverStandings, constructorStandings, loading } = standingsState;

  // Fetch standings when season changes
  useEffect(() => {
    if (selectedSeason) {
      dispatch(fetchStandings({ season: selectedSeason }));
    }
  }, [selectedSeason, dispatch]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Standings
        </Text>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('HeadToHead', {})}
          style={styles.compareButton}
        >
          Compare Drivers
        </Button>
      </View>

      {/* Tab Selector */}
      <View style={styles.typeSelector}>
        <SegmentedButtons
          value={standingsType}
          onValueChange={value => setStandingsType(value as StandingsType)}
          buttons={[
            { value: 'drivers', label: 'Drivers' },
            { value: 'constructors', label: 'Constructors' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Loading State */}
      {loading && <SkeletonLoader height={60} count={5} />}

      {/* Drivers Standings */}
      {!loading && standingsType === 'drivers' && (
        <View>
          {driverStandings.length > 0 ? (
            driverStandings.map((standing, index) => (
              <DriverRow
                key={standing.driver.driverId}
                standing={standing}
                index={index}
                onPress={() =>
                  navigation.navigate('DriverDetail', {
                    driverId: standing.driver.driverId,
                  })
                }
              />
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No standings available</Text>
            </View>
          )}
        </View>
      )}

      {/* Constructors Standings */}
      {!loading && standingsType === 'constructors' && (
        <View>
          {constructorStandings.length > 0 ? (
            constructorStandings.map((standing, index) => (
              <ConstructorRow
                key={standing.constructor.constructorId}
                standing={standing}
                index={index}
                onPress={() =>
                  navigation.navigate('ConstructorAnalysis', {
                    constructorId: standing.constructor.constructorId,
                  })
                }
              />
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No standings available</Text>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontWeight: 'bold',
  },
  compareButton: {
    marginTop: 12,
  },
  typeSelector: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  segmentedButtons: {
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

export default StandingsScreen;
