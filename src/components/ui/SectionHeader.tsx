import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typeScale } from '@/theme';

export const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.header}>{title}</Text>
);

const styles = StyleSheet.create({
  header: {
    ...typeScale.label,
    color: colors.textMuted,
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
});
