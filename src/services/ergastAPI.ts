import axios, { AxiosInstance } from 'axios';
import { ERGAST_API_BASE_URL, API_TIMEOUT } from '@/utils/constants';
import {
  Race,
  RaceResult,
  QualifyingResult,
  StandingsTable,
  Driver,
  Constructor,
  Circuit,
  DriverStanding,
  ConstructorStanding,
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

      // Jolpica returns `StandingsLists` (plural); classic Ergast used
      // `StandingsList` (singular). Support both so standings always populate.
      const driverTable = driverResponse.data.MRData.StandingsTable ?? {};
      const constructorTable = constructorResponse.data.MRData.StandingsTable ?? {};
      const driverList = (driverTable.StandingsLists ?? driverTable.StandingsList ?? [])[0] || {};
      const constructorList =
        (constructorTable.StandingsLists ?? constructorTable.StandingsList ?? [])[0] || {};

      return {
        season: driverList.season || constructorList.season || season,
        round: driverList.round || constructorList.round || round || '',
        driverStandings: (driverList.DriverStandings || []).map((s: any) =>
          this.normalizeDriverStanding(s)
        ),
        constructorStandings: (constructorList.ConstructorStandings || []).map((s: any) =>
          this.normalizeConstructorStanding(s)
        ),
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
        return results.map((r: any) => this.normalizeRaceResult(r));
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
        const rawResults = (race.Results || []) as any[];
        // Attach the parent race's identity onto each flattened result so that
        // downstream consumers (e.g. per-race head-to-head) can group by race.
        const enriched = rawResults.map(result => ({
          ...this.normalizeRaceResult(result),
          season: race.season,
          round: race.round,
          raceName: race.raceName,
        }));
        allResults.push(...enriched);
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
            const sTable = response.data.MRData.StandingsTable ?? {};
            const sList = (sTable.StandingsLists ?? sTable.StandingsList ?? [])[0] ?? {};
            const standings = (sList.DriverStandings || []).map((s: any) =>
              this.normalizeDriverStanding(s)
            );
            const entry = standings.find(
              (s: DriverStanding) => s.driver?.driverId === driverId
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
        return results.map((r: any) => this.normalizeQualifyingResult(r));
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
        return this.normalizeDriver(driver);
      } catch (error) {
        console.error(`Failed to get driver ${driverId}:`, error);
        throw error;
      }
    });
  }

  private transformRace(race: any): Race {
    return {
      raceId: race.raceId ?? `${race.season}-${race.round}`,
      season: race.season,
      round: race.round,
      raceName: race.raceName,
      date: race.date,
      time: race.time,
      circuit: this.normalizeCircuit(race.Circuit),
      url: race.url,
    };
  }

  // ---------------------------------------------------------------------------
  // Normalizers
  //
  // The jolpica Ergast mirror returns JSON with CAPITALIZED nested objects
  // (Location, Driver, Constructor, Time, FastestLap, ...) and a few different
  // field names (dateOfBirth vs dob). These normalizers convert the raw Ergast
  // shape into the lowercase app types defined in src/types/index.ts. They are
  // defensive (optional chaining + sensible defaults) so partial/missing data
  // never crashes the data screens.
  // ---------------------------------------------------------------------------

  private normalizeDriver(raw: any): Driver {
    return {
      driverId: raw?.driverId ?? '',
      code: raw?.code ?? '',
      givenName: raw?.givenName ?? '',
      familyName: raw?.familyName ?? '',
      dob: raw?.dateOfBirth ?? raw?.dob ?? '',
      nationality: raw?.nationality ?? '',
      permanentNumber: raw?.permanentNumber ?? '',
      url: raw?.url ?? '',
    };
  }

  private normalizeConstructor(raw: any): Constructor {
    return {
      constructorId: raw?.constructorId ?? '',
      name: raw?.name ?? '',
      nationality: raw?.nationality ?? '',
      url: raw?.url ?? '',
    };
  }

  private normalizeCircuit(raw: any): Circuit {
    const location = raw?.Location ?? raw?.location ?? {};
    return {
      circuitId: raw?.circuitId ?? '',
      circuitName: raw?.circuitName ?? '',
      location: {
        lat: location?.lat ?? '',
        long: location?.long ?? '',
        locality: location?.locality ?? '',
        country: location?.country ?? '',
      },
      url: raw?.url ?? '',
    };
  }

  private normalizeRaceResult(raw: any): RaceResult {
    const rawTime = raw?.Time ?? raw?.time;
    const rawFastestLap = raw?.FastestLap ?? raw?.fastestLap;

    const result: RaceResult = {
      number: raw?.number ?? '',
      position: raw?.position ?? '',
      positionText: raw?.positionText ?? '',
      points: raw?.points ?? '',
      driver: this.normalizeDriver(raw?.Driver ?? raw?.driver),
      constructor: this.normalizeConstructor(raw?.Constructor ?? raw?.constructor),
      grid: raw?.grid ?? '',
      laps: raw?.laps ?? '',
      status: raw?.status ?? '',
    };

    if (rawTime) {
      result.time = {
        millis: rawTime?.millis ?? '',
        time: rawTime?.time ?? '',
      };
    }

    if (rawFastestLap) {
      const flTime = rawFastestLap?.Time ?? rawFastestLap?.time;
      const flSpeed = rawFastestLap?.AverageSpeed ?? rawFastestLap?.averageSpeed;
      result.fastestLap = {
        rank: rawFastestLap?.rank ?? '',
        lap: rawFastestLap?.lap ?? '',
        time: {
          time: flTime?.time ?? '',
        },
        averageSpeed: {
          speed: flSpeed?.speed ?? '',
          units: flSpeed?.units ?? '',
        },
      };
    }

    return result;
  }

  private normalizeQualifyingResult(raw: any): QualifyingResult {
    return {
      number: raw?.number ?? '',
      position: raw?.position ?? '',
      driver: this.normalizeDriver(raw?.Driver ?? raw?.driver),
      constructor: this.normalizeConstructor(raw?.Constructor ?? raw?.constructor),
      q1: raw?.Q1 ?? raw?.q1,
      q2: raw?.Q2 ?? raw?.q2,
      q3: raw?.Q3 ?? raw?.q3,
    };
  }

  private normalizeDriverStanding(raw: any): DriverStanding {
    const rawConstructors = raw?.Constructors ?? raw?.constructors ?? [];
    return {
      position: raw?.position ?? '',
      positionText: raw?.positionText ?? '',
      points: raw?.points ?? '',
      wins: raw?.wins ?? '',
      driver: this.normalizeDriver(raw?.Driver ?? raw?.driver),
      constructors: rawConstructors.map((c: any) => this.normalizeConstructor(c)),
    };
  }

  private normalizeConstructorStanding(raw: any): ConstructorStanding {
    return {
      position: raw?.position ?? '',
      positionText: raw?.positionText ?? '',
      points: raw?.points ?? '',
      wins: raw?.wins ?? '',
      constructor: this.normalizeConstructor(raw?.Constructor ?? raw?.constructor),
    };
  }
}

export const ergastService = new ErgastService();
