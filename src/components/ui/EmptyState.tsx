import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontFamily } from '@/theme';

interface Props {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
}

/**
 * Centered empty-state placeholder: a rounded icon tile, a bold title, and an
 * optional muted subtitle. Replaces bare "No … yet" gray text throughout the
 * app (shared component #9).
 */
export const EmptyState: React.FC<Props> = ({ icon, title, subtitle }) => (
  <View style={styles.container}>
    <View style={styles.iconTile}>
      <MaterialIcons name={icon} size={28} color={colors.textMuted} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fontFamily.headingSemi,
    fontSize: 16,
    marginTop: 14,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.body,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default EmptyState;
