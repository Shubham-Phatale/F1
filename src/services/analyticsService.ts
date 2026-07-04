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
   * `seasonResults` is a full season's flattened `RaceResult[]` (from
   * `ergastAPI.getSeasonResults`). Because `RaceResult` carries NO race/round
   * identifier once flattened, we cannot reliably group results by race.
   *
   * Approach / limitation: we filter the shared set into each driver's own
   * finishing results (numeric position only), sort each list by finishing
   * position ascending, and pair them by index. `racesMet` is approximated as
   * `min(count1, count2)`. For each paired race the driver with the lower
   * finishing position wins that head-to-head; equal positions count as a draw
   * (should not happen for real finishing positions but guarded anyway).
   * Pole positions and fastest laps are counted directly from each driver's
   * results across the whole shared set.
   */
  compareDrivers(
    driver1: Driver,
    driver2: Driver,
    seasonResults: RaceResult[]
  ): HeadToHeadComparison {
    const numericFinishes = (driverId: string): number[] =>
      seasonResults
        .filter(r => r.driver.driverId === driverId)
        .map(r => parseInt(r.position, 10))
        .filter(pos => Number.isFinite(pos) && pos > 0)
        .sort((a, b) => a - b);

    const countPoles = (driverId: string): number =>
      seasonResults.filter(r => r.driver.driverId === driverId && r.grid === '1').length;

    const countFastestLaps = (driverId: string): number =>
      seasonResults.filter(
        r => r.driver.driverId === driverId && r.fastestLap?.rank === '1'
      ).length;

    const d1Finishes = numericFinishes(driver1.driverId);
    const d2Finishes = numericFinishes(driver2.driverId);

    const racesMet = Math.min(d1Finishes.length, d2Finishes.length);

    let driver1Wins = 0;
    let driver2Wins = 0;
    let draws = 0;
    for (let i = 0; i < racesMet; i++) {
      if (d1Finishes[i] < d2Finishes[i]) {
        driver1Wins++;
      } else if (d2Finishes[i] < d1Finishes[i]) {
        driver2Wins++;
      } else {
        draws++;
      }
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
      // A flattened single-season RaceResult[] carries no season field, so the
      // competing seasons are not derivable here.
      competitionYears: [],
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
