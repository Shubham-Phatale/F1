import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontFamily } from '@/theme';

interface Props {
  label: string;
  value: string | number;
  accent?: boolean;
}

export const StatCard: React.FC<Props> = ({ label, value, accent = false }) => (
  <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, accent && { color: colors.accent }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12 },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fontFamily.bodySemi,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  value: { color: colors.textPrimary, fontSize: 20, fontFamily: fontFamily.heading },
});
