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
   * Compare two drivers' performance metrics
   * Returns head-to-head comparison including wins, poles, fastest laps
   */
  compareDrivers(
    driver1Stats: DriverStats,
    driver2Stats: DriverStats,
    driver1Obj: Driver,
    driver2Obj: Driver
  ): HeadToHeadComparison {
    // For now, placeholder implementation using cached stats
    // In a full implementation, this would analyze races where both drivers competed
    const comparison: HeadToHeadComparison = {
      driver1Id: driver1Stats.driverId,
      driver2Id: driver2Stats.driverId,
      driver1: driver1Obj,
      driver2: driver2Obj,
      racesMet: 0, // Would be calculated from shared races
      driver1Wins: driver1Stats.totalWins,
      driver2Wins: driver2Stats.totalWins,
      draws: 0,
      driver1PolePositions: driver1Stats.polePositions,
      driver2PolePositions: driver2Stats.polePositions,
      driver1FastestLaps: driver1Stats.fastestLaps,
      driver2FastestLaps: driver2Stats.fastestLaps,
      competitionYears: [], // Would be populated from shared race seasons
    };

    return comparison;
  }

  /**
   * Get historical trend data for a driver across seasons
   * Returns seasonal breakdown for visualization
   */
  getTrendData(driverId: string, standings: DriverStanding[]): TrendData {
    // Placeholder implementation - would require season-by-season data
    // In full implementation, would track metrics across multiple seasons
    const trendData: TrendData = {
      driverId,
      metricType: 'points',
      seasons: [],
      values: [],
      trend: 'stable',
    };

    return trendData;
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
