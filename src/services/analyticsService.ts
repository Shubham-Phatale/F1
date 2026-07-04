import {
  Driver,
  DriverStats,
  DriverStanding,
  RaceResult,
  Constructor,
  HeadToHeadComparison,
  TrendData,
  ConstructorStats,
} from '@/types';

export class AnalyticsService {
  private driverStatsCache: Map<string, DriverStats> = new Map();

  /**
   * Calculate comprehensive driver statistics from results and standings
   * Calculates wins, podiums, DNFs, averages, and consistency metrics
   */
  calculateDriverStats(
    driver: Driver,
    allStandings: DriverStanding[],
    allResults: RaceResult[]
  ): DriverStats {
    // Check cache first
    if (this.driverStatsCache.has(driver.driverId)) {
      return this.driverStatsCache.get(driver.driverId)!;
    }

    // Filter results for this driver
    const driverResults = allResults.filter(result => result.driver.driverId === driver.driverId);

    if (driverResults.length === 0) {
      const emptyStats: DriverStats = {
        driverId: driver.driverId,
        driver,
        totalRaces: 0,
        totalPoints: 0,
        totalWins: 0,
        podiums: 0,
        polePositions: 0,
        fastestLaps: 0,
        averageFinish: 0,
        bestFinish: 0,
        worstFinish: 0,
        championships: 0,
      };
      this.driverStatsCache.set(driver.driverId, emptyStats);
      return emptyStats;
    }

    // Calculate wins
    const wins = driverResults.filter(result => result.position === '1').length;

    // Calculate podiums (positions 1, 2, 3)
    const podiums = driverResults.filter(result => {
      const pos = parseInt(result.position, 10);
      return pos >= 1 && pos <= 3;
    }).length;

    // Calculate pole positions
    const polePositions = driverResults.filter(result => result.grid === '1').length;

    // Calculate fastest laps
    const fastestLaps = driverResults.filter(result => result.fastestLap?.rank === '1').length;

    // Calculate total points
    const totalPoints = driverResults.reduce((sum, result) => {
      return sum + (parseInt(result.points, 10) || 0);
    }, 0);

    // Calculate average finish (excluding DNFs)
    const completedRaces = driverResults.filter(result => {
      const pos = parseInt(result.position, 10);
      return pos > 0 && pos !== Infinity;
    });
    const averageFinish =
      completedRaces.length > 0
        ? completedRaces.reduce((sum, result) => sum + parseInt(result.position, 10), 0) /
          completedRaces.length
        : 0;

    // Find best and worst finish positions
    let bestFinish = Infinity;
    let worstFinish = 0;
    completedRaces.forEach(result => {
      const pos = parseInt(result.position, 10);
      if (pos > 0) {
        bestFinish = Math.min(bestFinish, pos);
        worstFinish = Math.max(worstFinish, pos);
      }
    });

    bestFinish = bestFinish === Infinity ? 0 : bestFinish;

    // Calculate championships from standings (placeholder - would need season data)
    const championships = 0; // This would require checking if driver was champion in any season

    const stats: DriverStats = {
      driverId: driver.driverId,
      driver,
      totalRaces: driverResults.length,
      totalPoints,
      totalWins: wins,
      podiums,
      polePositions,
      fastestLaps,
      averageFinish: Math.round(averageFinish * 100) / 100,
      bestFinish,
      worstFinish,
      championships,
    };

    // Cache the result
    this.driverStatsCache.set(driver.driverId, stats);
    return stats;
  }

  /**
   * Compare two drivers head-to-head over a shared set of season results.
   *
   * `seasonResults` is a season's flattened `RaceResult[]` (from
   * `ergastAPI.getSeasonResults`), where each result now carries its parent
   * race's `season`/`round` identity.
   *
   * Primary approach (TRUE per-race head-to-head): we group both drivers'
   * numeric finishing positions by race key (`season + '|' + round`, falling
   * back to `round` alone). For every race where BOTH drivers have a numeric
   * finishing position, the driver who finished lower (better) wins that race;
   * equal positions count as a draw. `racesMet` is the number of such shared
   * races. `competitionYears` is the distinct set of seasons across those
   * shared races.
   *
   * Fallback: if the results carry no `round` identity (older data path), we
   * degrade gracefully to the previous index-pairing approach — each driver's
   * finishes sorted ascending and paired by index, `racesMet = min(count1,
   * count2)` — and `competitionYears` is derived from whatever `season` values
   * are present (may be empty).
   *
   * Pole positions and fastest laps are counted directly from each driver's
   * results across the whole shared set.
   */
  compareDrivers(
    driver1: Driver,
    driver2: Driver,
    seasonResults: RaceResult[]
  ): HeadToHeadComparison {
    const countPoles = (driverId: string): number =>
      seasonResults.filter(r => r.driver.driverId === driverId && r.grid === '1').length;

    const countFastestLaps = (driverId: string): number =>
      seasonResults.filter(
        r => r.driver.driverId === driverId && r.fastestLap?.rank === '1'
      ).length;

    const numericPosition = (r: RaceResult): number | null => {
      const pos = parseInt(r.position, 10);
      return Number.isFinite(pos) && pos > 0 ? pos : null;
    };

    // Detect whether we can group by race. If no result carries a `round`, we
    // fall back to the legacy index-pairing behaviour.
    const canGroupByRace = seasonResults.some(
      r => r.driver.driverId === driver1.driverId || r.driver.driverId === driver2.driverId
    )
      ? seasonResults
          .filter(
            r =>
              r.driver.driverId === driver1.driverId ||
              r.driver.driverId === driver2.driverId
          )
          .some(r => r.round !== undefined)
      : false;

    let racesMet = 0;
    let driver1Wins = 0;
    let driver2Wins = 0;
    let draws = 0;
    let competitionYears: string[] = [];

    if (canGroupByRace) {
      // race key -> { d1Position?, d2Position?, season? }
      const byRace = new Map<
        string,
        { d1?: number; d2?: number; season?: string }
      >();

      for (const r of seasonResults) {
        const isD1 = r.driver.driverId === driver1.driverId;
        const isD2 = r.driver.driverId === driver2.driverId;
        if (!isD1 && !isD2) continue;

        const key = `${r.season ?? ''}|${r.round ?? ''}`;
        const entry = byRace.get(key) ?? {};
        if (r.season !== undefined) entry.season = r.season;

        const pos = numericPosition(r);
        if (pos !== null) {
          if (isD1) entry.d1 = pos;
          if (isD2) entry.d2 = pos;
        }
        byRace.set(key, entry);
      }

      const seasonSet = new Set<string>();
      for (const entry of byRace.values()) {
        if (entry.d1 === undefined || entry.d2 === undefined) continue;
        racesMet++;
        if (entry.d1 < entry.d2) {
          driver1Wins++;
        } else if (entry.d2 < entry.d1) {
          driver2Wins++;
        } else {
          draws++;
        }
        if (entry.season) seasonSet.add(entry.season);
      }

      competitionYears = Array.from(seasonSet).sort();
    } else {
      // Fallback: legacy index-pairing over each driver's sorted finishes.
      const numericFinishes = (driverId: string): number[] =>
        seasonResults
          .filter(r => r.driver.driverId === driverId)
          .map(r => parseInt(r.position, 10))
          .filter(pos => Number.isFinite(pos) && pos > 0)
          .sort((a, b) => a - b);

      const d1Finishes = numericFinishes(driver1.driverId);
      const d2Finishes = numericFinishes(driver2.driverId);

      racesMet = Math.min(d1Finishes.length, d2Finishes.length);
      for (let i = 0; i < racesMet; i++) {
        if (d1Finishes[i] < d2Finishes[i]) {
          driver1Wins++;
        } else if (d2Finishes[i] < d1Finishes[i]) {
          driver2Wins++;
        } else {
          draws++;
        }
      }

      // Seasons may still be derivable from whatever `season` fields exist.
      const seasonSet = new Set<string>();
      for (const r of seasonResults) {
        if (
          (r.driver.driverId === driver1.driverId ||
            r.driver.driverId === driver2.driverId) &&
          r.season !== undefined
        ) {
          seasonSet.add(r.season);
        }
      }
      competitionYears = Array.from(seasonSet).sort();
    }

    const comparison: HeadToHeadComparison = {
      driver1Id: driver1.driverId,
      driver2Id: driver2.driverId,
      driver1,
      driver2,
      racesMet,
      driver1Wins,
      driver2Wins,
      draws,
      driver1PolePositions: countPoles(driver1.driverId),
      driver2PolePositions: countPoles(driver2.driverId),
      driver1FastestLaps: countFastestLaps(driver1.driverId),
      driver2FastestLaps: countFastestLaps(driver2.driverId),
      competitionYears,
    };

    return comparison;
  }

  /**
   * Build historical trend data for a driver from per-season standings.
   *
   * `seasonStandings` is the chronological array returned by
   * `ergastAPI.getDriverSeasonStandings` (one entry per season with points,
   * championship position and wins).
   *
   * Supported metrics from this data: 'points', 'wins' and 'position' (mapped
   * onto the TrendData.metricType union). Metrics that are not present in the
   * season standings ('podiums', 'poles', 'fastestLaps') cannot be derived here
   * and yield an empty `values` array (documented degradation, not a crash).
   *
   * Trend is computed by comparing the first vs the last value. For most
   * metrics a higher last value is 'improving'. For 'position' LOWER is better,
   * so the comparison is inverted.
   */
  getTrendData(
    driverId: string,
    seasonStandings: Array<{ season: string; points: number; position: number; wins: number }>,
    metricType: TrendData['metricType']
  ): TrendData {
    const seasons = seasonStandings.map(entry => entry.season);

    // Map the metricType union onto the fields available in season standings.
    let values: number[];
    let lowerIsBetter = false;
    switch (metricType) {
      case 'points':
        values = seasonStandings.map(entry => entry.points);
        break;
      case 'wins':
        values = seasonStandings.map(entry => entry.wins);
        break;
      // 'position' is not part of the current TrendData union but may be added;
      // handle it defensively so callers can request championship position.
      case 'position' as TrendData['metricType']:
        values = seasonStandings.map(entry => entry.position);
        lowerIsBetter = true;
        break;
      default:
        // 'podiums' | 'poles' | 'fastestLaps' are not available in season
        // standings, so we cannot build a series for them here.
        values = [];
        break;
    }

    let trend: TrendData['trend'] = 'stable';
    if (values.length >= 2) {
      const first = values[0];
      const last = values[values.length - 1];
      if (last === first) {
        trend = 'stable';
      } else {
        const improved = lowerIsBetter ? last < first : last > first;
        trend = improved ? 'improving' : 'declining';
      }
    }

    return {
      driverId,
      metricType,
      seasons: values.length > 0 ? seasons : [],
      values,
      trend,
    };
  }

  /**
   * Calculate comprehensive constructor/team statistics
   * Aggregates team performance from all drivers and races
   */
  calculateConstructorStats(
    constructor: Constructor,
    standings: DriverStanding[],
    allResults: RaceResult[]
  ): ConstructorStats {
    // Filter results for this constructor
    const constructorResults = allResults.filter(
      result => result.constructor.constructorId === constructor.constructorId
    );

    if (constructorResults.length === 0) {
      const emptyStats: ConstructorStats = {
        constructorId: constructor.constructorId,
        constructor,
        totalRaces: 0,
        totalPoints: 0,
        totalWins: 0,
        podiums: 0,
        polePositions: 0,
        fastestLaps: 0,
        championships: 0,
        driverCount: 0,
        averageDriverRating: 0,
      };
      return emptyStats;
    }

    // Calculate wins
    const wins = constructorResults.filter(result => result.position === '1').length;

    // Calculate podiums
    const podiums = constructorResults.filter(result => {
      const pos = parseInt(result.position, 10);
      return pos >= 1 && pos <= 3;
    }).length;

    // Calculate pole positions
    const polePositions = constructorResults.filter(result => result.grid === '1').length;

    // Calculate fastest laps
    const fastestLaps = constructorResults.filter(result => result.fastestLap?.rank === '1').length;

    // Calculate total points
    const totalPoints = constructorResults.reduce((sum, result) => {
      return sum + (parseInt(result.points, 10) || 0);
    }, 0);

    // Get unique drivers for this constructor
    const uniqueDrivers = new Set(
      constructorResults.map(result => result.driver.driverId)
    );
    const driverCount = uniqueDrivers.size;

    // Calculate average driver rating (placeholder)
    // In full implementation, would calculate based on individual driver performance
    const averageDriverRating = driverCount > 0 ? (totalPoints / constructorResults.length) * 100 : 0;

    // Calculate championships (placeholder)
    const championships = 0;

    const stats: ConstructorStats = {
      constructorId: constructor.constructorId,
      constructor,
      totalRaces: constructorResults.length,
      totalPoints,
      totalWins: wins,
      podiums,
      polePositions,
      fastestLaps,
      championships,
      driverCount,
      averageDriverRating: Math.round(averageDriverRating * 100) / 100,
    };

    return stats;
  }

  /**
   * Clear the driver stats cache
   * Useful for refreshing data after updates
   */
  clearCache(): void {
    this.driverStatsCache.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; drivers: string[] } {
    return {
      size: this.driverStatsCache.size,
      drivers: Array.from(this.driverStatsCache.keys()),
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
