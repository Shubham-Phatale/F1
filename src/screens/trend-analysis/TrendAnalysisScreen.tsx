import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Divider, SegmentedButtons } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setTrends, setSelectedDriverId } from '@/redux/slices/analyticsSlice';
import { analyticsService } from '@/services/analyticsService';
import { TrendData } from '@/types';
import TrendChart from '@/components/analytics/TrendChart';

type TrendMetric = TrendData['metricType'];

interface TrendAnalysisScreenProps {
  route: {
    params: {
      driverId: string;
    };
  };
}

const METRIC_OPTIONS: { value: TrendMetric; label: string }[] = [
  { value: 'points', label: 'Points' },
  { value: 'wins', label: 'Wins' },
  { value: 'podiums', label: 'Podiums' },
  { value: 'poles', label: 'Poles' },
  { value: 'fastestLaps', label: 'Fastest' },
];

const TrendAnalysisScreen: React.FC<TrendAnalysisScreenProps> = ({ route }) => {
  const dispatch = useAppDispatch();

  // Extract route params
  const { driverId } = route.params;

  // Selected metric to visualize
  const [selectedMetric, setSelectedMetric] = useState<TrendMetric>('points');

  // Source data from Redux state
  const { drivers } = useAppSelector(state => state.drivers);
  const { driverStandings } = useAppSelector(state => state.standings);
  const { trends } = useAppSelector(state => state.analytics);

  // Find the driver object for this screen
  const driver = drivers.find(d => d.driverId === driverId);

  // Compute trend data and store it in the analytics slice
  useEffect(() => {
    dispatch(setSelectedDriverId(driverId));

    if (!driver) {
      return;
    }

    // Trend data across seasons. The next task feeds aggregated multi-season
    // standings (from ergastAPI.getDriverSeasonStandings) here; until then we
    // pass an empty series so the trend renders gracefully.
    const trend = analyticsService.getTrendData(driverId, [], 'points');
    dispatch(setTrends([trend]));
  }, [driverId, driver, driverStandings, dispatch]);

  // Pull the computed trend back out of state for rendering
  const trend = trends.find(t => t.driverId === driverId);

  // Align the stored trend with the currently selected metric so the chart
  // labels and axis reflect the switcher choice.
  const activeTrend: TrendData | undefined = trend
    ? { ...trend, metricType: selectedMetric }
    : undefined;

  const hasTrendData =
    !!activeTrend && activeTrend.seasons.length > 0 && activeTrend.values.length > 0;

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
              Performance Trends
            </Text>
          </View>
          <Divider />
        </>
      )}

      {/* Driver not found */}
      {!driver && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Driver not found</Text>
        </View>
      )}

      {driver && (
        <View style={styles.body}>
          {/* Metric switcher */}
          <SegmentedButtons
            value={selectedMetric}
            onValueChange={value => setSelectedMetric(value as TrendMetric)}
            buttons={METRIC_OPTIONS}
            style={styles.segmentedButtons}
          />

          {/* Trend Chart */}
          {hasTrendData && activeTrend ? (
            <View style={styles.chartContainer}>
              <TrendChart trendData={activeTrend} metric={selectedMetric} height={300} />
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No trend data available for this driver</Text>
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
  driverName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  body: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  chartContainer: {
    marginTop: 8,
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

export default TrendAnalysisScreen;
