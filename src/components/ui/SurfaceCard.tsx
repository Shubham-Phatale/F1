import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, SCREEN_GUTTER } from '@/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
}

export const SurfaceCard: React.FC<Props> = ({ children, style, accentColor }) => (
  <View
    style={[
      styles.card,
      accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : null,
      style,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: SCREEN_GUTTER,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
