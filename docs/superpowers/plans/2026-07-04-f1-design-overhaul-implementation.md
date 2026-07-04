# Design Overhaul & Production Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the F1 app a production-ready dark "broadcast" theme with a crimson accent, custom fonts, flags, team colors, and OpenF1 driver photos — applied across all 11 screens via a shared design system, plus a new Credits/About screen.

**Architecture:** Build a `src/theme/` token layer (colors, typography, team colors, country codes) and a Paper MD3 dark theme. Add reusable UI components in `src/components/ui/`. Add `openF1Service` for driver headshots + team colors. Then restyle each screen to consume the design system. Existing data/Redux/navigation logic is unchanged.

**Tech Stack:** Expo SDK 54, React Native Paper (MD3 dark), `@expo-google-fonts/titillium-web` + `@expo-google-fonts/inter` + `expo-font`, Skia (existing), TypeScript, Jest (jest-expo).

## Global Constraints

- **Language:** TypeScript strict; `npm run type-check` must pass after every task
- **Tests:** jest-expo; full suite green after every task (114 baseline; new component tests add to it)
- **Theme:** dark broadcast; accent crimson `#dc0a2d`; tokens exactly as in the spec's color list
- **Fonts:** Titillium Web (headings/numbers) + Inter (body), open-license, via `@expo-google-fonts` + `expo-font`
- **Images:** driver photos via OpenF1 `headshot_url` (runtime), matched by Ergast `code` ↔ OpenF1 `name_acronym`; `DriverBadge` fallback; flags via `https://flagcdn.com/w80/{iso2}.png`; NO copyrighted images committed to the repo
- **Team colors:** static map seeded from OpenF1 official `team_colour`
- **IP:** no F1 logo, no Formula1 font, no team logos; team names as text + colors as accents; disclaimer + courtesy credits on About screen
- **Bundle:** run `npx expo export --platform android` after the font/theme task and after the final task to catch bundling issues; delete `dist/` after
- **Naming:** camelCase functions/vars, PascalCase components/types
- **Commits:** plain conventional commits; NO Co-Authored-By / Claude / AI mention

---

## Task 1: Color + typography + theme tokens

**Files:**
- Create: `src/theme/colors.ts`
- Create: `src/theme/typography.ts`
- Create: `src/theme/index.ts`
- Create: `__tests__/unit/theme/colors.test.ts`

**Interfaces:**
- Produces: `colors` object (background, surface, surfaceRaised, border, textPrimary, textSecondary, textMuted, accent, accentPressed, positive, podiumGold, podiumSilver, podiumBronze); `typeScale` object; `fontFamily` constants

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/unit/theme/colors.test.ts
import { colors } from '@/theme/colors';

describe('theme colors', () => {
  test('accent is the shifted crimson (not official F1 red)', () => {
    expect(colors.accent).toBe('#dc0a2d');
    expect(colors.accent).not.toBe('#e10600');
  });
  test('dark background and podium tokens exist', () => {
    expect(colors.background).toBe('#0b0b0f');
    expect(colors.podiumGold).toBe('#ffd23f');
    expect(colors.podiumSilver).toBe('#c8c8d0');
    expect(colors.podiumBronze).toBe('#cd7f4d');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/unit/theme/colors.test.ts --watchAll=false`
Expected: FAIL (module not found)

- [ ] **Step 3: Create the token files**

```typescript
// src/theme/colors.ts
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
```

```typescript
// src/theme/typography.ts
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
```

```typescript
// src/theme/index.ts
export { colors } from './colors';
export type { AppColors } from './colors';
export { fontFamily, typeScale } from './typography';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/unit/theme/colors.test.ts --watchAll=false`
Expected: PASS

- [ ] **Step 5: Type-check + commit**

```bash
npm run type-check
git add src/theme/ __tests__/unit/theme/
git commit -m "feat: add dark theme color and typography tokens"
```

---

## Task 2: Team colors + country codes

**Files:**
- Create: `src/theme/teamColors.ts`
- Create: `src/theme/countryCodes.ts`
- Modify: `src/theme/index.ts`
- Create: `__tests__/unit/theme/teamColors.test.ts`

**Interfaces:**
- Produces: `getTeamColor(teamNameOrId: string): string` (default `#666a73` for unknown); `getCountryIso2(country: string): string | null`
- Consumes: nothing

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/unit/theme/teamColors.test.ts
import { getTeamColor } from '@/theme/teamColors';
import { getCountryIso2 } from '@/theme/countryCodes';

describe('teamColors', () => {
  test('known teams map to their OpenF1 hex (case/space insensitive)', () => {
    expect(getTeamColor('Red Bull Racing').toLowerCase()).toBe('#3671c6');
    expect(getTeamColor('red_bull').toLowerCase()).toBe('#3671c6');
    expect(getTeamColor('Ferrari').toLowerCase()).toBe('#e8002d');
  });
  test('unknown team returns neutral default', () => {
    expect(getTeamColor('Nonexistent')).toBe('#666a73');
  });
});

describe('countryCodes', () => {
  test('maps race countries to ISO2', () => {
    expect(getCountryIso2('Bahrain')).toBe('bh');
    expect(getCountryIso2('UK')).toBe('gb');
    expect(getCountryIso2('United Kingdom')).toBe('gb');
    expect(getCountryIso2('Unknownland')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/unit/theme/teamColors.test.ts --watchAll=false`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

```typescript
// src/theme/teamColors.ts
// Official team colours seeded from OpenF1 `team_colour` (hex; colors are not protected).
// Keyed by both the constructor display name and the Ergast constructorId.
const TEAM_COLORS: Record<string, string> = {
  'red bull racing': '#3671C6',
  red_bull: '#3671C6',
  ferrari: '#E8002D',
  scuderia_ferrari: '#E8002D',
  mercedes: '#27F4D2',
  mclaren: '#FF8000',
  'aston martin': '#229971',
  aston_martin: '#229971',
  alpine: '#0093CC',
  alpine_f1_team: '#0093CC',
  williams: '#64C4FF',
  rb: '#6692FF',
  'rb f1 team': '#6692FF',
  alphatauri: '#6692FF',
  'kick sauber': '#52E252',
  sauber: '#52E252',
  'haas f1 team': '#B6BABD',
  haas: '#B6BABD',
};

const DEFAULT_TEAM_COLOR = '#666a73';

export function getTeamColor(teamNameOrId: string): string {
  if (!teamNameOrId) return DEFAULT_TEAM_COLOR;
  const key = teamNameOrId.trim().toLowerCase();
  return TEAM_COLORS[key] ?? DEFAULT_TEAM_COLOR;
}
```

```typescript
// src/theme/countryCodes.ts
// Country name -> ISO 3166-1 alpha-2 (lowercase, for flagcdn). Covers F1 race
// countries plus common Ergast spellings/aliases.
const COUNTRY_ISO2: Record<string, string> = {
  bahrain: 'bh',
  'saudi arabia': 'sa',
  australia: 'au',
  japan: 'jp',
  china: 'cn',
  usa: 'us',
  'united states': 'us',
  'united states of america': 'us',
  italy: 'it',
  monaco: 'mc',
  canada: 'ca',
  spain: 'es',
  austria: 'at',
  uk: 'gb',
  'united kingdom': 'gb',
  'great britain': 'gb',
  hungary: 'hu',
  belgium: 'be',
  netherlands: 'nl',
  azerbaijan: 'az',
  singapore: 'sg',
  mexico: 'mx',
  brazil: 'br',
  qatar: 'qa',
  'united arab emirates': 'ae',
  uae: 'ae',
  france: 'fr',
  portugal: 'pt',
  turkey: 'tr',
  germany: 'de',
};

export function getCountryIso2(country: string): string | null {
  if (!country) return null;
  return COUNTRY_ISO2[country.trim().toLowerCase()] ?? null;
}
```

Add to `src/theme/index.ts`:

```typescript
export { getTeamColor } from './teamColors';
export { getCountryIso2 } from './countryCodes';
```

- [ ] **Step 4: Run test + type-check**

Run: `npm test -- __tests__/unit/theme/teamColors.test.ts --watchAll=false`
Expected: PASS
Run: `npm run type-check` → clean

- [ ] **Step 5: Commit**

```bash
git add src/theme/ __tests__/unit/theme/teamColors.test.ts
git commit -m "feat: add team color and country code maps"
```

---

## Task 3: Fonts + Paper dark theme + app integration

**Files:**
- Create: `src/theme/theme.ts`
- Modify: `src/theme/index.ts`
- Modify: `app/index.tsx`
- Modify: `package.json` (font packages)

**Interfaces:**
- Produces: `appTheme` (Paper MD3 dark theme extended with tokens); app loads fonts before rendering
- Consumes: `colors`, `fontFamily` from Task 1

- [ ] **Step 1: Install fonts**

```bash
npx expo install @expo-google-fonts/titillium-web @expo-google-fonts/inter expo-font
```

- [ ] **Step 2: Create the Paper theme**

```typescript
// src/theme/theme.ts
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
```

Add to `src/theme/index.ts`: `export { appTheme } from './theme';`

- [ ] **Step 3: Load fonts + pass theme in app/index.tsx**

Modify `app/index.tsx`: import fonts + `useFonts`, gate render until loaded, pass `appTheme` to `PaperProvider`.

```typescript
import {
  useFonts,
  TitilliumWeb_600SemiBold,
  TitilliumWeb_700Bold,
} from '@expo-google-fonts/titillium-web';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { appTheme } from '@/theme';
```

Inside `App`, before the return:

```typescript
  const [fontsLoaded] = useFonts({
    TitilliumWeb_600SemiBold,
    TitilliumWeb_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  if (!fontsLoaded) {
    return null; // splash stays visible (SplashScreen.preventAutoHideAsync already called)
  }
```

Change `<PaperProvider>` to `<PaperProvider theme={appTheme}>`.

- [ ] **Step 4: Verify bundle + tests**

Run: `npm run type-check` → clean
Run: `npm test -- --watchAll=false 2>&1 | grep -E "Tests:|Test Suites:"` → full suite green
Run: `npx expo export --platform android 2>&1 | tail -5` → bundles cleanly (fonts are a known bundling gotcha); then `rm -rf dist`

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/theme/theme.ts src/theme/index.ts app/index.tsx
git commit -m "feat: load custom fonts and apply dark paper theme"
```

---

## Task 4: OpenF1 service (driver photos + team colors)

**Files:**
- Create: `src/services/openF1Service.ts`
- Create: `__tests__/unit/services/openF1Service.test.ts`

**Interfaces:**
- Produces: `openF1Service.getDriverMedia(code: string): Promise<{ headshotUrl: string | null; teamColour: string | null; teamName: string | null } | null>` — matches by `name_acronym`; caches the full driver list once
- Produces: `openF1Service.preload(): Promise<void>` — fetches + caches the latest session's driver list
- Consumes: axios (already a dependency)

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/unit/services/openF1Service.test.ts
import axios from 'axios';
import { OpenF1Service } from '@/services/openF1Service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const DRIVERS = [
  { name_acronym: 'VER', headshot_url: 'https://x/ver.png', team_colour: '3671C6', team_name: 'Red Bull Racing' },
  { name_acronym: 'LEC', headshot_url: 'https://x/lec.png', team_colour: 'E8002D', team_name: 'Ferrari' },
];

describe('OpenF1Service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getDriverMedia matches by acronym and normalizes team_colour to #hex', async () => {
    mockedAxios.get.mockResolvedValue({ data: DRIVERS });
    const svc = new OpenF1Service();
    const media = await svc.getDriverMedia('VER');
    expect(media?.headshotUrl).toBe('https://x/ver.png');
    expect(media?.teamColour).toBe('#3671C6');
    expect(media?.teamName).toBe('Red Bull Racing');
  });

  test('unknown acronym returns null', async () => {
    mockedAxios.get.mockResolvedValue({ data: DRIVERS });
    const svc = new OpenF1Service();
    expect(await svc.getDriverMedia('XXX')).toBeNull();
  });

  test('caches the driver list (one network call for repeated lookups)', async () => {
    mockedAxios.get.mockResolvedValue({ data: DRIVERS });
    const svc = new OpenF1Service();
    await svc.getDriverMedia('VER');
    await svc.getDriverMedia('LEC');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test('network failure resolves to null (never throws to UI)', async () => {
    mockedAxios.get.mockRejectedValue(new Error('offline'));
    const svc = new OpenF1Service();
    expect(await svc.getDriverMedia('VER')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/unit/services/openF1Service.test.ts --watchAll=false`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

```typescript
// src/services/openF1Service.ts
import axios from 'axios';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

export interface DriverMedia {
  headshotUrl: string | null;
  teamColour: string | null;
  teamName: string | null;
}

interface OpenF1Driver {
  name_acronym?: string;
  headshot_url?: string;
  team_colour?: string;
  team_name?: string;
}

export class OpenF1Service {
  private cache: Map<string, DriverMedia> | null = null;
  private inFlight: Promise<Map<string, DriverMedia>> | null = null;

  private async loadDrivers(): Promise<Map<string, DriverMedia>> {
    if (this.cache) return this.cache;
    if (this.inFlight) return this.inFlight;
    this.inFlight = (async () => {
      try {
        const res = await axios.get<OpenF1Driver[]>(
          `${OPENF1_BASE_URL}/drivers?session_key=latest`,
          { timeout: 10000 }
        );
        const map = new Map<string, DriverMedia>();
        for (const d of res.data || []) {
          if (!d.name_acronym) continue;
          map.set(d.name_acronym.toUpperCase(), {
            headshotUrl: d.headshot_url ?? null,
            teamColour: d.team_colour ? `#${d.team_colour}` : null,
            teamName: d.team_name ?? null,
          });
        }
        this.cache = map;
        return map;
      } catch (error) {
        console.error('OpenF1 driver load failed:', error);
        return new Map<string, DriverMedia>();
      } finally {
        this.inFlight = null;
      }
    })();
    return this.inFlight;
  }

  async preload(): Promise<void> {
    await this.loadDrivers();
  }

  async getDriverMedia(code: string): Promise<DriverMedia | null> {
    if (!code) return null;
    const map = await this.loadDrivers();
    return map.get(code.toUpperCase()) ?? null;
  }
}

export const openF1Service = new OpenF1Service();
```

- [ ] **Step 4: Run test + type-check**

Run: `npm test -- __tests__/unit/services/openF1Service.test.ts --watchAll=false`
Expected: PASS
Run: `npm run type-check` → clean

- [ ] **Step 5: Commit**

```bash
git add src/services/openF1Service.ts __tests__/unit/services/openF1Service.test.ts
git commit -m "feat: add openf1 service for driver photos and team colors"
```

---

## Task 5: Core UI primitives — ScreenContainer, SurfaceCard, SectionHeader, AttributionText

**Files:**
- Create: `src/components/ui/ScreenContainer.tsx`
- Create: `src/components/ui/SurfaceCard.tsx`
- Create: `src/components/ui/SectionHeader.tsx`
- Create: `src/components/ui/AttributionText.tsx`
- Create: `src/components/ui/index.ts`
- Create: `__tests__/components/ui/SectionHeader.test.tsx`

**Interfaces:**
- Produces: `ScreenContainer` (props: `children`, `scroll?: boolean`), `SurfaceCard` (`children`, `style?`, `accentColor?`), `SectionHeader` (`title: string`), `AttributionText` (`text: string`)
- Consumes: `colors`, `typeScale` from Task 1

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/ui/SectionHeader.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SectionHeader } from '@/components/ui/SectionHeader';

describe('SectionHeader', () => {
  test('renders the uppercase title text', async () => {
    await render(<SectionHeader title="Latest Race" />);
    expect(screen.getByText('Latest Race')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/components/ui/SectionHeader.test.tsx --watchAll=false`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement the four components**

```typescript
// src/components/ui/ScreenContainer.tsx
import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { colors } from '@/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
}

export const ScreenContainer: React.FC<Props> = ({ children, scroll = true }) => {
  if (scroll) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.container, styles.content]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 24 },
});
```

```typescript
// src/components/ui/SurfaceCard.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '@/theme';

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
    marginHorizontal: 12,
    marginBottom: 12,
  },
});
```

```typescript
// src/components/ui/SectionHeader.tsx
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
```

```typescript
// src/components/ui/AttributionText.tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '@/theme';

export const AttributionText: React.FC<{ text: string }> = ({ text }) => (
  <Text style={styles.text}>{text}</Text>
);

const styles = StyleSheet.create({
  text: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
});
```

```typescript
// src/components/ui/index.ts
export { ScreenContainer } from './ScreenContainer';
export { SurfaceCard } from './SurfaceCard';
export { SectionHeader } from './SectionHeader';
export { AttributionText } from './AttributionText';
```

- [ ] **Step 4: Run test + type-check**

Run: `npm test -- __tests__/components/ui/SectionHeader.test.tsx --watchAll=false`
Expected: PASS
Run: `npm run type-check` → clean

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ __tests__/components/ui/SectionHeader.test.tsx
git commit -m "feat: add core ui primitives (container, card, section header, attribution)"
```

---

## Task 6: Data-display primitives — DriverBadge, TeamColorBar, Flag, PositionBadge

**Files:**
- Create: `src/components/ui/DriverBadge.tsx`
- Create: `src/components/ui/TeamColorBar.tsx`
- Create: `src/components/ui/Flag.tsx`
- Create: `src/components/ui/PositionBadge.tsx`
- Modify: `src/components/ui/index.ts`
- Create: `__tests__/components/ui/PositionBadge.test.tsx`
- Create: `__tests__/components/ui/DriverBadge.test.tsx`

**Interfaces:**
- Produces:
  - `DriverBadge` (props: `code: string`, `teamColor?: string`, `size?: number`)
  - `TeamColorBar` (props: `color: string`, `width?: number`)
  - `Flag` (props: `country: string`, `width?: number`) — builds a flagcdn URL via `getCountryIso2`, renders nothing if unmatched
  - `PositionBadge` (props: `position: string | number`) — podium colors for 1/2/3, neutral otherwise
- Consumes: `colors` (Task 1), `getCountryIso2` (Task 2)

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/components/ui/PositionBadge.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PositionBadge } from '@/components/ui/PositionBadge';

describe('PositionBadge', () => {
  test('renders the position number', async () => {
    await render(<PositionBadge position={1} />);
    expect(screen.getByText('1')).toBeTruthy();
  });
  test('renders string positions (e.g. DNF text position)', async () => {
    await render(<PositionBadge position="3" />);
    expect(screen.getByText('3')).toBeTruthy();
  });
});
```

```typescript
// __tests__/components/ui/DriverBadge.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DriverBadge } from '@/components/ui/DriverBadge';

describe('DriverBadge', () => {
  test('renders the driver code', async () => {
    await render(<DriverBadge code="VER" teamColor="#3671C6" />);
    expect(screen.getByText('VER')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- __tests__/components/ui/PositionBadge.test.tsx __tests__/components/ui/DriverBadge.test.tsx --watchAll=false`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

```typescript
// src/components/ui/DriverBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme';

interface Props {
  code: string;
  teamColor?: string;
  size?: number;
}

export const DriverBadge: React.FC<Props> = ({ code, teamColor = colors.surfaceRaised, size = 40 }) => (
  <View
    style={[
      styles.badge,
      { width: size, height: size, borderRadius: size * 0.26, backgroundColor: teamColor },
    ]}
  >
    <Text style={[styles.text, { fontSize: size * 0.3 }]}>{code}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#ffffff', fontWeight: '800', letterSpacing: 0.5 },
});
```

```typescript
// src/components/ui/TeamColorBar.tsx
import React from 'react';
import { View } from 'react-native';

interface Props {
  color: string;
  width?: number;
}

export const TeamColorBar: React.FC<Props> = ({ color, width = 3 }) => (
  <View style={{ width, alignSelf: 'stretch', backgroundColor: color, borderRadius: width }} />
);
```

```typescript
// src/components/ui/Flag.tsx
import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { getCountryIso2 } from '@/theme';

interface Props {
  country: string;
  width?: number;
}

export const Flag: React.FC<Props> = ({ country, width = 24 }) => {
  const iso2 = getCountryIso2(country);
  if (!iso2) return null;
  const height = Math.round((width * 3) / 4);
  return (
    <Image
      source={{ uri: `https://flagcdn.com/w80/${iso2}.png` }}
      style={[styles.flag, { width, height }]}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  flag: { borderRadius: 3 },
});
```

```typescript
// src/components/ui/PositionBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme';

interface Props {
  position: string | number;
}

function podiumColor(pos: number): string {
  if (pos === 1) return colors.podiumGold;
  if (pos === 2) return colors.podiumSilver;
  if (pos === 3) return colors.podiumBronze;
  return colors.surfaceRaised;
}

export const PositionBadge: React.FC<Props> = ({ position }) => {
  const num = parseInt(String(position), 10);
  const isPodium = num >= 1 && num <= 3;
  const bg = podiumColor(num);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: isPodium ? '#1a1400' : colors.textPrimary }]}>
        {position}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontWeight: '800', fontSize: 12 },
});
```

Add all four to `src/components/ui/index.ts`:

```typescript
export { DriverBadge } from './DriverBadge';
export { TeamColorBar } from './TeamColorBar';
export { Flag } from './Flag';
export { PositionBadge } from './PositionBadge';
```

- [ ] **Step 4: Run tests + type-check**

Run: `npm test -- __tests__/components/ui/ --watchAll=false`
Expected: PASS
Run: `npm run type-check` → clean

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ __tests__/components/ui/
git commit -m "feat: add driver badge, team color bar, flag, and position badge"
```

---

## Task 7: SmartImage + dark Skeleton + redesigned StatCard

**Files:**
- Create: `src/components/ui/SmartImage.tsx`
- Create: `src/components/ui/Skeleton.tsx`
- Create: `src/components/ui/StatCard.tsx`
- Modify: `src/components/ui/index.ts`
- Create: `__tests__/components/ui/SmartImage.test.tsx`
- Create: `__tests__/components/ui/StatCard.test.tsx`

**Interfaces:**
- Produces:
  - `SmartImage` (props: `uri: string | null`, `fallback: React.ReactNode`, `width`, `height`, `borderRadius?`) — renders `Image` when `uri` set + not errored, else `fallback`
  - `Skeleton` (props: `width?`, `height?`, `count?`, `borderRadius?`) — dark shimmer
  - `StatCard` (props: `label: string`, `value: string | number`, `accent?: boolean`)
- Consumes: `colors` (Task 1)

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/components/ui/SmartImage.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SmartImage } from '@/components/ui/SmartImage';

describe('SmartImage', () => {
  test('renders fallback when uri is null', async () => {
    await render(<SmartImage uri={null} fallback={<Text>FB</Text>} width={40} height={40} />);
    expect(screen.getByText('FB')).toBeTruthy();
  });
  test('renders an image when uri is provided', async () => {
    await render(
      <SmartImage uri="https://x/p.png" fallback={<Text>FB</Text>} width={40} height={40} testID="img" />
    );
    expect(screen.getByTestId('img')).toBeTruthy();
  });
});
```

```typescript
// __tests__/components/ui/StatCard.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatCard } from '@/components/ui/StatCard';

describe('StatCard', () => {
  test('renders label and value', async () => {
    await render(<StatCard label="Points" value={575} />);
    expect(screen.getByText('Points')).toBeTruthy();
    expect(screen.getByText('575')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- __tests__/components/ui/SmartImage.test.tsx __tests__/components/ui/StatCard.test.tsx --watchAll=false`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

```typescript
// src/components/ui/SmartImage.tsx
import React, { useState } from 'react';
import { Image, View } from 'react-native';

interface Props {
  uri: string | null;
  fallback: React.ReactNode;
  width: number;
  height: number;
  borderRadius?: number;
  testID?: string;
}

export const SmartImage: React.FC<Props> = ({ uri, fallback, width, height, borderRadius = 0, testID }) => {
  const [errored, setErrored] = useState(false);
  if (!uri || errored) {
    return <View style={{ width, height }}>{fallback}</View>;
  }
  return (
    <Image
      testID={testID}
      source={{ uri }}
      style={{ width, height, borderRadius }}
      onError={() => setErrored(true)}
      resizeMode="cover"
    />
  );
};
```

```typescript
// src/components/ui/Skeleton.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '@/theme';

interface Props {
  width?: number;
  height?: number;
  count?: number;
  borderRadius?: number;
}

export const Skeleton: React.FC<Props> = ({ width, height = 80, count = 1, borderRadius = 12 }) => {
  const screen = useWindowDimensions();
  const w = width ?? screen.width - 24;
  const shimmer = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={[styles.box, { width: w, height, borderRadius, opacity: shimmer }]}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surfaceRaised, marginHorizontal: 12, marginBottom: 12 },
});
```

```typescript
// src/components/ui/StatCard.tsx
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
```

Add all three to `src/components/ui/index.ts`:

```typescript
export { SmartImage } from './SmartImage';
export { Skeleton } from './Skeleton';
export { StatCard } from './StatCard';
```

- [ ] **Step 4: Run tests + type-check**

Run: `npm test -- __tests__/components/ui/ --watchAll=false`
Expected: PASS
Run: `npm run type-check` → clean

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ __tests__/components/ui/
git commit -m "feat: add smart image, dark skeleton, and restyled stat card"
```

---

## Task 8: Restyle RaceCard + Home + Calendar

**Files:**
- Modify: `src/components/race/RaceCard.tsx`
- Modify: `src/screens/home/HomeScreen.tsx`
- Modify: `src/screens/calendar/CalendarScreen.tsx`

**Interfaces:**
- Consumes: `ScreenContainer`, `SurfaceCard`, `SectionHeader`, `StatCard`, `DriverBadge`, `Flag`, `Skeleton` (Tasks 5–7), `getTeamColor` (Task 2)

- [ ] **Step 1: Restyle RaceCard**

Rewrite `src/components/race/RaceCard.tsx` to use `SurfaceCard` + `Flag` + theme tokens. Keep the `race: Race`, `onPress?` props. Show race name (heading font), flag + locality/country (guarded — keep the existing `race.circuit?.location` guard), date, circuit name. Use `colors.accent` left border via `SurfaceCard accentColor`.

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Race } from '../../types';
import { formatDate, formatTime } from '../../utils/formatters';
import { SurfaceCard, Flag } from '@/components/ui';
import { colors, fontFamily } from '@/theme';

interface RaceCardProps {
  race: Race;
  onPress?: () => void;
  highlight?: boolean;
}

const RaceCard: React.FC<RaceCardProps> = ({ race, onPress, highlight = false }) => {
  const country = race.circuit?.location?.country ?? '';
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <SurfaceCard accentColor={highlight ? colors.accent : undefined}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{race.raceName}</Text>
          {country ? <Flag country={country} width={26} /> : null}
        </View>
        <Text style={styles.circuit}>{race.circuit?.circuitName ?? 'TBD'}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {race.circuit?.location
              ? `${race.circuit.location.locality}, ${country}`
              : 'Location TBD'}
          </Text>
          <Text style={styles.meta}>
            {formatDate(race.date)} · {formatTime(race.time)}
          </Text>
        </View>
      </SurfaceCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: 16, fontFamily: fontFamily.heading, flex: 1 },
  circuit: { color: colors.textSecondary, fontSize: 12, marginTop: 4, fontFamily: fontFamily.body },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  meta: { color: colors.textMuted, fontSize: 11, fontFamily: fontFamily.body },
});

export default RaceCard;
```

- [ ] **Step 2: Restyle HomeScreen**

Modify `src/screens/home/HomeScreen.tsx`: replace the outer `ScrollView` with `ScreenContainer`, section titles with `SectionHeader`, the leader card with `SurfaceCard` + `DriverBadge` (using `getTeamColor(championshipLeader.constructors[0]?.name)`), and stat cells with the new `StatCard`. Keep all existing data selectors, effects, and the loading/empty logic. Replace old `SkeletonLoader` import with the new `Skeleton`. Keep `formatPosition`/`formatPoints` usage.

Key snippet for the leader card:

```typescript
import { ScreenContainer, SectionHeader, SurfaceCard, StatCard, DriverBadge, Skeleton } from '@/components/ui';
import { getTeamColor } from '@/theme';
// ...
<SurfaceCard>
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
    <DriverBadge
      code={championshipLeader.driver.code || championshipLeader.driver.familyName.slice(0, 3).toUpperCase()}
      teamColor={getTeamColor(championshipLeader.constructors[0]?.name ?? '')}
    />
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#f4f4f6', fontWeight: '700' }}>
        {championshipLeader.driver.givenName} {championshipLeader.driver.familyName}
      </Text>
      <Text style={{ color: '#9a9aa4', fontSize: 12 }}>
        {championshipLeader.constructors[0]?.name ?? 'Team TBD'}
      </Text>
    </View>
  </View>
  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
    <StatCard label="Position" value={formatPosition(championshipLeader.position)} accent />
    <StatCard label="Points" value={formatPoints(championshipLeader.points)} />
    <StatCard label="Wins" value={championshipLeader.wins} />
  </View>
</SurfaceCard>
```

- [ ] **Step 3: Restyle CalendarScreen**

Modify `src/screens/calendar/CalendarScreen.tsx`: use `ScreenContainer`, keep the season segmented control + fetch logic, render `RaceCard` for each race with `highlight` on the next upcoming race (first race whose `date >= today`; compute via `new Date(race.date) >= new Date()` — first match). Replace `SkeletonLoader` with `Skeleton`.

- [ ] **Step 4: Verify**

Run: `npm run type-check` → clean
Run: `npm test -- --watchAll=false 2>&1 | grep -E "Tests:|Test Suites:"` → full suite green (update the existing `RaceCard.test.tsx` if the location text assertion changed; keep assertions real)

- [ ] **Step 5: Commit**

```bash
git add src/components/race/RaceCard.tsx src/screens/home/ src/screens/calendar/ __tests__/components/race/RaceCard.test.tsx
git commit -m "feat: restyle race card, home, and calendar with dark theme"
```

---

## Task 9: Restyle Standings + DriverRow + ConstructorRow

**Files:**
- Modify: `src/components/race/DriverRow.tsx`
- Modify: `src/components/race/ConstructorRow.tsx`
- Modify: `src/screens/standings/StandingsScreen.tsx`

**Interfaces:**
- Consumes: `ScreenContainer`, `PositionBadge`, `DriverBadge`, `TeamColorBar`, `Skeleton`, `getTeamColor`

- [ ] **Step 1: Restyle DriverRow**

Rewrite `src/components/race/DriverRow.tsx` to a dark row: `PositionBadge` (position), `DriverBadge` (code, team color via `getTeamColor(standing.constructors[0]?.name)`), name + team, points on the right. Keep the `standing: DriverStanding`, `index: number` props and the optional `onPress`. Keep the `<Pressable>` wrapper and the divider logic (index-based). Use theme tokens.

- [ ] **Step 2: Restyle ConstructorRow**

Rewrite `src/components/race/ConstructorRow.tsx`: `PositionBadge`, `TeamColorBar` (via `getTeamColor(standing.constructor.name)`), team name + nationality, points. Keep props (`standing: ConstructorStanding`, `index`, optional `onPress`) and the `Pressable` wrapper.

- [ ] **Step 3: Restyle StandingsScreen**

Modify `src/screens/standings/StandingsScreen.tsx`: wrap in `ScreenContainer`, keep the `SegmentedButtons` toggle + fetch logic + navigation (driver→DriverDetail, constructor→ConstructorAnalysis) + the "Compare Drivers" button. Replace `SkeletonLoader` with `Skeleton`.

- [ ] **Step 4: Verify**

Run: `npm run type-check` → clean
Run: `npm test -- --watchAll=false 2>&1 | grep -E "Tests:|Test Suites:"` → full suite green (update `DriverRow.test.tsx` assertions if row structure changed; keep them real — assert driver name + points still render)

- [ ] **Step 5: Commit**

```bash
git add src/components/race/DriverRow.tsx src/components/race/ConstructorRow.tsx src/screens/standings/ __tests__/components/race/DriverRow.test.tsx
git commit -m "feat: restyle standings rows and screen with dark theme"
```

---

## Task 10: Restyle Race Details (styled circuit header) + Results/LapTime tables

**Files:**
- Modify: `src/screens/race-details/RaceDetailsScreen.tsx`
- Modify: `src/components/race/ResultsTable.tsx`
- Modify: `src/components/race/LapTimeTable.tsx`

**Interfaces:**
- Consumes: `ScreenContainer`, `SurfaceCard`, `Flag`, `PositionBadge`, `SectionHeader`, `colors`

- [ ] **Step 1: Styled circuit header**

Modify `src/screens/race-details/RaceDetailsScreen.tsx`: replace the header block with a styled header — a `SurfaceCard`-like banner (dark surface, crimson accent bar) showing race name (heading font), `Flag` + `locality, country` (keep the existing `race.circuit?.location` guard from the earlier fix), and date. Wrap the screen in `ScreenContainer`. Keep the results/qualifying `SegmentedButtons` + fetch logic.

- [ ] **Step 2: Restyle ResultsTable**

Modify `src/components/race/ResultsTable.tsx`: dark rows, `PositionBadge` for position, driver name + team (muted), fastest-lap highlighted with `colors.positive`, points/status on the right. Keep the `results: RaceResult[]` prop and the `isRaceFinished`/`getRaceStatus`/`formatPoints` usage.

- [ ] **Step 3: Restyle LapTimeTable**

Modify `src/components/race/LapTimeTable.tsx`: dark rows, position, driver name + team, best-of Q3/Q2/Q1 time in `colors.accent`. Keep the `results: QualifyingResult[]`, `title?` props.

- [ ] **Step 4: Verify**

Run: `npm run type-check` → clean
Run: `npm test -- --watchAll=false 2>&1 | grep -E "Tests:|Test Suites:"` → full suite green

- [ ] **Step 5: Commit**

```bash
git add src/screens/race-details/ src/components/race/ResultsTable.tsx src/components/race/LapTimeTable.tsx
git commit -m "feat: restyle race details, results, and qualifying tables"
```

---

## Task 11: Restyle analytics screens + TrendChart (dark) + driver photo header

**Files:**
- Modify: `src/components/analytics/TrendChart.tsx`
- Modify: `src/components/analytics/DriverDashboard.tsx`
- Modify: `src/components/analytics/HeadToHeadCard.tsx`
- Modify: `src/components/analytics/ConstructorComparison.tsx`
- Modify: `src/screens/driver-detail/DriverDetailScreen.tsx`
- Modify: `src/screens/head-to-head/HeadToHeadScreen.tsx`
- Modify: `src/screens/trend-analysis/TrendAnalysisScreen.tsx`
- Modify: `src/screens/constructor-analysis/ConstructorAnalysisScreen.tsx`

**Interfaces:**
- Consumes: `ScreenContainer`, `SurfaceCard`, `StatCard`, `DriverBadge`, `SmartImage`, `SectionHeader`, `colors`, `getTeamColor`, `openF1Service`

- [ ] **Step 1: Restyle TrendChart to the dark palette**

Modify `src/components/analytics/TrendChart.tsx`: grid lines `colors.border`, data line `colors.accent`, points `colors.accent`, background transparent (sits on dark surface), axis/labels `colors.textMuted`. Keep props (`trendData`, `metric`, `height`).

- [ ] **Step 2: Driver photo header in DriverDetailScreen**

Modify `src/screens/driver-detail/DriverDetailScreen.tsx`: add a header that fetches `openF1Service.getDriverMedia(driver.code)` in an effect (local state), and renders `SmartImage` with the headshot (fallback = `DriverBadge` with team color) + driver name + team color. Wrap in `ScreenContainer`. Keep the existing stats/trend fetch + dashboard + "View Performance Trends" button.

```typescript
import { openF1Service } from '@/services/openF1Service';
import { SmartImage, DriverBadge } from '@/components/ui';
import { getTeamColor } from '@/theme';
// in component:
const [media, setMedia] = useState<{ headshotUrl: string | null; teamColour: string | null } | null>(null);
useEffect(() => {
  let alive = true;
  if (driver?.code) {
    openF1Service.getDriverMedia(driver.code).then(m => { if (alive) setMedia(m); });
  }
  return () => { alive = false; };
}, [driver?.code]);
const teamColor = media?.teamColour ?? getTeamColor(/* team name if available */ '');
// header:
<SmartImage
  uri={media?.headshotUrl ?? null}
  width={96}
  height={96}
  borderRadius={14}
  fallback={<DriverBadge code={driver?.code ?? '??'} teamColor={teamColor} size={96} />}
/>
```

- [ ] **Step 3: Restyle the three analytics components + remaining screens**

- `DriverDashboard.tsx`: use `StatCard` + `SurfaceCard` + tokens (keep `stats: DriverStats`, `driverName?`).
- `HeadToHeadCard.tsx`: dark surfaces, `DriverBadge` for each driver, crimson vs neutral comparison rows (keep `comparison` prop).
- `ConstructorComparison.tsx`: team-color header via `getTeamColor(stats.constructor.name)`, `StatCard` grid (keep `stats` prop).
- `HeadToHeadScreen.tsx`, `TrendAnalysisScreen.tsx`, `ConstructorAnalysisScreen.tsx`: wrap in `ScreenContainer`, restyle chrome (headers, segmented controls, skeletons → `Skeleton`). Keep all fetch/compute logic and props.

- [ ] **Step 4: Verify (incl. bundle — Skia + fonts + images together)**

Run: `npm run type-check` → clean
Run: `npm test -- --watchAll=false 2>&1 | grep -E "Tests:|Test Suites:"` → full suite green
Run: `npx expo export --platform android 2>&1 | tail -5` → bundles cleanly; then `rm -rf dist`

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/ src/screens/driver-detail/ src/screens/head-to-head/ src/screens/trend-analysis/ src/screens/constructor-analysis/
git commit -m "feat: restyle analytics screens, dark trend chart, and driver photo header"
```

---

## Task 12: Restyle auth + profile screens

**Files:**
- Modify: `src/components/auth/AuthForm.tsx`
- Modify: `src/screens/auth/LoginScreen.tsx`
- Modify: `src/screens/auth/RegisterScreen.tsx`
- Modify: `src/screens/profile/ProfileScreen.tsx`

**Interfaces:**
- Consumes: `ScreenContainer`, `SurfaceCard`, `DriverBadge`, `colors`, `getTeamColor`

- [ ] **Step 1: Restyle AuthForm**

Modify `src/components/auth/AuthForm.tsx`: keep all validation + props exactly; restyle to dark — Paper `TextInput` `mode="outlined"` already themes via `appTheme`; make the submit `Button` use `colors.accent` (it will, as `primary`); server-error text `colors.accent`. Ensure the existing `AuthForm.test.tsx` still passes (don't change field labels/testIDs).

- [ ] **Step 2: Restyle Login/Register screens**

Modify `LoginScreen.tsx` + `RegisterScreen.tsx`: wrap in `ScreenContainer` (scroll), add a small wordmark ("F1·LIVE") + the disclaimer line *"Unofficial · Not affiliated with Formula 1"* under the form. Keep all auth logic, navigation, and the Firestore/long-polling fixes intact.

- [ ] **Step 3: Restyle ProfileScreen**

Modify `src/screens/profile/ProfileScreen.tsx`: dark `SurfaceCard`, avatar via `DriverBadge` (initials from displayName), favorite driver/team with team color, edit + logout buttons. Add a link/button to navigate to the new `About` screen (added in Task 13 — add the route usage here but the screen is created next task; to keep this task type-checking, add `About` to the param list now). Keep all profile logic.

Add `About: undefined` to the appropriate param list in `src/navigation/types.ts` in this task so the navigate call type-checks.

- [ ] **Step 4: Verify**

Run: `npm run type-check` → clean
Run: `npm test -- --watchAll=false 2>&1 | grep -E "Tests:|Test Suites:"` → full suite green (AuthForm test must stay green)

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/ src/screens/auth/ src/screens/profile/ src/navigation/types.ts
git commit -m "feat: restyle auth and profile screens with dark theme"
```

---

## Task 13: Credits/About screen + disclaimer + navigation + README

**Files:**
- Create: `src/screens/about/AboutScreen.tsx`
- Modify: `src/navigation/RootNavigator.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `ScreenContainer`, `SurfaceCard`, `SectionHeader`, `AttributionText`, `colors`
- Consumes: `About` route added to param list in Task 12

- [ ] **Step 1: Create AboutScreen**

```typescript
// src/screens/about/AboutScreen.tsx
import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { ScreenContainer, SurfaceCard, SectionHeader, AttributionText } from '@/components/ui';
import { colors, fontFamily } from '@/theme';

const AboutScreen: React.FC = () => (
  <ScreenContainer>
    <View style={styles.header}>
      <Text style={styles.title}>F1·LIVE</Text>
      <Text style={styles.subtitle}>Unofficial F1 stats companion</Text>
    </View>
    <SectionHeader title="Disclaimer" />
    <SurfaceCard>
      <Text style={styles.body}>
        This is an unofficial, personal project. It is not affiliated with, endorsed by, or
        associated with Formula 1, the FIA, Formula One Licensing BV, or any Formula 1 team.
        &quot;F1&quot; and &quot;Formula 1&quot; are trademarks of their respective owners.
      </Text>
    </SurfaceCard>
    <SectionHeader title="Data & Images" />
    <SurfaceCard>
      <Text style={styles.body}>Race &amp; timing data via the Ergast / Jolpica API and OpenF1.</Text>
      <AttributionText text="Data: OpenF1 (CC-BY 4.0)" />
      <AttributionText text="Driver images © Formula 1, served via the OpenF1 API" />
      <AttributionText text="Flags via flagcdn.com" />
    </SurfaceCard>
  </ScreenContainer>
);

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { color: colors.textPrimary, fontSize: 26, fontFamily: fontFamily.heading },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: fontFamily.body },
});

export default AboutScreen;
```

- [ ] **Step 2: Register the About route**

Modify `src/navigation/RootNavigator.tsx`: import `AboutScreen`, add `<Stack.Screen name="About" component={AboutScreen} options={{ headerShown: true, title: 'About' }} />`.

- [ ] **Step 3: Add the disclaimer to README**

Add a section to `README.md`:

```markdown
## Disclaimer

This is an unofficial, personal, non-commercial project. It is not affiliated with,
endorsed by, or associated with Formula 1, the FIA, or any Formula 1 team. "F1" and
"Formula 1" are trademarks of Formula One Licensing BV. Race data is provided by the
Ergast/Jolpica API and OpenF1 (CC-BY). Driver images are served via the OpenF1 API.
```

(If `README.md` does not exist, create it with a short project title + the disclaimer.)

- [ ] **Step 4: Verify**

Run: `npm run type-check` → clean
Run: `npm test -- --watchAll=false 2>&1 | grep -E "Tests:|Test Suites:"` → full suite green

- [ ] **Step 5: Commit**

```bash
git add src/screens/about/ src/navigation/RootNavigator.tsx README.md
git commit -m "feat: add credits/about screen with disclaimer and attributions"
```

---

## Task 14: Final verification + on-device checklist

**Files:** none (verification)

- [ ] **Step 1: Full gates**

Run: `npm run type-check` → clean
Run: `npm test -- --watchAll=false 2>&1 | grep -E "Tests:|Test Suites:"` → full suite green
Run: `npm run lint` → no errors (warnings acceptable)
Run: `npx expo export --platform android 2>&1 | tail -5` → bundles cleanly; then `rm -rf dist`

- [ ] **Step 2: Old-component cleanup check**

Search for leftover references to the old skeleton/statcard so nothing imports removed styles:

Run: `grep -rn "components/common/SkeletonLoader\|components/race/StatCard" src/ || echo "clean"`
Expected: `clean` (or update any stragglers to `@/components/ui`). Do NOT delete the old files if still imported by tests; if fully unused, remove them and their now-obsolete tests.

- [ ] **Step 3: On-device smoke test (manual, by the user)**

Document the checklist in the task completion notes:
- Home / Calendar / Standings / Race Details render dark theme + flags
- Driver Detail shows a photo (current driver) or badge fallback (older driver)
- Head-to-Head / Trend / Constructor render dark + charts
- Login / Register / Profile / About render dark; disclaimer visible
- No crash on a driver/circuit with missing data (fallbacks work)

- [ ] **Step 4: Final commit (if any cleanup)**

```bash
git add -A
git commit -m "chore: final design-overhaul cleanup and verification"
```

---

## Success Criteria

- All 11 screens + About render in the dark crimson theme via the shared design system
- Fonts load; flags, team colors, and OpenF1 driver photos display; missing images fall back to badges
- About screen shows disclaimer + attributions; README has the disclaimer
- No F1 logo/font/exact-red; team colors only (no logos); no copyrighted images committed
- Type-check clean, full test suite green (≥114 + new UI tests), Android bundle exports
- App looks production-ready on device
