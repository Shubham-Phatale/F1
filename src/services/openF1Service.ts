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
