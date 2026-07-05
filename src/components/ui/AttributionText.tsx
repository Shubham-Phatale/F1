import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '@/theme';

export const AttributionText: React.FC<{ text: string }> = ({ text }) => (
  <Text style={styles.text}>{text}</Text>
);

const styles = StyleSheet.create({
  text: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
});
