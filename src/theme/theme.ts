import { MD3DarkTheme } from 'react-native-paper';
import { DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
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

// React Navigation has its own theme system (separate from Paper). This themes
// the stack headers (app bar) and the bottom tab bar so they follow the dark
// palette instead of the default white. `card` drives header + tab-bar bg.
export const navigationTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.accent,
  },
};
