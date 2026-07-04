import axios from 'axios';
import { ErgastService } from '@/services/ergastAPI';
import { Race, StandingsTable, RaceResult, QualifyingResult, Driver } from '@/types';

// Mock axios
jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ErgastService', () => {
  let service: ErgastService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
    };

    // Mock axios.create to return our mock instance
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Create new service instance
    service = new ErgastService();
  });

  describe('getRacesByYear', () => {
    it('should fetch races for a given year', async () => {
      // Arrange
      const year = '2026';
      const mockRaceData = {
        data: {
          MRData: {
            RaceTable: {
              season: '2026',
              Races: [
                {
                  raceId: '1',
                  season: '2026',
                  round: '1',
                  raceName: 'Bahrain GP',
                  date: '2026-03-22',
                  time: '16:00:00Z',
                  Circuit: {
                    circuitId: 'bahrain',
                    circuitName: 'Bahrain International Circuit',
                    location: {
                      lat: '26.0325',
                      long: '50.5106',
                      locality: 'Sakhir',
                      country: 'Bahrain',
                    },
                    url: 'http://en.wikipedia.org/wiki/Bahrain_International_Circuit',
                  },
                  url: 'http://en.wikipedia.org/wiki/2026_Bahrain_Grand_Prix',
                },
              ],
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockRaceData);

      // Act
      const races = await service.getRacesByYear(year);

      // Assert
      expect(races).toHaveLength(1);
      expect(races[0].raceName).toBe('Bahrain GP');
      expect(races[0].season).toBe('2026');
      expect(races[0].round).toBe('1');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/${year}.json`, {
        params: { limit: 100 },
      });
    });

    it('should handle empty races array', async () => {
      // Arrange
      const year = '2025';
      const mockEmptyData = {
        data: {
          MRData: {
            RaceTable: {
              season: '2025',
              Races: [],
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockEmptyData);

      // Act
      const races = await service.getRacesByYear(year);

      // Assert
      expect(races).toHaveLength(0);
      expect(Array.isArray(races)).toBe(true);
    });

    it('should handle null RaceTable gracefully', async () => {
      // Arrange
      const year = '2024';
      const mockNullData = {
        data: {
          MRData: {
            RaceTable: null,
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockNullData);

      // Act
      const races = await service.getRacesByYear(year);

      // Assert
      expect(races).toHaveLength(0);
    });
  });

  describe('getStandings', () => {
    // jolpica exposes driver and constructor standings on two separate endpoints.
    const mockDriverStandingsData = {
      data: {
        MRData: {
          StandingsTable: {
            season: '2026',
            round: '12',
            StandingsList: [
              {
                season: '2026',
                round: '12',
                DriverStandings: [
                  {
                    position: '1',
                    positionText: '1',
                    points: '275',
                    wins: '4',
                    driver: {
                      driverId: 'max_verstappen',
                      code: 'VER',
                      givenName: 'Max',
                      familyName: 'Verstappen',
                      dob: '1997-12-30',
                      nationality: 'Dutch',
                      url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
                    },
                    constructors: [],
                  },
                ],
              },
            ],
          },
        },
      },
    };

    const mockConstructorStandingsData = {
      data: {
        MRData: {
          StandingsTable: {
            season: '2026',
            round: '12',
            StandingsList: [
              {
                season: '2026',
                round: '12',
                ConstructorStandings: [
                  {
                    position: '1',
                    positionText: '1',
                    points: '400',
                    wins: '6',
                    constructor: {
                      constructorId: 'red_bull',
                      name: 'Red Bull Racing',
                      nationality: 'Austrian',
                      url: 'http://en.wikipedia.org/wiki/Red_Bull_Racing',
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    };

    it('should fetch driver and constructor standings for a season from two endpoints', async () => {
      // Arrange
      const season = '2026';
      mockAxiosInstance.get.mockImplementation((path: string) => {
        if (path.includes('constructorStandings')) {
          return Promise.resolve(mockConstructorStandingsData);
        }
        return Promise.resolve(mockDriverStandingsData);
      });

      // Act
      const standings = await service.getStandings(season);

      // Assert
      expect(standings.season).toBe('2026');
      expect(standings.round).toBe('12');
      expect(standings.driverStandings).toHaveLength(1);
      expect(standings.driverStandings[0].driver.familyName).toBe('Verstappen');
      expect(standings.constructorStandings).toHaveLength(1);
      expect(standings.constructorStandings[0].constructor.name).toBe('Red Bull Racing');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/2026/driverStandings.json');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/2026/constructorStandings.json');
    });

    it('should fetch standings for a specific round from two endpoints', async () => {
      // Arrange
      const season = '2026';
      const round = '5';
      mockAxiosInstance.get.mockImplementation((path: string) => {
        if (path.includes('constructorStandings')) {
          return Promise.resolve(mockConstructorStandingsData);
        }
        return Promise.resolve(mockDriverStandingsData);
      });

      // Act
      await service.getStandings(season, round);

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/${season}/${round}/driverStandings.json`
      );
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/${season}/${round}/constructorStandings.json`
      );
    });

    it('should handle empty standings gracefully', async () => {
      // Arrange
      const season = '2026';
      const mockEmptyStandings = {
        data: {
          MRData: {
            StandingsTable: {
              season: '2026',
              round: '0',
              StandingsList: [],
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockEmptyStandings);

      // Act
      const standings = await service.getStandings(season);

      // Assert
      expect(standings.driverStandings).toHaveLength(0);
      expect(standings.constructorStandings).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should reject with network error from getRacesByYear', async () => {
      // Arrange
      const year = '2026';
      const networkError = new Error('Network error');

      mockAxiosInstance.get.mockRejectedValue(networkError);

      // Act & Assert
      await expect(service.getRacesByYear(year)).rejects.toThrow('Network error');
    });

    it('should reject with timeout error', async () => {
      // Arrange
      const season = '2026';
      const timeoutError = new Error('Request timeout');

      mockAxiosInstance.get.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(service.getStandings(season)).rejects.toThrow('Request timeout');
    });

    it('should retry on failure (withRetry mechanism)', async () => {
      // Arrange
      const year = '2026';
      const mockRaceData = {
        data: {
          MRData: {
            RaceTable: {
              season: '2026',
              Races: [
                {
                  raceId: '1',
                  season: '2026',
                  round: '1',
                  raceName: 'Bahrain GP',
                  date: '2026-03-22',
                  Circuit: {
                    circuitId: 'bahrain',
                    circuitName: 'Bahrain International Circuit',
                    location: {
                      lat: '26.0325',
                      long: '50.5106',
                      locality: 'Sakhir',
                      country: 'Bahrain',
                    },
                    url: 'http://en.wikipedia.org/wiki/Bahrain_International_Circuit',
                  },
                  url: 'http://en.wikipedia.org/wiki/2026_Bahrain_Grand_Prix',
                },
              ],
            },
          },
        },
      };

      // First call fails, second call succeeds
      mockAxiosInstance.get
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(mockRaceData);

      // Act
      const races = await service.getRacesByYear(year);

      // Assert - should succeed after retry
      expect(races).toHaveLength(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRaceResults', () => {
    it('should fetch race results for a specific round', async () => {
      // Arrange
      const season = '2026';
      const round = '1';
      const mockResultsData = {
        data: {
          MRData: {
            RaceTable: {
              Races: [
                {
                  Results: [
                    {
                      number: '1',
                      position: '1',
                      positionText: '1',
                      points: '25',
                      driver: {
                        driverId: 'max_verstappen',
                        code: 'VER',
                        givenName: 'Max',
                        familyName: 'Verstappen',
                        dob: '1997-12-30',
                        nationality: 'Dutch',
                        url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
                      },
                      constructor: {
                        constructorId: 'red_bull',
                        name: 'Red Bull Racing',
                        nationality: 'Austrian',
                        url: 'http://en.wikipedia.org/wiki/Red_Bull_Racing',
                      },
                      grid: '1',
                      laps: '57',
                      status: 'Finished',
                    },
                  ],
                },
              ],
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResultsData);

      // Act
      const results = await service.getRaceResults(season, round);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].position).toBe('1');
      expect(results[0].driver.familyName).toBe('Verstappen');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/${season}/${round}/results.json`);
    });

    it('should handle empty results', async () => {
      // Arrange
      const season = '2026';
      const round = '1';
      const mockEmptyResults = {
        data: {
          MRData: {
            RaceTable: {
              Races: [
                {
                  Results: [],
                },
              ],
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockEmptyResults);

      // Act
      const results = await service.getRaceResults(season, round);

      // Assert
      expect(results).toHaveLength(0);
    });
  });

  describe('getQualifying', () => {
    it('should fetch qualifying results for a race', async () => {
      // Arrange
      const season = '2026';
      const round = '1';
      const mockQualifyingData = {
        data: {
          MRData: {
            RaceTable: {
              Races: [
                {
                  QualifyingResults: [
                    {
                      number: '1',
                      position: '1',
                      driver: {
                        driverId: 'max_verstappen',
                        code: 'VER',
                        givenName: 'Max',
                        familyName: 'Verstappen',
                        dob: '1997-12-30',
                        nationality: 'Dutch',
                        url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
                      },
                      constructor: {
                        constructorId: 'red_bull',
                        name: 'Red Bull Racing',
                        nationality: 'Austrian',
                        url: 'http://en.wikipedia.org/wiki/Red_Bull_Racing',
                      },
                      q1: '1:32.123',
                      q2: '1:31.456',
                      q3: '1:30.789',
                    },
                  ],
                },
              ],
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockQualifyingData);

      // Act
      const results = await service.getQualifying(season, round);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].position).toBe('1');
      expect(results[0].q3).toBe('1:30.789');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/${season}/${round}/qualifying.json`);
    });
  });

  describe('getDriver', () => {
    it('should fetch driver information by driver ID', async () => {
      // Arrange
      const driverId = 'max_verstappen';
      const mockDriverData = {
        data: {
          MRData: {
            DriverTable: {
              Drivers: [
                {
                  driverId: 'max_verstappen',
                  code: 'VER',
                  givenName: 'Max',
                  familyName: 'Verstappen',
                  dob: '1997-12-30',
                  nationality: 'Dutch',
                  permanentNumber: '1',
                  url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
                },
              ],
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockDriverData);

      // Act
      const driver = await service.getDriver(driverId);

      // Assert
      expect(driver.familyName).toBe('Verstappen');
      expect(driver.code).toBe('VER');
      expect(driver.permanentNumber).toBe('1');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/drivers/${driverId}.json`);
    });

    it('should throw error when driver not found', async () => {
      // Arrange
      const driverId = 'invalid_driver';
      const mockNotFoundData = {
        data: {
          MRData: {
            DriverTable: {
              Drivers: [],
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockNotFoundData);

      // Act & Assert
      await expect(service.getDriver(driverId)).rejects.toThrow('Driver not found');
    });
  });

  describe('getCurrentSeason', () => {
    it('should fetch the current season from API', async () => {
      // Arrange
      const mockCurrentSeasonData = {
        data: {
          MRData: {
            RaceTable: {
              Races: [
                {
                  season: '2026',
                  round: '1',
                  raceName: 'Bahrain GP',
                  date: '2026-03-22',
                },
              ],
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockCurrentSeasonData);

      // Act
      const season = await service.getCurrentSeason();

      // Assert
      expect(season).toBe('2026');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/current.json');
    });

    it('should return current year as fallback when no races found', async () => {
      // Arrange
      const mockNoRacesData = {
        data: {
          MRData: {
            RaceTable: {
              Races: [],
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockNoRacesData);

      // Act
      const season = await service.getCurrentSeason();

      // Assert
      const currentYear = new Date().getFullYear().toString();
      expect(season).toBe(currentYear);
    });
  });

  describe('getSeasonResults', () => {
    const makeResult = (driverId: string, position: string) => ({
      number: '1',
      position,
      positionText: position,
      points: '25',
      driver: {
        driverId,
        code: 'XXX',
        givenName: 'Test',
        familyName: driverId,
        dob: '1997-12-30',
        nationality: 'Dutch',
        url: 'http://example.com',
      },
      constructor: {
        constructorId: 'red_bull',
        name: 'Red Bull Racing',
        nationality: 'Austrian',
        url: 'http://example.com',
      },
      grid: '1',
      laps: '57',
      status: 'Finished',
    });

    const makePage = (total: number, offset: number, races: any[]) => ({
      data: {
        MRData: {
          total: String(total),
          limit: '100',
          offset: String(offset),
          RaceTable: { season: '2024', Races: races },
        },
      },
    });

    it('should paginate and flatten all season results', async () => {
      const season = '2024';
      // total = 150 rows, so a second page (offset 100) is genuinely needed.
      const page1 = makePage(150, 0, [
        {
          season: '2024',
          round: '1',
          raceName: 'Bahrain GP',
          Results: [makeResult('verstappen', '1'), makeResult('perez', '2')],
        },
      ]);
      const page2 = makePage(150, 100, [
        {
          season: '2024',
          round: '2',
          raceName: 'Saudi GP',
          Results: [makeResult('leclerc', '1')],
        },
      ]);

      mockAxiosInstance.get.mockImplementation((_path: string, config: any) => {
        const offset = config?.params?.offset ?? 0;
        return Promise.resolve(offset === 0 ? page1 : page2);
      });

      const results = await service.getSeasonResults(season);

      expect(results).toHaveLength(3);
      expect(results.map(r => r.driver.driverId)).toEqual(['verstappen', 'perez', 'leclerc']);
      // Each flattened result should carry its parent race's identity so
      // downstream consumers can group by race.
      expect(results[0].season).toBe('2024');
      expect(results[0].round).toBe('1');
      expect(results[0].raceName).toBe('Bahrain GP');
      expect(results[1].round).toBe('1');
      expect(results[2].season).toBe('2024');
      expect(results[2].round).toBe('2');
      expect(results[2].raceName).toBe('Saudi GP');
      // Two pages should have been fetched (offset 0 and offset 100).
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/2024/results.json', {
        params: { limit: 100, offset: 0 },
      });
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/2024/results.json', {
        params: { limit: 100, offset: 100 },
      });
    });

    it('should serve repeat calls from the in-memory cache', async () => {
      const season = '2023';
      const page1 = makePage(1, 0, [
        {
          round: '1',
          raceName: 'Bahrain GP',
          Results: [makeResult('verstappen', '1')],
        },
      ]);

      mockAxiosInstance.get.mockResolvedValue(page1);

      const first = await service.getSeasonResults(season);
      const callsAfterFirst = mockAxiosInstance.get.mock.calls.length;

      const second = await service.getSeasonResults(season);

      expect(first).toHaveLength(1);
      expect(second).toBe(first); // same cached array reference
      // Second call must not trigger any additional axios GET calls.
      expect(mockAxiosInstance.get.mock.calls.length).toBe(callsAfterFirst);
    });

    it('should stop when a page returns no races', async () => {
      const season = '2022';
      // total claims more rows, but the API returns an empty page early.
      const emptyPage = makePage(500, 0, []);
      mockAxiosInstance.get.mockResolvedValue(emptyPage);

      const results = await service.getSeasonResults(season);

      expect(results).toHaveLength(0);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDriverSeasonStandings', () => {
    const makeDriverStanding = (
      driverId: string,
      points: string,
      position: string,
      wins: string
    ) => ({
      position,
      positionText: position,
      points,
      wins,
      driver: {
        driverId,
        code: 'XXX',
        givenName: 'Test',
        familyName: driverId,
        dob: '1997-12-30',
        nationality: 'Dutch',
        url: 'http://example.com',
      },
      constructors: [],
    });

    const makeSeasonStandings = (season: string, driverStandings: any[]) => ({
      data: {
        MRData: {
          StandingsTable: {
            season,
            StandingsList: [
              {
                season,
                round: '22',
                DriverStandings: driverStandings,
              },
            ],
          },
        },
      },
    });

    it('should return per-season points/position/wins in chronological order', async () => {
      const driverId = 'verstappen';
      const seasonMap: Record<string, any> = {
        '2021': makeSeasonStandings('2021', [
          makeDriverStanding('verstappen', '395.5', '1', '10'),
          makeDriverStanding('hamilton', '387.5', '2', '8'),
        ]),
        '2022': makeSeasonStandings('2022', [
          makeDriverStanding('verstappen', '454', '1', '15'),
        ]),
        '2023': makeSeasonStandings('2023', [
          makeDriverStanding('verstappen', '575', '1', '19'),
        ]),
      };

      mockAxiosInstance.get.mockImplementation((path: string) => {
        const season = path.split('/')[1];
        return Promise.resolve(seasonMap[season]);
      });

      // Pass seasons out of order to prove sorting.
      const result = await service.getDriverSeasonStandings(driverId, [
        '2023',
        '2021',
        '2022',
      ]);

      expect(result).toEqual([
        { season: '2021', points: 395.5, position: 1, wins: 10 },
        { season: '2022', points: 454, position: 1, wins: 15 },
        { season: '2023', points: 575, position: 1, wins: 19 },
      ]);
    });

    it('should skip seasons where the driver has no entry', async () => {
      const driverId = 'verstappen';
      const seasonMap: Record<string, any> = {
        '2014': makeSeasonStandings('2014', [
          makeDriverStanding('hamilton', '384', '1', '11'),
        ]),
        '2015': makeSeasonStandings('2015', [
          makeDriverStanding('verstappen', '49', '12', '0'),
        ]),
        '2016': makeSeasonStandings('2016', [
          makeDriverStanding('verstappen', '204', '5', '1'),
        ]),
      };

      mockAxiosInstance.get.mockImplementation((path: string) => {
        const season = path.split('/')[1];
        return Promise.resolve(seasonMap[season]);
      });

      const result = await service.getDriverSeasonStandings(driverId, [
        '2014',
        '2015',
        '2016',
      ]);

      // 2014 has no verstappen entry -> skipped, not zero-filled.
      expect(result).toEqual([
        { season: '2015', points: 49, position: 12, wins: 0 },
        { season: '2016', points: 204, position: 5, wins: 1 },
      ]);
      expect(result.find(r => r.season === '2014')).toBeUndefined();
    });

    it('should serve repeat calls from the in-memory cache', async () => {
      const driverId = 'verstappen';
      const seasons = ['2022', '2023'];
      const seasonMap: Record<string, any> = {
        '2022': makeSeasonStandings('2022', [
          makeDriverStanding('verstappen', '454', '1', '15'),
        ]),
        '2023': makeSeasonStandings('2023', [
          makeDriverStanding('verstappen', '575', '1', '19'),
        ]),
      };

      mockAxiosInstance.get.mockImplementation((path: string) => {
        const season = path.split('/')[1];
        return Promise.resolve(seasonMap[season]);
      });

      const first = await service.getDriverSeasonStandings(driverId, seasons);
      const callsAfterFirst = mockAxiosInstance.get.mock.calls.length;

      const second = await service.getDriverSeasonStandings(driverId, seasons);

      expect(second).toBe(first); // same cached array reference
      // Second call must not trigger any additional axios GET calls.
      expect(mockAxiosInstance.get.mock.calls.length).toBe(callsAfterFirst);
    });
  });

  describe('axios configuration', () => {
    it('should create axios instance with correct configuration', () => {
      // Act
      service = new ErgastService();

      // Assert
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.jolpi.ca/ergast/f1',
        timeout: 10000,
        responseType: 'json',
      });
    });
  });
});
