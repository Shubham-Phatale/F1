import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setSelectedDriverId } from '@/redux/slices/analyticsSlice';
import { analyticsService } from '@/services/analyticsService';
import { ergastService } from '@/services/ergastAPI';
import { TrendData } from '@/types';
import TrendChart from '@/components/analytics/TrendChart';
import { ScreenContainer, SurfaceCard, Skeleton } from '@/components/ui';
import { colors, fontFamily } from '@/theme';

type SeasonStanding = { season: string; points: number; position: number; wins: number };

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
  const currentSeason = useAppSelector(state => state.races.selectedSeason);

  // Fetched multi-season standings + local loading state.
  const [seasonStandings, setSeasonStandings] = useState<SeasonStanding[]>([]);
  const [loading, setLoading] = useState(false);

  // Find the driver object for this screen
  const driver = drivers.find(d => d.driverId === driverId);

  // Fetch the driver's multi-season standings once. Metric changes reuse this
  // fetched data (no refetch needed).
  useEffect(() => {
    let mounted = true;
    dispatch(setSelectedDriverId(driverId));
    setLoading(true);

    const load = async () => {
      try {
        const n = Number(currentSeason);
        const window = [String(n - 2), String(n - 1), String(n)];
        const standings = await ergastService.getDriverSeasonStandings(driverId, window);
        if (mounted) setSeasonStandings(standings);
      } catch {
        if (mounted) setSeasonStandings([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [driverId, currentSeason, dispatch]);

  // Recompute the trend from the fetched standings whenever the metric changes.
  const activeTrend: TrendData | undefined = useMemo(
    () => analyticsService.getTrendData(driverId, seasonStandings, selectedMetric),
    [driverId, seasonStandings, selectedMetric]
  );

  const hasTrendData =
    !!activeTrend && activeTrend.seasons.length > 0 && activeTrend.values.length > 0;

  const driverName = driver ? `${driver.givenName} ${driver.familyName}` : '';

  return (
    <ScreenContainer>
      {/* Header Section */}
      {driver && (
        <View style={styles.header}>
          <Text style={styles.driverName}>{driverName}</Text>
          <Text style={styles.subtitle}>Performance Trends</Text>
        </View>
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
          {loading ? (
            <Skeleton height={300} count={1} />
          ) : hasTrendData && activeTrend ? (
            <SurfaceCard>
              <TrendChart trendData={activeTrend} metric={selectedMetric} height={300} />
            </SurfaceCard>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No trend data available for this driver</Text>
            </View>
          )}
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  driverName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: fontFamily.heading,
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  body: {
    paddingHorizontal: 12,
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
    marginHorizontal: 4,
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
});

export default TrendAnalysisScreen;
