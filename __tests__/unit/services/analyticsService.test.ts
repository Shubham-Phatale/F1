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
    it('should compute a real head-to-head from shared season results', () => {
      // Arrange
      const driver1 = buildDriver({ driverId: 'max_verstappen', code: 'VER' });
      const driver2 = buildDriver({
        driverId: 'lewis_hamilton',
        code: 'HAM',
        givenName: 'Lewis',
        familyName: 'Hamilton',
      });

      const fastestLap = {
        rank: '1',
        lap: '44',
        time: { time: '1:32.123' },
        averageSpeed: { speed: '210.5', units: 'kph' },
      };

      // Three actual races, grouped by round (TRUE per-race head-to-head):
      //   Round 1: VER P1  vs HAM P2  => driver1 wins
      //   Round 2: VER P5  vs HAM P3  => driver2 wins
      //   Round 3: VER P2  vs HAM P4  => driver1 wins
      // => driver1Wins=2, driver2Wins=1, racesMet=3.
      const seasonResults: RaceResult[] = [
        // Round 1
        buildResult({
          driver: driver1,
          season: '2021',
          round: '1',
          position: '1',
          grid: '1',
          points: '25',
          fastestLap,
        }),
        buildResult({
          driver: driver2,
          season: '2021',
          round: '1',
          position: '2',
          grid: '2',
          points: '18',
        }),
        // Round 2
        buildResult({
          driver: driver1,
          season: '2021',
          round: '2',
          position: '5',
          grid: '3',
          points: '10',
        }),
        buildResult({
          driver: driver2,
          season: '2021',
          round: '2',
          position: '3',
          grid: '1',
          points: '15',
        }),
        // Round 3
        buildResult({
          driver: driver1,
          season: '2021',
          round: '3',
          position: '2',
          grid: '4',
          points: '18',
        }),
        buildResult({
          driver: driver2,
          season: '2021',
          round: '3',
          position: '4',
          grid: '5',
          points: '12',
        }),
      ];

      // Act
      const comparison = service.compareDrivers(driver1, driver2, seasonResults);

      // Assert
      expect(comparison.driver1Id).toBe('max_verstappen');
      expect(comparison.driver2Id).toBe('lewis_hamilton');
      expect(comparison.driver1.familyName).toBe('Verstappen');
      expect(comparison.driver2.familyName).toBe('Hamilton');
      expect(comparison.racesMet).toBe(3);
      expect(comparison.driver1Wins).toBe(2);
      expect(comparison.driver2Wins).toBe(1);
      expect(comparison.draws).toBe(0);
      // Poles counted from grid === '1': driver1 has 1 (round 1), driver2 has 1 (round 2).
      expect(comparison.driver1PolePositions).toBe(1);
      expect(comparison.driver2PolePositions).toBe(1);
      // Fastest laps: only driver1 has one.
      expect(comparison.driver1FastestLaps).toBe(1);
      expect(comparison.driver2FastestLaps).toBe(0);
      // Seasons now derivable from the race identity on the shared results.
      expect(comparison.competitionYears).toEqual(['2021']);
    });

    it('should only count races where BOTH drivers have a numeric finish', () => {
      // Arrange
      const driver1 = buildDriver({ driverId: 'max_verstappen' });
      const driver2 = buildDriver({ driverId: 'lewis_hamilton', familyName: 'Hamilton' });

      // Round 1: both finish (VER wins). Round 2: HAM DNF (no numeric finish) =>
      // that race is NOT counted. Round 3: both finish (HAM wins).
      const seasonResults: RaceResult[] = [
        buildResult({ driver: driver1, season: '2022', round: '1', position: '1' }),
        buildResult({ driver: driver2, season: '2022', round: '1', position: '2' }),
        buildResult({ driver: driver1, season: '2022', round: '2', position: '3' }),
        buildResult({
          driver: driver2,
          season: '2022',
          round: '2',
          position: '',
          positionText: 'R',
        }),
        buildResult({ driver: driver1, season: '2022', round: '3', position: '4' }),
        buildResult({ driver: driver2, season: '2022', round: '3', position: '2' }),
      ];

      // Act
      const comparison = service.compareDrivers(driver1, driver2, seasonResults);

      // Assert - only rounds 1 and 3 count.
      expect(comparison.racesMet).toBe(2);
      expect(comparison.driver1Wins).toBe(1);
      expect(comparison.driver2Wins).toBe(1);
      expect(comparison.competitionYears).toEqual(['2022']);
    });

    it('should span competitionYears across multiple seasons', () => {
      // Arrange
      const driver1 = buildDriver({ driverId: 'max_verstappen' });
      const driver2 = buildDriver({ driverId: 'lewis_hamilton', familyName: 'Hamilton' });

      const seasonResults: RaceResult[] = [
        buildResult({ driver: driver1, season: '2021', round: '1', position: '1' }),
        buildResult({ driver: driver2, season: '2021', round: '1', position: '2' }),
        buildResult({ driver: driver1, season: '2022', round: '1', position: '2' }),
        buildResult({ driver: driver2, season: '2022', round: '1', position: '1' }),
      ];

      // Act
      const comparison = service.compareDrivers(driver1, driver2, seasonResults);

      // Assert
      expect(comparison.racesMet).toBe(2);
      expect(comparison.driver1Wins).toBe(1);
      expect(comparison.driver2Wins).toBe(1);
      expect(comparison.competitionYears).toEqual(['2021', '2022']);
    });

    it('should fall back to index-pairing when results carry no round identity', () => {
      // Arrange - no season/round on any result => legacy fallback path.
      const driver1 = buildDriver({ driverId: 'max_verstappen' });
      const driver2 = buildDriver({ driverId: 'lewis_hamilton', familyName: 'Hamilton' });
      const seasonResults: RaceResult[] = [
        buildResult({ driver: driver1, position: '1', grid: '1' }),
        buildResult({ driver: driver1, position: '3', grid: '2' }),
        // driver2 only has one numeric finish plus a DNF (non-numeric position)
        buildResult({ driver: driver2, position: '2', grid: '4' }),
        buildResult({ driver: driver2, position: '', positionText: 'R', grid: '5' }),
      ];

      // Act
      const comparison = service.compareDrivers(driver1, driver2, seasonResults);

      // Assert
      expect(comparison.racesMet).toBe(1); // min(2, 1)
      // Sorted pairing: driver1 best [1], driver2 best [2] => driver1 wins.
      expect(comparison.driver1Wins).toBe(1);
      expect(comparison.driver2Wins).toBe(0);
      // No season identity => competitionYears empty in the fallback path.
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
    const seasonStandings = [
      { season: '2021', points: 395, position: 2, wins: 10 },
      { season: '2022', points: 454, position: 1, wins: 15 },
      { season: '2023', points: 575, position: 1, wins: 19 },
    ];

    it('should build a points series and detect an improving trend', () => {
      // Act
      const trend = service.getTrendData('max_verstappen', seasonStandings, 'points');

      // Assert
      expect(trend.driverId).toBe('max_verstappen');
      expect(trend.metricType).toBe('points');
      expect(trend.seasons).toEqual(['2021', '2022', '2023']);
      expect(trend.values).toEqual([395, 454, 575]);
      // 575 > 395 => improving
      expect(trend.trend).toBe('improving');
    });

    it('should build a wins series', () => {
      // Act
      const trend = service.getTrendData('max_verstappen', seasonStandings, 'wins');

      // Assert
      expect(trend.metricType).toBe('wins');
      expect(trend.values).toEqual([10, 15, 19]);
      expect(trend.trend).toBe('improving');
    });

    it('should invert the trend for the position metric (lower is better)', () => {
      // Act - position metric is not part of the public union; cast to request it.
      const trend = service.getTrendData(
        'max_verstappen',
        seasonStandings,
        'position' as Parameters<typeof service.getTrendData>[2]
      );

      // Assert - position goes 2 -> 1 -> 1, lower is better, so improving.
      expect(trend.values).toEqual([2, 1, 1]);
      expect(trend.trend).toBe('improving');
    });

    it('should report a declining trend when points fall', () => {
      // Arrange
      const falling = [
        { season: '2021', points: 400, position: 1, wins: 12 },
        { season: '2022', points: 250, position: 3, wins: 5 },
      ];

      // Act
      const trend = service.getTrendData('some_driver', falling, 'points');

      // Assert
      expect(trend.trend).toBe('declining');
    });

    it('should report stable when first and last values are equal', () => {
      // Arrange
      const flat = [
        { season: '2021', points: 300, position: 2, wins: 8 },
        { season: '2022', points: 300, position: 2, wins: 8 },
      ];

      // Act
      const trend = service.getTrendData('some_driver', flat, 'wins');

      // Assert
      expect(trend.trend).toBe('stable');
    });

    it('should return an empty values series for unsupported metrics', () => {
      // Act - podiums is not derivable from season standings.
      const trend = service.getTrendData('max_verstappen', seasonStandings, 'podiums');

      // Assert
      expect(trend.metricType).toBe('podiums');
      expect(trend.values).toEqual([]);
      expect(trend.seasons).toEqual([]);
      expect(trend.trend).toBe('stable');
    });

    it('should handle an empty standings array gracefully', () => {
      // Act
      const trend = service.getTrendData('max_verstappen', [], 'points');

      // Assert
      expect(trend.driverId).toBe('max_verstappen');
      expect(trend.seasons).toEqual([]);
      expect(trend.values).toEqual([]);
      expect(trend.trend).toBe('stable');
    });
  });
});
