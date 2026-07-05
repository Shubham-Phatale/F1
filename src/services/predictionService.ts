import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ergastService } from '@/services/ergastAPI';
import { scorePrediction } from '@/utils/scoring';
import { Prediction, LeaderboardEntry } from '@/types';

function predictionId(uid: string, season: string, round: string): string {
  return `${uid}_${season}_${round}`;
}

export class PredictionService {
  async savePrediction(input: {
    uid: string;
    displayName: string;
    season: string;
    round: string;
    raceId: string;
    p1: string;
    p2: string;
    p3: string;
  }): Promise<void> {
    const id = predictionId(input.uid, input.season, input.round);
    const prediction: Prediction = {
      uid: input.uid,
      season: input.season,
      round: input.round,
      raceId: input.raceId,
      p1: input.p1,
      p2: input.p2,
      p3: input.p3,
      displayName: input.displayName,
      createdAt: new Date().toISOString(),
      status: 'pending',
      pointsEarned: null,
    };
    await setDoc(doc(db, 'predictions', id), prediction);
  }

  async getUserPrediction(uid: string, season: string, round: string): Promise<Prediction | null> {
    const snap = await getDoc(doc(db, 'predictions', predictionId(uid, season, round)));
    return snap.exists() ? (snap.data() as Prediction) : null;
  }

  async getUserPredictions(uid: string, season: string): Promise<Prediction[]> {
    const q = query(
      collection(db, 'predictions'),
      where('uid', '==', uid),
      where('season', '==', season)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Prediction);
  }

  async scoreUserPendingPredictions(uid: string, season: string): Promise<void> {
    const all = await this.getUserPredictions(uid, season);
    const pending = all.filter((p) => p.status === 'pending');

    let scoredAny = false;
    for (const p of pending) {
      const results = await ergastService.getRaceResults(p.season, p.round);
      const podium = results
        .filter((r) => ['1', '2', '3'].includes(r.position))
        .sort((a, b) => Number(a.position) - Number(b.position))
        .map((r) => r.driver.driverId);
      if (podium.length < 3) continue; // race not finished / no result yet

      const score = scorePrediction(
        [p.p1, p.p2, p.p3],
        [podium[0], podium[1], podium[2]]
      );
      await setDoc(doc(db, 'predictions', predictionId(uid, p.season, p.round)), {
        ...p,
        status: 'scored',
        pointsEarned: score.total,
      });
      scoredAny = true;
    }

    if (scoredAny) {
      await this.updateLeaderboard(uid, season);
    }
  }

  private async updateLeaderboard(uid: string, season: string): Promise<void> {
    const all = await this.getUserPredictions(uid, season);
    const scored = all.filter((p) => p.status === 'scored');
    const seasonPoints = scored.reduce((sum, p) => sum + (p.pointsEarned ?? 0), 0);
    const displayName = all[0]?.displayName ?? 'Player';
    const entry: LeaderboardEntry = {
      uid,
      displayName,
      seasonPoints,
      racesPlayed: scored.length,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'leaderboard', uid), entry);
  }

  async getSeasonLeaderboard(): Promise<LeaderboardEntry[]> {
    const q = query(collection(db, 'leaderboard'), orderBy('seasonPoints', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LeaderboardEntry);
  }

  async getRaceLeaderboard(season: string, round: string): Promise<Prediction[]> {
    const q = query(
      collection(db, 'predictions'),
      where('season', '==', season),
      where('round', '==', round),
      where('status', '==', 'scored'),
      orderBy('pointsEarned', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Prediction);
  }
}

export const predictionService = new PredictionService();
