export const fontFamily = {
  heading: 'TitilliumWeb_700Bold',
  headingSemi: 'TitilliumWeb_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;

export const typeScale = {
  display: { fontSize: 32, fontFamily: fontFamily.heading },
  h1: { fontSize: 24, fontFamily: fontFamily.heading },
  h2: { fontSize: 18, fontFamily: fontFamily.headingSemi },
  body: { fontSize: 14, fontFamily: fontFamily.body },
  label: {
    fontSize: 11,
    fontFamily: fontFamily.bodySemi,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
} as const;
