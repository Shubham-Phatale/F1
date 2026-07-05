import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  setSeasonLeaderboard,
  setRaceLeaderboard,
} from '@/redux/slices/leaderboardSlice';
import { predictionService } from '@/services/predictionService';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';
import { ScreenContainer, BackButton, Skeleton } from '@/components/ui';
import { colors, fontFamily, SCREEN_GUTTER } from '@/theme';

type Tab = 'season' | 'race';

const LeaderboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  const user = useAppSelector(state => state.auth.user);
  const season = useAppSelector(state => state.races.selectedSeason);
  const allRaces = useAppSelector(state => state.races.allRaces);
  const seasonBoard = useAppSelector(state => state.leaderboard.season);
  const raceBoard = useAppSelector(state => state.leaderboard.race);

  const [tab, setTab] = useState<Tab>('season');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Most recent race of the selected season (last in the ordered list).
  const recentRace = useMemo(() => {
    const seasonRaces = allRaces.filter(r => r.season === season);
    const pool = seasonRaces.length > 0 ? seasonRaces : allRaces;
    if (pool.length === 0) return null;
    return [...pool].sort((a, b) => Number(b.round) - Number(a.round))[0];
  }, [allRaces, season]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        if (tab === 'season') {
          const entries = await predictionService.getSeasonLeaderboard();
          if (mounted) dispatch(setSeasonLeaderboard(entries));
        } else {
          if (!recentRace) {
            if (mounted) dispatch(setRaceLeaderboard([]));
          } else {
            const preds = await predictionService.getRaceLeaderboard(
              recentRace.season,
              recentRace.round
            );
            if (mounted) dispatch(setRaceLeaderboard(preds));
          }
        }
      } catch {
        if (mounted) {
          setError('Could not load the leaderboard.');
          if (tab === 'season') dispatch(setSeasonLeaderboard([]));
          else dispatch(setRaceLeaderboard([]));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [tab, recentRace, dispatch]);

  const renderBody = () => {
    if (loading) {
      return <Skeleton height={56} count={5} />;
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.muted}>{error}</Text>
        </View>
      );
    }

    if (tab === 'season') {
      if (seasonBoard.length === 0) {
        return (
          <View style={styles.center}>
            <Text style={styles.muted}>No leaderboard yet.</Text>
          </View>
        );
      }
      return (
        <View>
          {seasonBoard.map((entry, index) => (
            <LeaderboardRow
              key={entry.uid}
              rank={index + 1}
              displayName={entry.displayName}
              points={entry.seasonPoints}
              highlight={entry.uid === user?.uid}
            />
          ))}
        </View>
      );
    }

    // This Race
    if (raceBoard.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.muted}>No scored predictions for this race yet.</Text>
        </View>
      );
    }
    return (
      <View>
        {raceBoard.map((pred, index) => (
          <LeaderboardRow
            key={pred.uid}
            rank={index + 1}
            displayName={pred.displayName}
            points={pred.pointsEarned ?? 0}
            highlight={pred.uid === user?.uid}
          />
        ))}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <BackButton />
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        {tab === 'race' && recentRace && (
          <Text style={styles.subtitle}>{recentRace.raceName}</Text>
        )}
      </View>

      <View style={styles.tabSelectorContainer}>
        <SegmentedButtons
          value={tab}
          onValueChange={value => setTab(value as Tab)}
          buttons={[
            { value: 'season', label: 'Season' },
            { value: 'race', label: 'This Race' },
          ]}
        />
      </View>

      {renderBody()}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontFamily: fontFamily.heading,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  tabSelectorContainer: {
    paddingHorizontal: SCREEN_GUTTER,
    marginBottom: 12,
  },
  center: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LeaderboardScreen;
