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
