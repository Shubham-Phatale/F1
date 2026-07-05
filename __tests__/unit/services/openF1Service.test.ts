import axios from 'axios';
import { OpenF1Service } from '@/services/openF1Service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const DRIVERS = [
  { name_acronym: 'VER', headshot_url: 'https://x/ver.png', team_colour: '3671C6', team_name: 'Red Bull Racing' },
  { name_acronym: 'LEC', headshot_url: 'https://x/lec.png', team_colour: 'E8002D', team_name: 'Ferrari' },
];

describe('OpenF1Service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getDriverMedia matches by acronym and normalizes team_colour to #hex', async () => {
    mockedAxios.get.mockResolvedValue({ data: DRIVERS });
    const svc = new OpenF1Service();
    const media = await svc.getDriverMedia('VER');
    expect(media?.headshotUrl).toBe('https://x/ver.png');
    expect(media?.teamColour).toBe('#3671C6');
    expect(media?.teamName).toBe('Red Bull Racing');
  });

  test('unknown acronym returns null', async () => {
    mockedAxios.get.mockResolvedValue({ data: DRIVERS });
    const svc = new OpenF1Service();
    expect(await svc.getDriverMedia('XXX')).toBeNull();
  });

  test('caches the driver list (one network call for repeated lookups)', async () => {
    mockedAxios.get.mockResolvedValue({ data: DRIVERS });
    const svc = new OpenF1Service();
    await svc.getDriverMedia('VER');
    await svc.getDriverMedia('LEC');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test('network failure resolves to null (never throws to UI)', async () => {
    mockedAxios.get.mockRejectedValue(new Error('offline'));
    const svc = new OpenF1Service();
    expect(await svc.getDriverMedia('VER')).toBeNull();
  });
});
