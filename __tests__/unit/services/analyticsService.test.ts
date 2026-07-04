import { AnalyticsService, analyticsService } from '@/services/analyticsService';
import {
  Driver,
  Constructor,
  RaceResult,
  DriverStats,
  DriverStanding,
} from '@/types';

// Reusable mock builders
const buildDriver = (overrides: Partial<Driver> = {}): Driver => ({
  driverId: 'max_verstappen',
  code: 'VER',
  givenName: 'Max',
  familyName: 'Verstappen',
  dob: '1997-12-30',
  nationality: 'Dutch',
  permanentNumber: '1',
  url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
  ...overrides,
});

const buildConstructor = (overrides: Partial<Constructor> = {}): Constructor => ({
  constructorId: 'red_bull',
  name: 'Red Bull Racing',
  nationality: 'Austrian',
  url: 'http://en.wikipedia.org/wiki/Red_Bull_Racing',
  ...overrides,
});

const buildResult = (overrides: Partial<RaceResult> = {}): RaceResult => ({
  number: '1',
  position: '1',
  positionText: '1',
  points: '25',
  driver: buildDriver(),
  constructor: buildConstructor(),
  grid: '1',
  laps: '57',
  status: 'Finished',
  ...overrides,
});

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    // Fresh instance per test to avoid cache leakage between tests
    service = new AnalyticsService();
    // Also clear the singleton's cache since it is imported/exported
    analyticsService.clearCache();
  });

  describe('calculateDriverStats', () => {
    it('should compute correct stats from a set of race results', () => {
      // Arrange
      const driver = buildDriver();
      const standings: DriverStanding[] = [];
      const results: RaceResult[] = [
        // Win, pole, fastest lap
        buildResult({
          position: '1',
          positionText: '1',
          points: '25',
          grid: '1',
          fastestLap: {
            rank: '1',
            lap: '44',
            time: { time: '1:32.123' },
            averageSpeed: { speed: '210.5', units: 'kph' },
          },
        }),
        // Podium (P3)
        buildResult({ position: '3', positionText: '3', points: '15', grid: '4' }),
        // P5 finish
        buildResult({ position: '5', positionText: '5', points: '10', grid: '6' }),
        // DNF (non-numeric position text but position parses to a large/invalid value)
        buildResult({
          position: '20',
          positionText: 'R',
          points: '0',
          grid: '8',
          status: 'Retired',
        }),
      ];

      // Act
      const stats: DriverStats = service.calculateDriverStats(driver, standings, results);

      // Assert
      expect(stats.driverId).toBe('max_verstappen');
      expect(stats.driver.familyName).toBe('Verstappen');
      expect(stats.totalRaces).toBe(4);
      expect(stats.totalWins).toBe(1);
      expect(stats.podiums).toBe(2); // P1 and P3
      expect(stats.polePositions).toBe(1); // one grid === '1'
      expect(stats.fastestLaps).toBe(1);
      expect(stats.totalPoints).toBe(25 + 15 + 10 + 0);
      // average finish across all numeric positions: (1 + 3 + 5 + 20) / 4 = 7.25
      expect(stats.averageFinish).toBe(7.25);
      expect(stats.bestFinish).toBe(1);
      expect(stats.worstFinish).toBe(20);
      expect(stats.championships).toBe(0);
    });

    it('should only count results belonging to the requested driver', () => {
      // Arrange
      const driver = buildDriver({ driverId: 'lewis_hamilton', code: 'HAM' });
      const otherDriver = buildDriver({ driverId: 'max_verstappen', code: 'VER' });
      const results: RaceResult[] = [
        buildResult({ driver, position: '2', points: '18', grid: '2' }),
        buildResult({ driver: otherDriver, position: '1', points: '25', grid: '1' }),
      ];

      // Act
      const stats = service.calculateDriverStats(driver, [], results);

      // Assert
      expect(stats.totalRaces).toBe(1);
      expect(stats.totalWins).toBe(0);
      expect(stats.podiums).toBe(1);
      expect(stats.totalPoints).toBe(18);
    });

    it('should return zeroed stats for an empty results array without crashing', () => {
      // Arrange
      const driver = buildDriver();

      // Act
      const stats = service.calculateDriverStats(driver, [], []);

      // Assert
      expect(stats.driverId).toBe('max_verstappen');
      expect(stats.totalRaces).toBe(0);
      expect(stats.totalPoints).toBe(0);
      expect(stats.totalWins).toBe(0);
      expect(stats.podiums).toBe(0);
      expect(stats.polePositions).toBe(0);
      expect(stats.fastestLaps).toBe(0);
      expect(stats.averageFinish).toBe(0);
      expect(stats.bestFinish).toBe(0);
      expect(stats.worstFinish).toBe(0);
      expect(stats.championships).toBe(0);
    });

    it('should cache results per driver id and return cached stats', () => {
      // Arrange
      const driver = buildDriver();
      const firstResults: RaceResult[] = [buildResult({ position: '1', points: '25' })];

      // Act
      const first = service.calculateDriverStats(driver, [], firstResults);
      // Second call with different data should still return cached value
      const second = service.calculateDriverStats(driver, [], []);

      // Assert
      expect(second).toBe(first); // same cached object reference
      expect(second.totalRaces).toBe(1);
      expect(service.getCacheStats().size).toBe(1);
      expect(service.getCacheStats().drivers).toContain('max_verstappen');
    });

    it('should recompute after clearCache', () => {
      // Arrange
      const driver = buildDriver();

      // Act
      service.calculateDriverStats(driver, [], [buildResult({ position: '1' })]);
      service.clearCache();
      const afterClear = service.calculateDriverStats(driver, [], []);

      // Assert
      expect(service.getCacheStats().size).toBe(1);
      expect(afterClear.totalRaces).toBe(0); // recomputed with empty results
    });
  });

  describe('compareDrivers', () => {
    it('should build a head-to-head comparison from two driver stats', () => {
      // Arrange
      const driver1 = buildDriver({ driverId: 'max_verstappen', code: 'VER' });
      const driver2 = buildDriver({
        driverId: 'lewis_hamilton',
        code: 'HAM',
        givenName: 'Lewis',
        familyName: 'Hamilton',
      });

      const driver1Stats = service.calculateDriverStats(driver1, [], [
        buildResult({ driver: driver1, position: '1', grid: '1', points: '25' }),
      ]);
      service.clearCache();
      const driver2Stats = service.calculateDriverStats(driver2, [], [
        buildResult({ driver: driver2, position: '2', grid: '2', points: '18' }),
      ]);

      // Act
      const comparison = service.compareDrivers(driver1Stats, driver2Stats, driver1, driver2);

      // Assert
      expect(comparison.driver1Id).toBe('max_verstappen');
      expect(comparison.driver2Id).toBe('lewis_hamilton');
      expect(comparison.driver1.familyName).toBe('Verstappen');
      expect(comparison.driver2.familyName).toBe('Hamilton');
      expect(comparison.driver1Wins).toBe(driver1Stats.totalWins);
      expect(comparison.driver2Wins).toBe(driver2Stats.totalWins);
      expect(comparison.driver1PolePositions).toBe(driver1Stats.polePositions);
      expect(comparison.driver2PolePositions).toBe(driver2Stats.polePositions);
      expect(comparison.driver1FastestLaps).toBe(driver1Stats.fastestLaps);
      expect(comparison.driver2FastestLaps).toBe(driver2Stats.fastestLaps);
      expect(comparison.racesMet).toBe(0);
      expect(comparison.draws).toBe(0);
      expect(comparison.competitionYears).toEqual([]);
    });
  });

  describe('calculateConstructorStats', () => {
    it('should aggregate constructor stats from results', () => {
      // Arrange
      const constructor = buildConstructor();
      const driverA = buildDriver({ driverId: 'max_verstappen' });
      const driverB = buildDriver({ driverId: 'sergio_perez', code: 'PER' });
      const results: RaceResult[] = [
        buildResult({
          constructor,
          driver: driverA,
          position: '1',
          grid: '1',
          points: '25',
          fastestLap: {
            rank: '1',
            lap: '44',
            time: { time: '1:32.123' },
            averageSpeed: { speed: '210.5', units: 'kph' },
          },
        }),
        buildResult({
          constructor,
          driver: driverB,
          position: '3',
          grid: '4',
          points: '15',
        }),
        // Different constructor - must be ignored
        buildResult({
          constructor: buildConstructor({ constructorId: 'ferrari', name: 'Ferrari' }),
          driver: buildDriver({ driverId: 'charles_leclerc', code: 'LEC' }),
          position: '2',
          grid: '2',
          points: '18',
        }),
      ];

      // Act
      const stats = service.calculateConstructorStats(constructor, [], results);

      // Assert
      expect(stats.constructorId).toBe('red_bull');
      expect(stats.constructor.name).toBe('Red Bull Racing');
      expect(stats.totalRaces).toBe(2);
      expect(stats.totalWins).toBe(1);
      expect(stats.podiums).toBe(2); // P1 and P3
      expect(stats.polePositions).toBe(1);
      expect(stats.fastestLaps).toBe(1);
      expect(stats.totalPoints).toBe(40);
      expect(stats.driverCount).toBe(2);
      expect(stats.championships).toBe(0);
    });

    it('should return zeroed constructor stats when no results match', () => {
      // Arrange
      const constructor = buildConstructor();

      // Act
      const stats = service.calculateConstructorStats(constructor, [], []);

      // Assert
      expect(stats.constructorId).toBe('red_bull');
      expect(stats.totalRaces).toBe(0);
      expect(stats.totalPoints).toBe(0);
      expect(stats.totalWins).toBe(0);
      expect(stats.podiums).toBe(0);
      expect(stats.polePositions).toBe(0);
      expect(stats.fastestLaps).toBe(0);
      expect(stats.driverCount).toBe(0);
      expect(stats.averageDriverRating).toBe(0);
      expect(stats.championships).toBe(0);
    });
  });

  describe('getTrendData', () => {
    it('should return trend data with the requested driver id and default shape', () => {
      // Act
      const trend = service.getTrendData('max_verstappen', []);

      // Assert
      expect(trend.driverId).toBe('max_verstappen');
      expect(trend.metricType).toBe('points');
      expect(trend.seasons).toEqual([]);
      expect(trend.values).toEqual([]);
      expect(trend.trend).toBe('stable');
    });
  });
});
