import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Divider, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  setDriverStats,
  setTrends,
  setSelectedDriverId,
} from '@/redux/slices/analyticsSlice';
import { analyticsService } from '@/services/analyticsService';
import { ergastService } from '@/services/ergastAPI';
import { Driver } from '@/types';
import DriverDashboard from '@/components/analytics/DriverDashboard';
import TrendChart from '@/components/analytics/TrendChart';
import SkeletonLoader from '@/components/common/SkeletonLoader';

interface DriverDetailScreenProps {
  route: {
    params: {
      driverId: string;
    };
  };
}

const DriverDetailScreen: React.FC<DriverDetailScreenProps> = ({ route }) => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Extract route params
  const { driverId } = route.params;

  // Source data from Redux state
  const { drivers } = useAppSelector(state => state.drivers);
  const { driverStandings } = useAppSelector(state => state.standings);
  const { driverStats, trends } = useAppSelector(state => state.analytics);
  const currentSeason = useAppSelector(state => state.races.selectedSeason);

  // Local loading state for this heavier async fetch.
  const [loading, setLoading] = useState(false);
  // Driver may come from Redux state or, failing that, from the season results.
  const [resolvedDriver, setResolvedDriver] = useState<Driver | null>(
    drivers.find(d => d.driverId === driverId) ?? null
  );

  const driver = resolvedDriver;

  // Fetch aggregated season results + multi-season standings, then compute
  // stats + trend data and store them in the analytics slice.
  useEffect(() => {
    let mounted = true;
    dispatch(setSelectedDriverId(driverId));
    setLoading(true);

    const load = async () => {
      try {
        const n = Number(currentSeason);
        const window = [String(n - 2), String(n - 1), String(n)];

        // All results for the current season (cached per-season by the service).
        const seasonResults = await ergastService.getSeasonResults(currentSeason);

        // Resolve the driver: prefer Redux, fall back to the season results.
        const fromState = drivers.find(d => d.driverId === driverId);
        const fromResults = seasonResults.find(r => r.driver.driverId === driverId)?.driver;
        const found = fromState ?? fromResults ?? null;

        // Fresh stats for the current season's results.
        analyticsService.clearCache();

        if (found) {
          const stats = analyticsService.calculateDriverStats(
            found,
            driverStandings,
            seasonResults
          );
          if (mounted) dispatch(setDriverStats([stats]));
        }

        // Multi-season championship standings power the performance trend.
        const seasonStandings = await ergastService.getDriverSeasonStandings(driverId, window);
        const trend = analyticsService.getTrendData(driverId, seasonStandings, 'points');

        if (mounted) {
          setResolvedDriver(found);
          dispatch(setTrends([trend]));
        }
      } catch {
        if (mounted) {
          dispatch(setDriverStats([]));
          dispatch(setTrends([]));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [driverId, currentSeason, drivers, driverStandings, dispatch]);

  // Pull the computed values back out of state for rendering
  const stats = driverStats.find(s => s.driverId === driverId);
  const trend = trends.find(t => t.driverId === driverId);
  const hasTrend = !!trend && trend.seasons.length > 0 && trend.values.length > 0;

  const driverName = driver ? `${driver.givenName} ${driver.familyName}` : '';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      {driver && (
        <>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.driverName}>
              {driverName}
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              {driver.nationality}
              {driver.permanentNumber ? ` · #${driver.permanentNumber}` : ''}
            </Text>
          </View>
          <Divider />
        </>
      )}

      {/* Loading State */}
      {loading && <SkeletonLoader height={60} count={4} />}

      {/* Driver not found */}
      {!driver && !loading && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Driver not found</Text>
        </View>
      )}

      {/* Career Dashboard */}
      {driver && !loading && stats && <DriverDashboard stats={stats} driverName={driverName} />}

      {/* Trend Chart */}
      {driver && !loading && hasTrend && trend && (
        <View style={styles.chartContainer}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Performance Trend
          </Text>
          <TrendChart trendData={trend} metric={trend.metricType} height={300} />
        </View>
      )}

      {/* Trend Analysis Entry Point */}
      {driver && !loading && (
        <View style={styles.actionContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('TrendAnalysis', { driverId })}
          >
            View Performance Trends
          </Button>
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
  driverName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  chartContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
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

export default DriverDetailScreen;
