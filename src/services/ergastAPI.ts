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
    return this.withRetry(async () => {
      try {
        const path = round ? `/${season}/${round}/standings.json` : `/${season}/standings.json`;
        const response = await this.api.get<ErgastResponse<any>>(path);
        const standingsTable = response.data.MRData.StandingsTable || {};
        return {
          season: standingsTable.season,
          round: standingsTable.round,
          driverStandings: standingsTable.StandingsList?.[0]?.DriverStandings || [],
          constructorStandings: standingsTable.StandingsList?.[0]?.ConstructorStandings || [],
        };
      } catch (error) {
        console.error(`Failed to get standings for ${season}/${round}:`, error);
        throw error;
      }
    });
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
