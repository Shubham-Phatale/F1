import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Race } from '@/types';
import { SurfaceCard, FlagChip } from '@/components/ui';
import { colors, fontFamily } from '@/theme';
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

const Column: React.FC<{ value: number; label: string; divider: boolean }> = ({
  value,
  label,
  divider,
}) => (
  <View style={[styles.column, divider && styles.columnDivider]}>
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
    <View style={[styles.column, styles.columnDivider]}>
      <Animated.Text style={[styles.columnValue, animatedStyle]}>
        {String(value).padStart(2, '0')}
      </Animated.Text>
      <Text style={styles.columnLabel}>{label}</Text>
    </View>
  );
};

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
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.raceName}>{race.raceName}</Text>
          {race.circuit?.circuitName ? (
            <Text style={styles.circuit}>{race.circuit.circuitName}</Text>
          ) : null}
        </View>
        {country ? <FlagChip country={country} width={40} /> : null}
      </View>

      {remaining ? (
        <View style={styles.countdownPanel}>
          <Column value={remaining.days} label="DAYS" divider={false} />
          <Column value={remaining.hours} label="HRS" divider />
          <Column value={remaining.mins} label="MIN" divider />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  raceName: {
    color: colors.textPrimary,
    fontSize: 19,
    fontFamily: fontFamily.heading,
    letterSpacing: -0.2,
  },
  circuit: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fontFamily.body,
    marginTop: 4,
  },
  countdownPanel: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 16,
  },
  column: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  columnDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  columnValue: {
    color: colors.textPrimary,
    fontSize: 30,
    lineHeight: 30,
    fontFamily: fontFamily.mono,
  },
  columnLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fontFamily.bodySemi,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginTop: 7,
  },
  liveRow: {
    marginTop: 16,
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
