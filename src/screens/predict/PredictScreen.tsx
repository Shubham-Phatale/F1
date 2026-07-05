import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  setPredictions,
  setPredictionsLoading,
  setPredictionsError,
} from '@/redux/slices/predictionsSlice';
import { predictionService } from '@/services/predictionService';
import { getRaceLockTime } from '@/utils/predictionRules';
import { ScreenContainer, SurfaceCard, Skeleton, Flag } from '@/components/ui';
import { PredictionCard } from '@/components/predict/PredictionCard';
import { colors, fontFamily, SCREEN_GUTTER } from '@/theme';
import type { Prediction, Race } from '@/types';

type PredictNavigationProp = NativeStackNavigationProp<RootStackParamList>;

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Locked';
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const PODIUM_LABELS = ['P1', 'P2', 'P3'] as const;

function code(driverId: string): string {
  return driverId ? driverId.slice(0, 3).toUpperCase() : '--';
}

const PredictScreen: React.FC = () => {
  const navigation = useNavigation<PredictNavigationProp>();
  const dispatch = useAppDispatch();

  const user = useAppSelector(state => state.auth.user);
  const season = useAppSelector(state => state.races.selectedSeason);
  const allRaces = useAppSelector(state => state.races.allRaces);
  const { byRound, loading, error } = useAppSelector(state => state.predictions);

  const uid = user?.uid;

  // Score-on-open: score finished predictions, then reload the user's predictions.
  useEffect(() => {
    if (!uid) return;

    let mounted = true;
    const load = async () => {
      dispatch(setPredictionsLoading(true));
      dispatch(setPredictionsError(null));
      try {
        await predictionService.scoreUserPendingPredictions(uid, season);
        const preds = await predictionService.getUserPredictions(uid, season);
        if (mounted) dispatch(setPredictions(preds));
      } catch {
        if (mounted) {
          dispatch(setPredictionsError('Could not load your predictions.'));
        }
      } finally {
        if (mounted) dispatch(setPredictionsLoading(false));
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [uid, season, dispatch]);

  // Next race = first race whose lock time is still in the future.
  const nextRace = useMemo<Race | undefined>(() => {
    const now = Date.now();
    return [...allRaces]
      .sort((a, b) => getRaceLockTime(a.date, a.time) - getRaceLockTime(b.date, b.time))
      .find(r => getRaceLockTime(r.date, r.time) > now);
  }, [allRaces]);

  // Scored predictions for the "Recent predictions" section (most recent round first).
  const scoredPredictions = useMemo<Prediction[]>(() => {
    return Object.values(byRound)
      .filter(p => p.status === 'scored')
      .sort((a, b) => Number(b.round) - Number(a.round));
  }, [byRound]);

  // Not logged in — prompt to sign in.
  if (!user) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <Text style={styles.title}>Predict</Text>
        </View>
        <View style={styles.promptContainer}>
          <Text style={styles.promptText}>
            Log in to predict each race podium and climb the leaderboard.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={styles.promptButton}
          >
            Log In
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  const nextRacePick = nextRace ? byRound[nextRace.round] : undefined;
  const nextRaceLocked = nextRace
    ? getRaceLockTime(nextRace.date, nextRace.time) <= Date.now()
    : false;

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Predict</Text>
          <Text style={styles.subtitle}>Call the podium before lights out</Text>
        </View>

        {loading ? (
          <Skeleton height={140} count={2} />
        ) : (
          <>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Next race card */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Next race</Text>
              {nextRace ? (
                <SurfaceCard>
                  <View style={styles.raceTitleRow}>
                    <Text style={styles.raceName}>{nextRace.raceName}</Text>
                    {nextRace.circuit?.location?.country ? (
                      <Flag country={nextRace.circuit.location.country} width={26} />
                    ) : null}
                  </View>
                  <Text style={styles.countdown}>
                    {nextRaceLocked
                      ? 'Predictions locked'
                      : `Locks in ${formatCountdown(
                          getRaceLockTime(nextRace.date, nextRace.time) - Date.now()
                        )}`}
                  </Text>

                  {nextRacePick ? (
                    <>
                      <View style={styles.pickHeaderRow}>
                        <Text style={styles.pickLabel}>Your pick</Text>
                        {nextRaceLocked && <Text style={styles.lockIndicator}>🔒</Text>}
                      </View>
                      <View style={styles.podiumRow}>
                        {[nextRacePick.p1, nextRacePick.p2, nextRacePick.p3].map(
                          (driverId, i) => (
                            <View key={`pick-${i}`} style={styles.podiumSlot}>
                              <Text style={styles.slotLabel}>{PODIUM_LABELS[i]}</Text>
                              <Text style={styles.slotCode}>{code(driverId)}</Text>
                            </View>
                          )
                        )}
                      </View>
                      {!nextRaceLocked && (
                        <Button
                          mode="outlined"
                          onPress={() =>
                            navigation.navigate('MakePrediction', {
                              season,
                              round: nextRace.round,
                              raceId: nextRace.raceId,
                            })
                          }
                          style={styles.cta}
                        >
                          Edit Prediction
                        </Button>
                      )}
                    </>
                  ) : nextRaceLocked ? (
                    <Text style={styles.noPickText}>
                      Predictions are locked for this race.
                    </Text>
                  ) : (
                    <Button
                      mode="contained"
                      onPress={() =>
                        navigation.navigate('MakePrediction', {
                          season,
                          round: nextRace.round,
                          raceId: nextRace.raceId,
                        })
                      }
                      style={styles.cta}
                    >
                      Make Prediction
                    </Button>
                  )}
                </SurfaceCard>
              ) : (
                <SurfaceCard>
                  <Text style={styles.noPickText}>
                    No upcoming races open for predictions.
                  </Text>
                </SurfaceCard>
              )}
            </View>

            {/* Leaderboard button */}
            <View style={styles.section}>
              <Button
                mode="contained-tonal"
                icon="trophy"
                onPress={() => navigation.navigate('Leaderboard')}
              >
                View Leaderboard
              </Button>
            </View>

            {/* Recent predictions */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Recent predictions</Text>
              {scoredPredictions.length > 0 ? (
                scoredPredictions.map(prediction => (
                  <View
                    key={`${prediction.round}`}
                    style={styles.predictionCardWrapper}
                  >
                    <PredictionCard prediction={prediction} />
                  </View>
                ))
              ) : (
                <SurfaceCard>
                  <Text style={styles.noPickText}>
                    No scored predictions yet. Make a pick and check back after the race.
                  </Text>
                </SurfaceCard>
              )}
            </View>
          </>
        )}
      </ScrollView>
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
  promptContainer: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingVertical: 32,
    alignItems: 'center',
  },
  promptText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  promptButton: {
    minWidth: 160,
  },
  errorContainer: {
    marginHorizontal: SCREEN_GUTTER,
    marginBottom: 12,
  },
  errorText: {
    color: colors.accent,
    fontSize: 13,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    paddingHorizontal: SCREEN_GUTTER,
    marginBottom: 8,
    color: colors.textSecondary,
    fontFamily: fontFamily.bodySemi,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  raceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  raceName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: fontFamily.heading,
    flex: 1,
  },
  countdown: {
    color: colors.accent,
    fontSize: 13,
    fontFamily: fontFamily.bodySemi,
    marginTop: 6,
  },
  pickHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  pickLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  lockIndicator: {
    fontSize: 12,
  },
  podiumRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  podiumSlot: {
    alignItems: 'center',
    gap: 4,
  },
  slotLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
  },
  slotCode: {
    color: colors.textPrimary,
    fontFamily: fontFamily.heading,
    fontSize: 15,
  },
  noPickText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  cta: {
    marginTop: 14,
  },
  predictionCardWrapper: {
    marginBottom: 12,
  },
});

export default PredictScreen;
