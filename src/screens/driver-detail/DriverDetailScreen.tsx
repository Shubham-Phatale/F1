import React, { useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  setDriverStats,
  setTrends,
  setSelectedDriverId,
  setLoading,
} from '@/redux/slices/analyticsSlice';
import { analyticsService } from '@/services/analyticsService';
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

  // Extract route params
  const { driverId } = route.params;

  // Source data from Redux state
  const { drivers } = useAppSelector(state => state.drivers);
  const { driverStandings } = useAppSelector(state => state.standings);
  const { results } = useAppSelector(state => state.results);
  const { driverStats, trends, loading } = useAppSelector(state => state.analytics);

  // Find the driver object for this screen
  const driver = drivers.find(d => d.driverId === driverId);

  // Compute stats + trend data and store them in the analytics slice
  useEffect(() => {
    dispatch(setSelectedDriverId(driverId));

    if (!driver) {
      return;
    }

    dispatch(setLoading(true));

    // Career stats derived from the loaded standings + race results.
    const stats = analyticsService.calculateDriverStats(driver, driverStandings, results);
    dispatch(setDriverStats([stats]));

    // Trend data across seasons (currently sourced from standings).
    const trend = analyticsService.getTrendData(driverId, driverStandings);
    dispatch(setTrends([trend]));

    dispatch(setLoading(false));
  }, [driverId, driver, driverStandings, results, dispatch]);

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
