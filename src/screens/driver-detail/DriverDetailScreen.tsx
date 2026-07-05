import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
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
import { openF1Service, DriverMedia } from '@/services/openF1Service';
import { Driver } from '@/types';
import DriverDashboard from '@/components/analytics/DriverDashboard';
import TrendChart from '@/components/analytics/TrendChart';
import {
  ScreenContainer,
  BackButton,
  SurfaceCard,
  SectionHeader,
  SmartImage,
  DriverBadge,
  Skeleton,
} from '@/components/ui';
import { colors, fontFamily, getTeamColor } from '@/theme';

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

  // Constructor for this driver (used for the fallback team color).
  const constructorName =
    driverStandings.find(s => s.driver.driverId === driverId)?.constructors[0]?.name ?? '';

  // OpenF1 driver media (headshot + team color); resolves to null on miss/offline.
  const [media, setMedia] = useState<DriverMedia | null>(null);
  useEffect(() => {
    let alive = true;
    if (driver?.code) {
      openF1Service.getDriverMedia(driver.code).then(m => {
        if (alive) setMedia(m);
      });
    }
    return () => {
      alive = false;
    };
  }, [driver?.code]);

  const teamColor = media?.teamColour ?? getTeamColor(constructorName);

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
    <ScreenContainer>
      <BackButton />
      {/* Photo Header */}
      {driver && (
        <View style={styles.header}>
          <SmartImage
            uri={media?.headshotUrl ?? null}
            width={96}
            height={96}
            borderRadius={14}
            fallback={<DriverBadge code={driver?.code ?? '??'} teamColor={teamColor} size={96} />}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.driverName}>{driverName}</Text>
            <View style={[styles.teamPill, { backgroundColor: teamColor }]} />
            <Text style={styles.subtitle}>
              {driver.nationality}
              {driver.permanentNumber ? ` · #${driver.permanentNumber}` : ''}
            </Text>
            {constructorName ? (
              <Text style={styles.teamName}>{constructorName}</Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Loading State */}
      {loading && <Skeleton height={60} count={4} />}

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
        <>
          <SectionHeader title="Performance Trend" />
          <SurfaceCard>
            <TrendChart trendData={trend} metric={trend.metricType} height={300} />
          </SurfaceCard>
        </>
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
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerInfo: {
    flex: 1,
  },
  driverName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: fontFamily.heading,
    marginBottom: 6,
  },
  teamPill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fontFamily.body,
  },
  teamName: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fontFamily.body,
    marginTop: 2,
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
    color: colors.textMuted,
    fontSize: 14,
  },
});

export default DriverDetailScreen;
