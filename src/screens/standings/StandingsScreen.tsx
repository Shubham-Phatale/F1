import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchStandings } from '@/redux/slices/standingsSlice';
import DriverRow from '@/components/race/DriverRow';
import ConstructorRow from '@/components/race/ConstructorRow';
import { ScreenContainer, Skeleton, Reveal } from '@/components/ui';
import { colors, fontFamily } from '@/theme';

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
    <ScreenContainer>
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
      {loading && <Skeleton height={60} count={5} />}

      {/* Drivers Standings */}
      {!loading && standingsType === 'drivers' && (
        <View>
          {driverStandings.length > 0 ? (
            driverStandings.map((standing, index) => (
              <Reveal key={standing.driver.driverId} index={Math.min(index, 6)}>
                <DriverRow
                  standing={standing}
                  index={index}
                  onPress={() =>
                    navigation.navigate('DriverDetail', {
                      driverId: standing.driver.driverId,
                    })
                  }
                />
              </Reveal>
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
              <Reveal
                key={standing.constructor.constructorId}
                index={Math.min(index, 6)}
              >
                <ConstructorRow
                  standing={standing}
                  index={index}
                  onPress={() =>
                    navigation.navigate('ConstructorAnalysis', {
                      constructorId: standing.constructor.constructorId,
                    })
                  }
                />
              </Reveal>
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
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fontFamily.heading,
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
    color: colors.textMuted,
    fontSize: 14,
  },
  footer: {
    height: 20,
  },
});

export default StandingsScreen;
