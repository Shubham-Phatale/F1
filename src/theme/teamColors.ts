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
