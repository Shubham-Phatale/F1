import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setConstructorStats } from '@/redux/slices/analyticsSlice';
import { analyticsService } from '@/services/analyticsService';
import { ergastService } from '@/services/ergastAPI';
import ConstructorComparison from '@/components/analytics/ConstructorComparison';
import SkeletonLoader from '@/components/common/SkeletonLoader';

interface ConstructorAnalysisScreenProps {
  route: {
    params: {
      constructorId: string;
    };
  };
}

const ConstructorAnalysisScreen: React.FC<ConstructorAnalysisScreenProps> = ({ route }) => {
  const dispatch = useAppDispatch();

  // Extract route params
  const { constructorId } = route.params;

  // Source data from Redux state. Constructors live inside constructor standings,
  // while stats are computed from driver standings + aggregated season results.
  const { constructorStandings, driverStandings } = useAppSelector(state => state.standings);
  const { constructorStats } = useAppSelector(state => state.analytics);
  const currentSeason = useAppSelector(state => state.races.selectedSeason);

  // Local loading state for the heavier season-results fetch.
  const [loading, setLoading] = useState(false);

  // Find the constructor object from the constructor standings
  const constructor = constructorStandings.find(
    standing => standing.constructor.constructorId === constructorId
  )?.constructor;

  // Fetch aggregated season results, compute constructor stats and store them.
  useEffect(() => {
    if (!constructor) {
      return;
    }

    let mounted = true;
    setLoading(true);

    const load = async () => {
      try {
        const seasonResults = await ergastService.getSeasonResults(currentSeason);
        const stats = analyticsService.calculateConstructorStats(
          constructor,
          driverStandings,
          seasonResults
        );
        if (mounted) dispatch(setConstructorStats([stats]));
      } catch {
        if (mounted) dispatch(setConstructorStats([]));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [constructorId, constructor, currentSeason, driverStandings, dispatch]);

  // Pull the computed value back out of state for rendering
  const stats = constructorStats.find(s => s.constructorId === constructorId);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      {constructor && (
        <>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.constructorName}>
              {constructor.name}
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              {constructor.nationality}
            </Text>
          </View>
          <Divider />
        </>
      )}

      {/* Loading State */}
      {loading && <SkeletonLoader height={60} count={4} />}

      {/* Constructor not found */}
      {!constructor && !loading && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Constructor not found</Text>
        </View>
      )}

      {/* Team Performance */}
      {constructor && !loading && stats && <ConstructorComparison stats={stats} />}

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
  constructorName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
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

export default ConstructorAnalysisScreen;
