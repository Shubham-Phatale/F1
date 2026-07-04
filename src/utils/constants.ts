// The original Ergast API (ergast.com) was deprecated and shut down.
// Jolpica is the free, community-run drop-in replacement using the identical
// Ergast JSON response format. See https://github.com/jolpica/jolpica-f1
export const ERGAST_API_BASE_URL = 'https://api.jolpi.ca/ergast/f1';
export const API_TIMEOUT = 10000; // 10 seconds
export const CACHE_DURATION = 300000; // 5 minutes
export const RACE_ACTIVE_WINDOW = 7200000; // 2 hours (for real-time polling)
