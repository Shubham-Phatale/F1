import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Race } from '@/types';
import { SurfaceCard, Flag } from '@/components/ui';
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

const Cell: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <View style={styles.cell}>
    <Text style={styles.cellValue}>{String(value).padStart(2, '0')}</Text>
    <Text style={styles.cellLabel}>{label}</Text>
  </View>
);

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
          <Text style={styles.circuit}>{race.circuit?.circuitName ?? 'Circuit TBD'}</Text>
        </View>
        {country ? <Flag country={country} width={32} /> : null}
      </View>

      {remaining ? (
        <View style={styles.countdownRow}>
          <Cell value={remaining.days} label="DAYS" />
          <Cell value={remaining.hours} label="HRS" />
          <Cell value={remaining.mins} label="MIN" />
          <Cell value={remaining.secs} label="SEC" />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  raceName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: fontFamily.heading,
  },
  circuit: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fontFamily.body,
    marginTop: 2,
  },
  countdownRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  cell: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cellValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: fontFamily.heading,
  },
  cellLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: fontFamily.bodySemi,
    letterSpacing: 1,
    marginTop: 2,
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
