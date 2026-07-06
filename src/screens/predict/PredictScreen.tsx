import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
import {
  ScreenContainer,
  SurfaceCard,
  FlagChip,
  DriverBadge,
  AppButton,
  Skeleton,
  Reveal,
  EmptyState,
} from '@/components/ui';
import { PredictionCard } from '@/components/predict/PredictionCard';
import { colors, fontFamily, SCREEN_GUTTER, getTeamColor } from '@/theme';
import type { Driver, Prediction, Race } from '@/types';

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

interface DriverInfo {
  code: string;
  surname: string;
  teamColor?: string;
}

function fallbackCode(driverId: string): string {
  return driverId ? driverId.slice(0, 3).toUpperCase() : '--';
}

const PredictScreen: React.FC = () => {
  const navigation = useNavigation<PredictNavigationProp>();
  const dispatch = useAppDispatch();

  const user = useAppSelector(state => state.auth.user);
  const season = useAppSelector(state => state.races.selectedSeason);
  const allRaces = useAppSelector(state => state.races.allRaces);
  const driversFromState = useAppSelector(state => state.drivers.drivers);
  const driverStandings = useAppSelector(state => state.standings.driverStandings);
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

  // Resolve a driverId to its display code, surname, and team color (all API data).
  const driverInfo = useMemo<(driverId: string) => DriverInfo>(() => {
    const byId = new Map<string, DriverInfo>();
    driverStandings.forEach(standing => {
      const d: Driver = standing.driver;
      const constructor = standing.constructors[0];
      byId.set(d.driverId, {
        code: d.code || fallbackCode(d.driverId),
        surname: d.familyName,
        teamColor: constructor
          ? getTeamColor(constructor.constructorId || constructor.name)
          : undefined,
      });
    });
    driversFromState.forEach(d => {
      if (!byId.has(d.driverId)) {
        byId.set(d.driverId, {
          code: d.code || fallbackCode(d.driverId),
          surname: d.familyName,
        });
      }
    });
    return (driverId: string): DriverInfo =>
      byId.get(driverId) ?? {
        code: fallbackCode(driverId),
        surname: fallbackCode(driverId),
      };
  }, [driversFromState, driverStandings]);

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
          <Text style={styles.subtitle}>Call the podium before lights out.</Text>
        </View>
        <View style={styles.promptContainer}>
          <Text style={styles.promptText}>
            Log in to predict each race podium and climb the leaderboard.
          </Text>
          <AppButton
            label="Log In"
            variant="primary"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </ScreenContainer>
    );
  }

  const nextRacePick = nextRace ? byRound[nextRace.round] : undefined;
  const nextRaceLocked = nextRace
    ? getRaceLockTime(nextRace.date, nextRace.time) <= Date.now()
    : false;

  const goToMakePrediction = () => {
    if (!nextRace) return;
    navigation.navigate('MakePrediction', {
      season,
      round: nextRace.round,
      raceId: nextRace.raceId,
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Predict</Text>
        <Text style={styles.subtitle}>Call the podium before lights out.</Text>
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
          <Reveal index={0}>
            <Text style={styles.sectionLabel}>Next Race</Text>
            {nextRace ? (
              <SurfaceCard accentColor={colors.accent}>
                <View style={styles.raceTitleRow}>
                  <View style={styles.raceTitleLeft}>
                    <Text style={styles.raceName}>{nextRace.raceName}</Text>
                    <View style={styles.lockRow}>
                      <MaterialIcons name="lock" size={15} color={colors.accent} />
                      <Text style={styles.lockText}>
                        {nextRaceLocked
                          ? 'Predictions locked'
                          : `Locks in ${formatCountdown(
                              getRaceLockTime(nextRace.date, nextRace.time) -
                                Date.now()
                            )}`}
                      </Text>
                    </View>
                  </View>
                  {nextRace.circuit?.location?.country ? (
                    <FlagChip
                      country={nextRace.circuit.location.country}
                      width={40}
                    />
                  ) : null}
                </View>

                {nextRacePick ? (
                  <>
                    <Text style={styles.pickLabel}>Your pick</Text>
                    <View style={styles.tileRow}>
                      {[nextRacePick.p1, nextRacePick.p2, nextRacePick.p3].map(
                        (driverId, i) => {
                          const info = driverInfo(driverId);
                          return (
                            <View key={`pick-${i}`} style={styles.tile}>
                              <Text style={styles.tilePos}>{PODIUM_LABELS[i]}</Text>
                              <View style={styles.tileBadge}>
                                <DriverBadge
                                  code={info.code}
                                  teamColor={info.teamColor}
                                  size={40}
                                />
                              </View>
                              <Text
                                style={styles.tileSurname}
                                numberOfLines={1}
                              >
                                {info.surname}
                              </Text>
                            </View>
                          );
                        }
                      )}
                    </View>
                    {!nextRaceLocked && (
                      <View style={styles.cardButton}>
                        <AppButton
                          label="Edit Prediction"
                          variant="outline"
                          onPress={goToMakePrediction}
                        />
                      </View>
                    )}
                  </>
                ) : nextRaceLocked ? (
                  <Text style={styles.noPickText}>
                    Predictions are locked for this race.
                  </Text>
                ) : (
                  <View style={styles.cardButton}>
                    <AppButton
                      label="Make Prediction"
                      variant="primary"
                      onPress={goToMakePrediction}
                    />
                  </View>
                )}
              </SurfaceCard>
            ) : (
              <SurfaceCard>
                <Text style={styles.noPickText}>
                  No upcoming races open for predictions.
                </Text>
              </SurfaceCard>
            )}
          </Reveal>

          {/* Leaderboard button */}
          <Reveal index={1} style={styles.leaderboardSection}>
            <AppButton
              label="View Leaderboard"
              variant="secondary"
              icon="emoji-events"
              onPress={() => navigation.navigate('Leaderboard')}
            />
          </Reveal>

          {/* Recent predictions */}
          <Reveal index={2}>
            <Text style={styles.sectionLabel}>Recent Predictions</Text>
            {scoredPredictions.length > 0 ? (
              scoredPredictions.map(prediction => (
                <PredictionCard
                  key={`${prediction.round}`}
                  prediction={prediction}
                />
              ))
            ) : (
              <SurfaceCard>
                <EmptyState
                  icon="query-stats"
                  title="No scored predictions yet"
                  subtitle="Make a pick and check back after the race."
                />
              </SurfaceCard>
            )}
          </Reveal>
        </>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontFamily: fontFamily.display,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fontFamily.body,
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
  errorContainer: {
    marginHorizontal: SCREEN_GUTTER,
    marginBottom: 12,
  },
  errorText: {
    color: colors.accent,
    fontSize: 13,
  },
  sectionLabel: {
    paddingHorizontal: SCREEN_GUTTER,
    marginBottom: 10,
    color: colors.textMuted,
    fontFamily: fontFamily.bodySemi,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 11,
  },
  leaderboardSection: {
    marginHorizontal: SCREEN_GUTTER,
    marginBottom: 16,
  },
  raceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  raceTitleLeft: {
    flex: 1,
    marginRight: 12,
  },
  raceName: {
    color: colors.textPrimary,
    fontSize: 19,
    fontFamily: fontFamily.heading,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  lockText: {
    color: colors.accent,
    fontSize: 13,
    fontFamily: fontFamily.bodySemi,
  },
  pickLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 18,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.tile,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  tilePos: {
    color: colors.accent,
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
  },
  tileBadge: {
    marginVertical: 10,
  },
  tileSurname: {
    color: colors.textPrimary,
    fontFamily: fontFamily.heading,
    fontSize: 13,
  },
  noPickText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  cardButton: {
    marginTop: 16,
  },
});

export default PredictScreen;
