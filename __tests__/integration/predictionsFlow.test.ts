import { configureStore } from '@reduxjs/toolkit';
import predictionsReducer, {
  setPrediction,
  setPredictions,
  clearPredictions,
} from '@/redux/slices/predictionsSlice';
import leaderboardReducer, {
  setSeasonLeaderboard,
} from '@/redux/slices/leaderboardSlice';
import type { Prediction, LeaderboardEntry } from '@/types';

const mkPred = (round: string): Prediction => ({
  uid: 'u1', season: '2024', round, raceId: `2024-${round}`,
  p1: 'ver', p2: 'lec', p3: 'ham', displayName: 'Ann',
  createdAt: 'x', status: 'pending', pointsEarned: null,
});

describe('predictions + leaderboard slices', () => {
  const store = () =>
    configureStore({ reducer: { predictions: predictionsReducer, leaderboard: leaderboardReducer } });

  test('setPredictions indexes by round', () => {
    const s = store();
    s.dispatch(setPredictions([mkPred('1'), mkPred('2')]));
    expect(Object.keys(s.getState().predictions.byRound)).toEqual(['1', '2']);
  });

  test('setPrediction upserts one round', () => {
    const s = store();
    s.dispatch(setPrediction(mkPred('3')));
    expect(s.getState().predictions.byRound['3'].p1).toBe('ver');
  });

  test('clearPredictions empties state', () => {
    const s = store();
    s.dispatch(setPredictions([mkPred('1')]));
    s.dispatch(clearPredictions());
    expect(s.getState().predictions.byRound).toEqual({});
  });

  test('setSeasonLeaderboard stores entries', () => {
    const s = store();
    const entry: LeaderboardEntry = { uid: 'u1', displayName: 'Ann', seasonPoints: 18, racesPlayed: 1, updatedAt: 'x' };
    s.dispatch(setSeasonLeaderboard([entry]));
    expect(s.getState().leaderboard.season[0].seasonPoints).toBe(18);
  });
});
