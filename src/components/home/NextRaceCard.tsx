import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Race } from '@/types';
import { SurfaceCard, FlagChip } from '@/components/ui';
import { colors, fontFamily, radii, typeScale } from '@/theme';
import { getRaceLockTime } from '@/utils/predictionRules';

interface Props {
  race: Race;
}

interface Remaining {
  days: number;
  hours: number;
  mins: number;
  secs: number;
}

function computeRemaining(target: number, now: number): Remaining | null {
  const diff = target - now;
  if (diff <= 0) return null;
  const totalSecs = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSecs / 86400),
    hours: Math.floor((totalSecs % 86400) / 3600),
    mins: Math.floor((totalSecs % 3600) / 60),
    secs: totalSecs % 60,
  };
}

const Column: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <View style={styles.column}>
    <Text style={styles.columnValue}>{String(value).padStart(2, '0')}</Text>
    <Text style={styles.columnLabel}>{label}</Text>
  </View>
);

const SecondsColumn: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.06, { duration: 75 }),
      withTiming(1, { duration: 75 })
    );
  }, [value, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.column}>
      <Animated.Text style={[styles.columnValue, animatedStyle]}>
        {String(value).padStart(2, '0')}
      </Animated.Text>
      <Text style={styles.columnLabel}>{label}</Text>
    </View>
  );
};

const Divider: React.FC = () => <View style={styles.divider} />;

export const NextRaceCard: React.FC<Props> = ({ race }) => {
  const lockTime = getRaceLockTime(race.date, race.time);
  const [remaining, setRemaining] = useState<Remaining | null>(() =>
    computeRemaining(lockTime, Date.now())
  );

  useEffect(() => {
    const tick = () => setRemaining(computeRemaining(lockTime, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockTime]);

  const country = race.circuit?.location?.country;

  return (
    <SurfaceCard accentColor={colors.accent}>
      <View style={styles.gradientClip} pointerEvents="none">
        <LinearGradient
          colors={['#2a0e17', colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.raceName}>{race.raceName}</Text>
          <Text style={styles.circuit}>{race.circuit?.circuitName ?? 'Circuit TBD'}</Text>
        </View>
        {country ? <FlagChip country={country} width={34} showCode /> : null}
      </View>

      {remaining ? (
        <View style={styles.countdownPanel}>
          <Column value={remaining.days} label="DAYS" />
          <Divider />
          <Column value={remaining.hours} label="HRS" />
          <Divider />
          <Column value={remaining.mins} label="MIN" />
          <Divider />
          <SecondsColumn value={remaining.secs} label="SEC" />
        </View>
      ) : (
        <View style={styles.liveRow}>
          <Text style={styles.liveTitle}>Lights out!</Text>
          <Text style={styles.liveSubtitle}>Underway</Text>
        </View>
      )}
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  gradientClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  raceName: {
    ...typeScale.h2,
    color: colors.textPrimary,
  },
  circuit: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fontFamily.body,
    marginTop: 2,
  },
  countdownPanel: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    paddingVertical: 12,
    marginTop: 14,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnValue: {
    color: colors.textPrimary,
    fontSize: 30,
    fontFamily: fontFamily.mono,
  },
  columnLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fontFamily.bodySemi,
    letterSpacing: 1,
    marginTop: 4,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 4,
    backgroundColor: colors.lineStrong,
  },
  liveRow: {
    marginTop: 14,
    alignItems: 'center',
  },
  liveTitle: {
    color: colors.accent,
    fontSize: 20,
    fontFamily: fontFamily.heading,
  },
  liveSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fontFamily.body,
    marginTop: 2,
  },
});

export default NextRaceCard;
