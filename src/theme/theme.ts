import { MD3DarkTheme } from 'react-native-paper';
import { colors } from './colors';

export const appTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.accent,
    onPrimary: '#ffffff',
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceRaised,
    onSurface: colors.textPrimary,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
    error: colors.accent,
  },
};

export type AppTheme = typeof appTheme;
