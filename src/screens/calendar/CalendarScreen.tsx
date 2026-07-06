import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchRacesByYear, setSelectedSeason } from '@/redux/slices/racesSlice';
import { RootStackParamList } from '@/navigation/types';
import { Race } from '@/types';
import {
  ScreenContainer,
  Skeleton,
  Reveal,
  SegmentedControl,
  FlagChip,
  PressableScale,
} from '@/components/ui';
import { colors, fontFamily, SCREEN_GUTTER } from '@/theme';
import { formatTime } from '@/utils/formatters';

/** Short "Mon D" date (no year) e.g. "Mar 7". Returns "--" on invalid input. */
function formatShortDate(dateString: string | undefined | null): string {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type CalendarNav = NativeStackNavigationProp<RootStackParamList>;

interface RaceRowProps {
  race: Race;
  completed: boolean;
  onPress: () => void;
}

const RaceRow: React.FC<RaceRowProps> = ({ race, completed, onPress }) => {
  const country = race.circuit?.location?.country ?? '';
  const city = race.circuit?.location?.locality ?? '';
  const circuitName = race.circuit?.circuitName ?? 'TBD';
  const circuitLine = city ? `${circuitName} · ${city}` : circuitName;

  const datePart = formatShortDate(race.date);
  const timePart = race.time ? formatTime(race.time) : '';
  const dateTime = timePart ? `${datePart} · ${timePart}` : datePart;

  return (
    <PressableScale onPress={onPress}>
      <View style={[styles.crow, completed && styles.crowCompleted]}>
        <View style={styles.topRow}>
          <Text style={styles.raceName} numberOfLines={1}>
            {race.raceName}
          </Text>
          {country ? <FlagChip country={country} width={38} /> : null}
        </View>

        <Text style={styles.circuit}>{circuitLine}</Text>

        <View style={styles.bottomRow}>
          {completed ? (
            <View style={styles.completedChip}>
              <Text style={styles.completedChipText}>COMPLETED</Text>
            </View>
          ) : (
            <Text style={styles.locationText}>
              {city ? `${city}, ${country}` : country}
            </Text>
          )}
          <Text style={styles.dateTime}>{dateTime}</Text>
        </View>
      </View>
    </PressableScale>
  );
};

const CalendarScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<CalendarNav>();

  // Get races state from Redux
  const { selectedSeason, allRaces, loading } = useAppSelector(state => state.races);

  // Local state for display season
  const [displaySeason, setDisplaySeason] = useState<string>(selectedSeason);

  // Handle season change
  useEffect(() => {
    setDisplaySeason(selectedSeason);
  }, [selectedSeason]);

  // Fetch races when display season changes
  useEffect(() => {
    if (displaySeason) {
      dispatch(fetchRacesByYear(displaySeason));
      dispatch(setSelectedSeason(displaySeason));
    }
  }, [displaySeason, dispatch]);

  const now = Date.now();
  const completedCount = allRaces.filter(race => new Date(race.date).getTime() < now).length;

  const goToRace = (race: Race) => {
    navigation.navigate('RaceDetails', {
      raceId: race.raceId,
      season: race.season,
      round: race.round,
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Calendar</Text>

        {/* Season Selector */}
        <View style={styles.gutter}>
        <SegmentedControl
          value={displaySeason}
          onChange={setDisplaySeason}
          options={[
            { value: '2024', label: '2024' },
            { value: '2025', label: '2025' },
            { value: '2026', label: '2026' },
          ]}
        />
      </View>

      {/* Count label */}
      {!loading && allRaces.length > 0 && (
        <Text style={styles.countLabel}>
          <Text style={styles.countNum}>{allRaces.length}</Text> RACES ·{' '}
          <Text style={styles.countNum}>{completedCount}</Text> COMPLETED
        </Text>
      )}

      {/* Loading State */}
      {loading && (
        <View style={styles.gutter}>
          <Skeleton height={100} count={5} />
        </View>
      )}

      {/* Races List */}
      {!loading &&
        allRaces.map((race, index) => {
          const completed = new Date(race.date).getTime() < now;
          return (
            <Reveal key={race.raceId} index={Math.min(index, 6)}>
              <RaceRow race={race} completed={completed} onPress={() => goToRace(race)} />
            </Reveal>
          );
        })}

      {/* Empty State */}
      {!loading && allRaces.length === 0 && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No races found for this season</Text>
        </View>
      )}

        {/* Footer */}
        <View style={styles.footer} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontFamily: fontFamily.display,
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 8,
  },
  gutter: {
    paddingHorizontal: SCREEN_GUTTER,
  },
  countLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fontFamily.bodySemi,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: SCREEN_GUTTER,
  },
  countNum: {
    fontFamily: fontFamily.mono,
    color: colors.textMuted,
  },
  // Race row (crow) card
  crow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: SCREEN_GUTTER,
    marginBottom: 10,
    flexDirection: 'column',
    gap: 10,
  },
  crowCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: colors.positive,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  raceName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: fontFamily.heading,
  },
  circuit: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fontFamily.body,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  completedChip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.positive,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  completedChipText: {
    color: colors.positive,
    fontSize: 11,
    fontFamily: fontFamily.bodySemi,
  },
  locationText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fontFamily.mono,
  },
  dateTime: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fontFamily.mono,
  },
  emptyStateContainer: {
    marginHorizontal: SCREEN_GUTTER,
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

export default CalendarScreen;
