export const colors = {
  background: '#0b0b0f',
  surface: '#14141b',
  surfaceRaised: '#1c1c26',
  border: '#26262f',
  textPrimary: '#f4f4f6',
  textSecondary: '#9a9aa4',
  textMuted: '#6b6b76',
  accent: '#dc0a2d',
  accentPressed: '#a80822',
  positive: '#21c064',
  podiumGold: '#ffd23f',
  podiumSilver: '#c8c8d0',
  podiumBronze: '#cd7f4d',
} as const;

export type AppColors = typeof colors;
