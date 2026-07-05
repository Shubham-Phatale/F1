import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SurfaceCard, DriverBadge } from '@/components/ui';
import { colors, fontFamily } from '@/theme';
import type { Prediction } from '@/types';

interface PredictionCardProps {
  prediction: Prediction;
  actualPodium?: [string, string, string];
}

function code(driverId: string): string {
  return driverId ? driverId.slice(0, 3).toUpperCase() : '--';
}

const PODIUM_LABELS = ['P1', 'P2', 'P3'] as const;

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  actualPodium,
}) => {
  const scored = prediction.status === 'scored';
  const picks: [string, string, string] = [
    prediction.p1,
    prediction.p2,
    prediction.p3,
  ];

  return (
    <SurfaceCard>
      <View style={styles.header}>
        <Text style={styles.round}>Round {prediction.round}</Text>
        {scored && (
          <Text style={styles.points}>
            {prediction.pointsEarned ?? 0} pts
          </Text>
        )}
      </View>

      <Text style={styles.sectionLabel}>Your podium</Text>
      <View style={styles.podiumRow}>
        {picks.map((driverId, i) => (
          <View key={`pick-${i}`} style={styles.podiumSlot}>
            <Text style={styles.slotLabel}>{PODIUM_LABELS[i]}</Text>
            <DriverBadge code={code(driverId)} size={36} />
          </View>
        ))}
      </View>

      {scored && actualPodium && (
        <>
          <Text style={styles.sectionLabel}>Actual podium</Text>
          <View style={styles.podiumRow}>
            {actualPodium.map((driverId, i) => (
              <View key={`actual-${i}`} style={styles.podiumSlot}>
                <Text style={styles.slotLabel}>{PODIUM_LABELS[i]}</Text>
                <DriverBadge code={code(driverId)} size={36} />
              </View>
            ))}
          </View>
        </>
      )}
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  round: {
    color: colors.textPrimary,
    fontFamily: fontFamily.heading,
    fontSize: 16,
  },
  points: {
    color: colors.accent,
    fontFamily: fontFamily.heading,
    fontSize: 16,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4,
  },
  podiumRow: {
    flexDirection: 'row',
    gap: 16,
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
});
