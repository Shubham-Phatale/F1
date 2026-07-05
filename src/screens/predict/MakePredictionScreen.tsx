import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setPrediction } from '@/redux/slices/predictionsSlice';
import { predictionService } from '@/services/predictionService';
import { validatePodium, isPredictionOpen } from '@/utils/predictionRules';
import { DriverPicker } from '@/components/predict/DriverPicker';
import { ScreenContainer, BackButton } from '@/components/ui';
import { colors, fontFamily, SCREEN_GUTTER } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';
import type { Driver } from '@/types';

interface MakePredictionScreenProps {
  route: {
    params: {
      season: string;
      round: string;
      raceId: string;
    };
  };
}

type Slot = 0 | 1 | 2;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const MakePredictionScreen: React.FC<MakePredictionScreenProps> = ({ route }) => {
  const { season, round, raceId } = route.params;
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavProp>();

  const user = useAppSelector(state => state.auth.user);
  const driversFromState = useAppSelector(state => state.drivers.drivers);
  const driverStandings = useAppSelector(state => state.standings.driverStandings);
  const allRaces = useAppSelector(state => state.races.allRaces);

  // Prefer the full drivers list; fall back to unique drivers from standings.
  const drivers: Driver[] = useMemo(() => {
    if (driversFromState.length > 0) return driversFromState;
    const seen = new Set<string>();
    const derived: Driver[] = [];
    for (const standing of driverStandings) {
      if (!seen.has(standing.driver.driverId)) {
        seen.add(standing.driver.driverId);
        derived.push(standing.driver);
      }
    }
    return derived;
  }, [driversFromState, driverStandings]);

  const race = useMemo(
    () => allRaces.find(r => r.round === round && r.season === season) ?? null,
    [allRaces, round, season]
  );

  const locked = race
    ? !isPredictionOpen(race.date, race.time, Date.now())
    : false;

  const [selected, setSelected] = useState<[string, string, string]>(['', '', '']);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from an existing prediction if present.
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    const load = async () => {
      try {
        const existing = await predictionService.getUserPrediction(
          user.uid,
          season,
          round
        );
        if (mounted && existing) {
          setSelected([existing.p1, existing.p2, existing.p3]);
        }
      } catch {
        // Non-fatal: start with an empty podium.
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user, season, round]);

  const handleChange = (slot: Slot, driverId: string) => {
    setError(null);
    setSelected(prev => {
      const next: [string, string, string] = [...prev];
      // Toggle off if the same driver is tapped again.
      next[slot] = prev[slot] === driverId ? '' : driverId;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    const [p1, p2, p3] = selected;
    const validation = validatePodium(p1, p2, p3);
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid podium.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await predictionService.savePrediction({
        uid: user.uid,
        displayName: user.displayName,
        season,
        round,
        raceId,
        p1,
        p2,
        p3,
      });
      dispatch(
        setPrediction({
          uid: user.uid,
          season,
          round,
          raceId,
          p1,
          p2,
          p3,
          displayName: user.displayName,
          createdAt: new Date().toISOString(),
          status: 'pending',
          pointsEarned: null,
        })
      );
      navigation.goBack();
    } catch {
      setError('Could not save your prediction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Not logged in: prompt to sign in.
  if (!user) {
    return (
      <ScreenContainer>
        <BackButton />
        <View style={styles.center}>
          <Text style={styles.title}>Sign in to predict</Text>
          <Text style={styles.muted}>
            You need an account to make podium predictions.
          </Text>
          <Button
            mode="contained"
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            Log In
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <BackButton />
      <View style={styles.header}>
        <Text style={styles.title}>Make Prediction</Text>
        <Text style={styles.subtitle}>
          {race ? race.raceName : `Round ${round}`}
        </Text>
      </View>

      {locked && (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedText}>
            Predictions are locked for this race.
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : drivers.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.muted}>No drivers available.</Text>
        </View>
      ) : (
        <>
          <DriverPicker
            drivers={drivers}
            selected={selected}
            onChange={handleChange}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.submitContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={locked || submitting}
              loading={submitting}
            >
              {locked ? 'Locked' : 'Submit Prediction'}
            </Button>
          </View>
        </>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 16,
    paddingBottom: 16,
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
  lockedBanner: {
    marginHorizontal: SCREEN_GUTTER,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(220, 10, 45, 0.12)',
  },
  lockedText: {
    color: colors.accent,
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
  },
  submitContainer: {
    paddingHorizontal: SCREEN_GUTTER,
    marginTop: 16,
  },
  error: {
    color: colors.accent,
    fontSize: 13,
    marginTop: 8,
    marginHorizontal: SCREEN_GUTTER,
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
    marginTop: 8,
  },
  button: {
    marginTop: 20,
  },
});

export default MakePredictionScreen;
