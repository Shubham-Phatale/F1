# F1 App — Design Overhaul & Production Polish — Design Spec

**Date:** 2026-07-04
**Status:** Approved
**Owner:** Shubham Phatale

---

## Goal

Transform the working F1 stats app into a production-ready, visually striking product with a **dark "broadcast" theme**, a **crimson accent**, and **imagery** (flags, team colors, licensed photos) — while staying clear of Formula 1 / FIA / team **copyright and trademark** infringement. All 11 screens are redesigned via a shared design system.

## Non-Goals

- No new features/data (this is visual + asset work, not new screens beyond a Credits/About screen)
- No Firebase Storage (images are bundled assets + remote flags)
- No official F1 branding, logos, fonts, or exact color/UI cloning

---

## Decisions (locked)

| Topic | Decision |
|-------|----------|
| App name | Keep "F1" descriptively + disclaimer (avoid logo/font — the enforced elements) |
| Theme | Dark broadcast |
| Accent | Crimson `#dc0a2d` (shifted off official `#e10600`) |
| Fonts | Titillium Web (headings/numbers) + Inter (body) — both open-license via `@expo-google-fonts` |
| Flags | flagcdn.com remote URLs |
| Team identity | Team **names as text** + team **colors** as accents; **no team logos** |
| Driver/circuit photos | **Bundled** CC/public-domain assets, with attribution + badge fallback |
| Scope | Full redesign, all 11 screens, via shared design system |

---

## Design System

### Color tokens (`src/theme/colors.ts`)
```
background      #0b0b0f
surface         #14141b
surfaceRaised   #1c1c26
border          #26262f
textPrimary     #f4f4f6
textSecondary   #9a9aa4
textMuted       #6b6b76
accent          #dc0a2d
accentPressed   #a80822
positive        #21c064
podiumGold      #ffd23f
podiumSilver    #c8c8d0
podiumBronze    #cd7f4d
```

### Typography (`src/theme/typography.ts`)
- Fonts loaded via `@expo-google-fonts/titillium-web` + `@expo-google-fonts/inter`, using `expo-font` `useFonts`
- App renders a splash/loading state until fonts load
- Scale: Display 32/700 · H1 24/700 · H2 18/600 · Body 14/400 · Label 11/600 (uppercase, +1 letter-spacing) · Mono-ish tabular numbers for stats

### Theme integration
- A `theme.ts` builds a React Native Paper **MD3 dark theme** extended with our tokens + fonts
- `PaperProvider` (already added) receives this theme
- A `ThemeProvider`/tokens module exports raw tokens for non-Paper styling
- Snapshot test locks the token values

### Core reusable components (`src/components/ui/`)
| Component | Purpose |
|-----------|---------|
| `ScreenContainer` | Safe-area + dark background wrapper |
| `SurfaceCard` | Themed card surface |
| `SectionHeader` | Uppercase, letter-spaced section label |
| `StatCard` | Redesigned stat display (label + big number) |
| `DriverBadge` | Driver initials on team-color background |
| `TeamColorBar` | Vertical/dot team-color accent |
| `Flag` | Country flag via flagcdn (with country→ISO2 lookup) |
| `PositionBadge` | Position number, podium-colored for top 3 |
| `SmartImage` | Bundled image with graceful fallback to badge/placeholder |
| `Skeleton` (dark) | Dark-theme loading skeleton |
| `AttributionText` | Small "Photo: author, license" line |

---

## Imagery & Assets

### Structure
```
assets/
├── images/
│   ├── drivers/{driverId}.jpg       curated CC/PD headshots (current-season set)
│   └── circuits/{circuitId}.jpg     curated CC/PD circuit photos
├── attributions.json                { id: { author, license, sourceUrl } }
src/theme/
├── teamColors.ts                    constructorId → hex (colors are not protected)
├── countryCodes.ts                  country name → ISO2 (for flagcdn)
```

### Rules
- **Flags:** `https://flagcdn.com/w80/{iso2}.png` (remote, cached). Country-name→ISO2 map covers all race countries.
- **Photos:** bundled; `SmartImage` shows the asset if present, else falls back to `DriverBadge` (drivers) or a themed placeholder (circuits). Never crashes on a missing image.
- **Attribution:** every bundled image has an entry in `attributions.json`; the Credits screen renders all of them. Required for CC-BY / CC-BY-SA.
- **Curation:** images sourced from Wikimedia Commons, **only** PD / CC0 / CC-BY / CC-BY-SA licenses, vetted at curation time. Non-free → skipped (badge fallback).

---

## Screen Redesigns (all 11 + 1 new)

**Core**
- **Home** — dark hero; "Latest Race" card (flag, crimson accent bar, circuit); "Championship Leader" card (driver badge, team color, points); quick-stat pills.
- **Calendar** — race cards with flag, round badge, date; next race highlighted in crimson; past/upcoming states.
- **Standings** — driver rows: `PositionBadge` (podium colors top 3), `DriverBadge`, `TeamColorBar`, points; constructor rows: team-color accent. Restyled segmented toggle.
- **Race Details** — circuit photo header (`SmartImage`) with overlay title + flag; results table with position badges + fastest-lap highlight; qualifying tab.

**Analytics**
- **Driver Detail** — driver photo header + team color; stat grid (`StatCard`); Skia `TrendChart` restyled to dark palette (crimson line, subtle grid, muted axis).
- **Head-to-Head** — two driver badges/photos opposed; comparison bars in crimson vs neutral; winner highlight.
- **Trend Analysis** — dark Skia chart; restyled metric `SegmentedButtons`.
- **Constructor Analysis** — team-color-themed header; stat grid.

**Account**
- **Profile** — dark card; avatar (`DriverBadge`-style initials); favorite driver/team with color; edit + logout.
- **Login / Register** — dark `AuthForm`; crimson primary button; subtle wordmark + disclaimer line.

**New**
- **Credits/About** (from Profile) — disclaimer text + full image attribution list.

Each screen swaps to shared components + tokens; layout logic is mostly unchanged.

---

## IP-Safety Checklist (enforced during build)

- No F1 logo; no Formula1 proprietary font (Titillium Web/Inter only)
- Crimson `#dc0a2d` (distinct from official red)
- Team **names as text**, **colors** as accents; **no team logos**
- Disclaimer on About screen, app footer, and README: *"Unofficial app. Not affiliated with Formula 1, the FIA, or any team. Race data via the Ergast/Jolpica API."*
- Image attribution screen (author + license per image)
- Only CC/PD bundled images, vetted at curation

---

## Testing & Verification

- `npm run type-check` clean and full Jest suite green (114 baseline) after every task
- Component tests for new UI pieces: `DriverBadge`, `Flag`, `PositionBadge`, `SmartImage` (fallback path), `PositionBadge` podium coloring
- Theme-token **snapshot** test (guards accidental palette drift)
- `npx expo export --platform android` after adding fonts + theme (font bundling is a known gotcha)
- On-device smoke test per screen (device testing is the only reliable check — proven this session)

---

## Architecture Notes / Risks

- **Font loading:** the app must wait for `useFonts` before rendering text-heavy screens, or show a splash; unloaded custom fonts render as system fallback (acceptable) — but we gate on load for polish.
- **Bundle size:** bundled photos increase app size; keep images web-optimized (~50–100 KB each), current-season set only.
- **Missing images:** `SmartImage` fallback is mandatory so partial asset coverage never breaks a screen (we already saw how one missing field white-screened the app).
- **Redux-persist:** theme is not persisted; no migration needed. Data-shape unchanged, so no persist-version bump required for this work.

---

## Success Criteria

- All 11 screens render in the dark crimson theme via the shared design system
- Flags, team colors, and (where available) licensed photos display; missing images fall back gracefully
- Credits/About screen shows disclaimer + attributions
- No F1 logo/font/exact-red; team colors only (no logos)
- Type-check clean, full suite green, Android bundle exports
- App looks production-ready on device
