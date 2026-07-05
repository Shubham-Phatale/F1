jest.mock('@/config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_db, _col, id) => ({ id })),
  collection: jest.fn(() => ({})),
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
}));
jest.mock('@/services/ergastAPI', () => ({
  ergastService: { getRaceResults: jest.fn() },
}));

import { setDoc, getDoc, getDocs } from 'firebase/firestore';
import { ergastService } from '@/services/ergastAPI';
import { predictionService } from '@/services/predictionService';

describe('predictionService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('savePrediction upserts a pending prediction with the deterministic id', async () => {
    await predictionService.savePrediction({
      uid: 'u1', displayName: 'Ann', season: '2024', round: '1', raceId: '2024-1',
      p1: 'ver', p2: 'lec', p3: 'ham',
    });
    expect(setDoc).toHaveBeenCalled();
    const [ref, data] = (setDoc as jest.Mock).mock.calls[0];
    expect(ref.id).toBe('u1_2024_1');
    expect(data).toMatchObject({ status: 'pending', pointsEarned: null, p1: 'ver' });
  });

  test('scoreUserPendingPredictions scores a finished race and updates leaderboard', async () => {
    // one pending prediction
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [{ data: () => ({
        uid: 'u1', displayName: 'Ann', season: '2024', round: '1', raceId: '2024-1',
        p1: 'ver', p2: 'lec', p3: 'ham', status: 'pending', pointsEarned: null, createdAt: 'x',
      }) }],
    });
    // actual podium from jolpica
    (ergastService.getRaceResults as jest.Mock).mockResolvedValue([
      { position: '1', driver: { driverId: 'ver' } },
      { position: '2', driver: { driverId: 'lec' } },
      { position: '3', driver: { driverId: 'ham' } },
    ]);
    // for the leaderboard recompute, return the now-scored prediction
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [{ data: () => ({ status: 'scored', pointsEarned: 18 }) }],
    });

    await predictionService.scoreUserPendingPredictions('u1', '2024');

    // prediction scored to 18 (perfect) and leaderboard upserted
    const scoredCall = (setDoc as jest.Mock).mock.calls.find(
      ([, d]) => d.status === 'scored'
    );
    expect(scoredCall[1].pointsEarned).toBe(18);
    const lbCall = (setDoc as jest.Mock).mock.calls.find(([, d]) => 'seasonPoints' in d);
    expect(lbCall[1].seasonPoints).toBe(18);
    expect(lbCall[1].racesPlayed).toBe(1);
  });

  test('pending race with no result yet is left pending', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [{ data: () => ({
        uid: 'u1', displayName: 'Ann', season: '2024', round: '2', raceId: '2024-2',
        p1: 'ver', p2: 'lec', p3: 'ham', status: 'pending', pointsEarned: null, createdAt: 'x',
      }) }],
    });
    (ergastService.getRaceResults as jest.Mock).mockResolvedValue([]); // no podium yet
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });

    await predictionService.scoreUserPendingPredictions('u1', '2024');
    const scoredCall = (setDoc as jest.Mock).mock.calls.find(([, d]) => d.status === 'scored');
    expect(scoredCall).toBeUndefined();
  });
});
