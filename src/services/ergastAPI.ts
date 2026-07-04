import axios, { AxiosInstance } from 'axios';
import { ERGAST_API_BASE_URL, API_TIMEOUT } from '@/utils/constants';
import {
  Race,
  RaceResult,
  QualifyingResult,
  StandingsTable,
  Driver,
  ErgastResponse,
} from '@/types';

export class ErgastService {
  private api: AxiosInstance;

  // In-memory cache of fully-aggregated season results, keyed by season.
  // Repeat calls for the same season are served from here to respect the
  // free jolpica API's rate limits.
  private seasonResultsCache: Map<string, RaceResult[]> = new Map();

  // In-memory cache of a driver's per-season standings, keyed by
  // `driverId + '|' + seasons.join(',')`. Repeat calls for the same driver +
  // season set are served from here to respect the free jolpica API's rate limits.
  private driverSeasonStandingsCache: Map<
    string,
    Array<{ season: string; points: number; position: number; wins: number }>
  > = new Map();

  constructor() {
    this.api = axios.create({
      baseURL: ERGAST_API_BASE_URL,
      timeout: API_TIMEOUT,
      responseType: 'json',
    });
  }

  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    }
    throw lastError;
  }

  async getCurrentSeason(): Promise<string> {
    return this.withRetry(async () => {
      try {
        const response = await this.api.get<ErgastResponse<any>>('/current.json');
        const races = response.data.MRData.RaceTable?.Races || [];
        if (races.length > 0) {
          return races[0].season;
        }
        return new Date().getFullYear().toString();
      } catch (error) {
        console.error('Failed to get current season:', error);
        throw error;
      }
    });
  }

  async getRacesByYear(year: string): Promise<Race[]> {
    return this.withRetry(async () => {
      try {
        const response = await this.api.get<ErgastResponse<any>>(`/${year}.json`, {
          params: { limit: 100 },
        });
        const races = response.data.MRData.RaceTable?.Races || [];
        return races.map((race: any) => this.transformRace(race));
      } catch (error) {
        console.error(`Failed to get races for year ${year}:`, error);
        throw error;
      }
    });
  }

  async getStandings(season: string, round?: string): Promise<StandingsTable> {
    // The combined `/{season}/standings.json` endpoint does NOT exist on jolpica
    // (returns HTTP 400). Driver and constructor standings must be fetched from
    // two separate endpoints and merged into the StandingsTable shape.
    const driverPath = round
      ? `/${season}/${round}/driverStandings.json`
      : `/${season}/driverStandings.json`;
    const constructorPath = round
      ? `/${season}/${round}/constructorStandings.json`
      : `/${season}/constructorStandings.json`;

    try {
      const [driverResponse, constructorResponse] = await Promise.all([
        this.withRetry(() => this.api.get<ErgastResponse<any>>(driverPath)),
        this.withRetry(() => this.api.get<ErgastResponse<any>>(constructorPath)),
      ]);

      const driverList = driverResponse.data.MRData.StandingsTable?.StandingsList?.[0] || {};
      const constructorList =
        constructorResponse.data.MRData.StandingsTable?.StandingsList?.[0] || {};

      return {
        season: driverList.season || constructorList.season || season,
        round: driverList.round || constructorList.round || round || '',
        driverStandings: driverList.DriverStandings || [],
        constructorStandings: constructorList.ConstructorStandings || [],
      };
    } catch (error) {
      console.error(`Failed to get standings for ${season}/${round}:`, error);
      throw error;
    }
  }

  async getRaceResults(season: string, round: string): Promise<RaceResult[]> {
    return this.withRetry(async () => {
      try {
        const response = await this.api.get<ErgastResponse<any>>(
          `/${season}/${round}/results.json`
        );
        const results = response.data.MRData.RaceTable?.Races?.[0]?.Results || [];
        return results as RaceResult[];
      } catch (error) {
        console.error(`Failed to get results for ${season}/${round}:`, error);
        throw error;
      }
    });
  }

  /**
   * Aggregate every race result for a season by paginating the
   * `/{season}/results.json` endpoint (paginated by result-row, 100 per page).
   *
   * Pagination: starts at offset 0 and increments by 100. The first page's
   * `MRData.total` tells us how many rows exist in total, so we keep fetching
   * until we have collected >= total rows (or a page returns no races). A hard
   * cap of 20 pages guards against infinite loops.
   *
   * Caching: the fully-flattened result array is memoized per season in
   * `seasonResultsCache`, so subsequent calls for the same season return the
   * cached array without hitting the network.
   */
  async getSeasonResults(season: string): Promise<RaceResult[]> {
    const cached = this.seasonResultsCache.get(season);
    if (cached) {
      return cached;
    }

    const PAGE_LIMIT = 100;
    const MAX_PAGES = 20;

    const allResults: RaceResult[] = [];
    let offset = 0;
    let total = Infinity;

    for (let page = 0; page < MAX_PAGES; page++) {
      const currentOffset = offset;
      const response = await this.withRetry(async () => {
        try {
          return await this.api.get<ErgastResponse<any>>(`/${season}/results.json`, {
            params: { limit: PAGE_LIMIT, offset: currentOffset },
          });
        } catch (error) {
          console.error(
            `Failed to get season results for ${season} (offset ${currentOffset}):`,
            error
          );
          throw error;
        }
      });

      const mrData = response.data.MRData;
      total = parseInt(mrData?.total ?? '0', 10) || 0;

      const races = mrData?.RaceTable?.Races || [];
      if (races.length === 0) {
        break;
      }

      for (const race of races) {
        const results = (race.Results || []) as RaceResult[];
        allResults.push(...results);
      }

      offset += PAGE_LIMIT;
      if (offset >= total) {
        break;
      }
    }

    this.seasonResultsCache.set(season, allResults);
    return allResults;
  }

  /**
   * Fetch a single driver's championship standing across multiple seasons, to
   * power performance trend charts.
   *
   * For each requested season, `GET /{season}/driverStandings.json` is fetched
   * (wrapped in `withRetry`) and the DriverStandings entry matching `driverId`
   * is extracted. All seasons are fetched CONCURRENTLY via Promise.all.
   *
   * Seasons where the driver has no entry (didn't race / no data) are skipped
   * rather than zero-filled. The returned array is sorted by season ascending.
   *
   * Caching: the resulting array is memoized per `driverId + '|' + seasons.join(',')`
   * so repeat calls for the same driver + season set do not re-hit the network.
   */
  async getDriverSeasonStandings(
    driverId: string,
    seasons: string[]
  ): Promise<Array<{ season: string; points: number; position: number; wins: number }>> {
    const cacheKey = `${driverId}|${seasons.join(',')}`;
    const cached = this.driverSeasonStandingsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const perSeason = await Promise.all(
      seasons.map(season =>
        this.withRetry(async () => {
          try {
            const response = await this.api.get<ErgastResponse<any>>(
              `/${season}/driverStandings.json`
            );
            const standings =
              response.data.MRData.StandingsTable?.StandingsList?.[0]?.DriverStandings || [];
            const entry = standings.find(
              (s: any) => s.driver?.driverId === driverId
            );
            if (!entry) {
              return null;
            }
            return {
              season,
              points: Number(entry.points),
              position: Number(entry.position),
              wins: Number(entry.wins),
            };
          } catch (error) {
            console.error(
              `Failed to get driver standings for ${driverId} in ${season}:`,
              error
            );
            throw error;
          }
        })
      )
    );

    const result = perSeason
      .filter(
        (
          item
        ): item is { season: string; points: number; position: number; wins: number } =>
          item !== null
      )
      .sort((a, b) => a.season.localeCompare(b.season));

    this.driverSeasonStandingsCache.set(cacheKey, result);
    return result;
  }

  async getQualifying(season: string, round: string): Promise<QualifyingResult[]> {
    return this.withRetry(async () => {
      try {
        const response = await this.api.get<ErgastResponse<any>>(
          `/${season}/${round}/qualifying.json`
        );
        const results = response.data.MRData.RaceTable?.Races?.[0]?.QualifyingResults || [];
        return results as QualifyingResult[];
      } catch (error) {
        console.error(`Failed to get qualifying for ${season}/${round}:`, error);
        throw error;
      }
    });
  }

  async getDriver(driverId: string): Promise<Driver> {
    return this.withRetry(async () => {
      try {
        const response = await this.api.get<ErgastResponse<any>>(`/drivers/${driverId}.json`);
        const driver = response.data.MRData.DriverTable?.Drivers?.[0];
        if (!driver) throw new Error('Driver not found');
        return driver as Driver;
      } catch (error) {
        console.error(`Failed to get driver ${driverId}:`, error);
        throw error;
      }
    });
  }

  private transformRace(race: any): Race {
    return {
      raceId: race.raceId,
      season: race.season,
      round: race.round,
      raceName: race.raceName,
      date: race.date,
      time: race.time,
      circuit: race.Circuit,
      url: race.url,
    };
  }
}

export const ergastService = new ErgastService();
