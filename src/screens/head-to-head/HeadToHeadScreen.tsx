import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setHeadToHeadComparisons } from '@/redux/slices/analyticsSlice';
import { analyticsService } from '@/services/analyticsService';
import { ergastService } from '@/services/ergastAPI';
import HeadToHeadCard from '@/components/analytics/HeadToHeadCard';

interface HeadToHeadScreenProps {
  route?: {
    params?: {
      driver1Id?: string;
      driver2Id?: string;
    };
  };
}

const HeadToHeadScreen: React.FC<HeadToHeadScreenProps> = ({ route }) => {
  const dispatch = useAppDispatch();

  // Optional route params (may be undefined)
  const initialDriver1Id = route?.params?.driver1Id ?? null;
  const initialDriver2Id = route?.params?.driver2Id ?? null;

  // Source data from Redux state
  const { drivers } = useAppSelector(state => state.drivers);
  const { headToHeadComparisons } = useAppSelector(state => state.analytics);
  const currentSeason = useAppSelector(state => state.races.selectedSeason);

  // Local state for the two selected driver IDs
  const [driver1Id, setDriver1Id] = useState<string | null>(initialDriver1Id);
  const [driver2Id, setDriver2Id] = useState<string | null>(initialDriver2Id);

  // Local loading state for the heavier season-results fetch.
  const [loading, setLoading] = useState(false);

  // Resolve the selected driver objects
  const driver1 = useMemo(
    () => drivers.find(d => d.driverId === driver1Id) ?? null,
    [drivers, driver1Id]
  );
  const driver2 = useMemo(
    () => drivers.find(d => d.driverId === driver2Id) ?? null,
    [drivers, driver2Id]
  );

  const bothSelected = !!driver1 && !!driver2 && driver1.driverId !== driver2.driverId;

  // Build the head-to-head comparison when both drivers are selected
  useEffect(() => {
    if (!driver1 || !driver2 || driver1.driverId === driver2.driverId) {
      return;
    }

    let mounted = true;
    setLoading(true);

    const load = async () => {
      try {
        // Head-to-head is computed over a full aggregated season's results
        // (cached per-season by the service).
        const seasonResults = await ergastService.getSeasonResults(currentSeason);
        const comparison = analyticsService.compareDrivers(driver1, driver2, seasonResults);
        if (mounted) dispatch(setHeadToHeadComparisons([comparison]));
      } catch {
        if (mounted) dispatch(setHeadToHeadComparisons([]));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [driver1, driver2, currentSeason, dispatch]);

  // Pull the computed comparison back out of state for rendering
  const comparison = useMemo(() => {
    if (!driver1Id || !driver2Id) {
      return undefined;
    }
    return headToHeadComparisons.find(
      c =>
        (c.driver1Id === driver1Id && c.driver2Id === driver2Id) ||
        (c.driver1Id === driver2Id && c.driver2Id === driver1Id)
    );
  }, [headToHeadComparisons, driver1Id, driver2Id]);

  // Toggle handlers for the two picker rows
  const selectDriver1 = (id: string) => {
    setDriver1Id(prev => (prev === id ? null : id));
  };
  const selectDriver2 = (id: string) => {
    setDriver2Id(prev => (prev === id ? null : id));
  };

  const renderPicker = (
    selectedId: string | null,
    disabledId: string | null,
    onSelect: (id: string) => void
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {drivers.map(driver => (
        <Chip
          key={driver.driverId}
          mode="outlined"
          selected={selectedId === driver.driverId}
          disabled={disabledId === driver.driverId}
          onPress={() => onSelect(driver.driverId)}
          style={styles.chip}
        >
          {driver.familyName}
        </Chip>
      ))}
    </ScrollView>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Head to Head
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          Pick two drivers to compare
        </Text>
      </View>

      {/* Driver 1 picker */}
      <View style={styles.pickerSection}>
        <Text variant="labelLarge" style={styles.pickerLabel}>
          Driver 1
        </Text>
        {renderPicker(driver1Id, driver2Id, selectDriver1)}
      </View>

      {/* Driver 2 picker */}
      <View style={styles.pickerSection}>
        <Text variant="labelLarge" style={styles.pickerLabel}>
          Driver 2
        </Text>
        {renderPicker(driver2Id, driver1Id, selectDriver2)}
      </View>

      {/* Empty / prompt state */}
      {!bothSelected && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            {drivers.length === 0
              ? 'No drivers available'
              : 'Select two different drivers to see their comparison'}
          </Text>
        </View>
      )}

      {/* Loading indicator */}
      {bothSelected && loading && (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator />
        </View>
      )}

      {/* Comparison result */}
      {bothSelected && !loading && comparison && <HeadToHeadCard comparison={comparison} />}

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
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  pickerSection: {
    marginTop: 12,
  },
  pickerLabel: {
    paddingHorizontal: 16,
    marginBottom: 8,
    color: '#333',
  },
  chipRow: {
    paddingHorizontal: 16,
  },
  chip: {
    marginRight: 8,
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
    textAlign: 'center',
  },
  footer: {
    height: 20,
  },
});

export default HeadToHeadScreen;
