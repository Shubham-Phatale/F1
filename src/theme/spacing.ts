// Canonical spacing scale so gutters and rhythm stay consistent across screens.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

// The single horizontal inset every screen-level element should align to
// (screen headers, section headers, and cards all sit at this gutter).
export const SCREEN_GUTTER = spacing.lg; // 16
