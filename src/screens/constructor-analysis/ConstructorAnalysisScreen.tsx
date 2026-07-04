import React, { useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setConstructorStats, setLoading } from '@/redux/slices/analyticsSlice';
import { analyticsService } from '@/services/analyticsService';
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
  // while stats are computed from driver standings + race results.
  const { constructorStandings, driverStandings } = useAppSelector(state => state.standings);
  const { results } = useAppSelector(state => state.results);
  const { constructorStats, loading } = useAppSelector(state => state.analytics);

  // Find the constructor object from the constructor standings
  const constructor = constructorStandings.find(
    standing => standing.constructor.constructorId === constructorId
  )?.constructor;

  // Compute constructor stats and store them in the analytics slice
  useEffect(() => {
    if (!constructor) {
      return;
    }

    dispatch(setLoading(true));

    const stats = analyticsService.calculateConstructorStats(
      constructor,
      driverStandings,
      results
    );
    dispatch(setConstructorStats([stats]));

    dispatch(setLoading(false));
  }, [constructorId, constructor, driverStandings, results, dispatch]);

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
