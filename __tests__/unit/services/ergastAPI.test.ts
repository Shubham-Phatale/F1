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
    it('should fetch driver standings for a season', async () => {
      // Arrange
      const season = '2026';
      const mockStandingsData = {
        data: {
          MRData: {
            StandingsTable: {
              season: '2026',
              round: '12',
              StandingsList: [
                {
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

      mockAxiosInstance.get.mockResolvedValueOnce(mockStandingsData);

      // Act
      const standings = await service.getStandings(season);

      // Assert
      expect(standings.season).toBe('2026');
      expect(standings.round).toBe('12');
      expect(standings.driverStandings).toHaveLength(1);
      expect(standings.driverStandings[0].driver.familyName).toBe('Verstappen');
      expect(standings.constructorStandings).toHaveLength(1);
      expect(standings.constructorStandings[0].constructor.name).toBe('Red Bull Racing');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/2026/standings.json');
    });

    it('should fetch standings for a specific round', async () => {
      // Arrange
      const season = '2026';
      const round = '5';
      const mockRoundStandingsData = {
        data: {
          MRData: {
            StandingsTable: {
              season: '2026',
              round: '5',
              StandingsList: [
                {
                  DriverStandings: [],
                  ConstructorStandings: [],
                },
              ],
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockRoundStandingsData);

      // Act
      await service.getStandings(season, round);

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/${season}/${round}/standings.json`);
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

      mockAxiosInstance.get.mockResolvedValueOnce(mockEmptyStandings);

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

  describe('axios configuration', () => {
    it('should create axios instance with correct configuration', () => {
      // Act
      service = new ErgastService();

      // Assert
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://ergast.com/api/f1',
        timeout: 10000,
        responseType: 'json',
      });
    });
  });
});
