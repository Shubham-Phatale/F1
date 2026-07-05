import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchStandings } from '@/redux/slices/standingsSlice';
import DriverRow from '@/components/race/DriverRow';
import ConstructorRow from '@/components/race/ConstructorRow';
import {
  ScreenContainer,
  Skeleton,
  Reveal,
  SegmentedControl,
  AppButton,
} from '@/components/ui';
import { colors, fontFamily, SCREEN_GUTTER } from '@/theme';

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

  const isDrivers = standingsType === 'drivers';
  const rows = isDrivers ? driverStandings : constructorStandings;

  return (
    <ScreenContainer>
      <View style={styles.stack}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Standings</Text>
        </View>

        {/* Compare Drivers */}
        <View style={styles.gutter}>
          <AppButton
            label="Compare Drivers"
            variant="outline"
            icon="compare-arrows"
            onPress={() => navigation.navigate('HeadToHead', {})}
          />
        </View>

        {/* Segmented control */}
        <View style={styles.gutter}>
          <SegmentedControl
            options={[
              { value: 'drivers', label: 'Drivers' },
              { value: 'constructors', label: 'Constructors' },
            ]}
            value={standingsType}
            onChange={value => setStandingsType(value as StandingsType)}
          />
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.gutter}>
            <Skeleton height={60} count={5} />
          </View>
        )}

        {/* Rows */}
        {!loading && (
          <View style={styles.gutter}>
            {rows.length > 0 ? (
              isDrivers ? (
                driverStandings.map((standing, index) => (
                  <Reveal key={standing.driver.driverId} index={Math.min(index, 6)}>
                    {index > 0 && <View style={styles.hairline} />}
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
                constructorStandings.map((standing, index) => (
                  <Reveal
                    key={standing.constructor.constructorId}
                    index={Math.min(index, 6)}
                  >
                    {index > 0 && <View style={styles.hairline} />}
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
              )
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No standings available</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: 16,
  },
  header: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 8,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fontFamily.display,
    fontSize: 34,
  },
  gutter: {
    paddingHorizontal: SCREEN_GUTTER,
  },
  hairline: {
    height: 1,
    backgroundColor: colors.border,
  },
  emptyStateContainer: {
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});

export default StandingsScreen;
