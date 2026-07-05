import { PodiumScore } from '@/types';

const EXACT = 5;
const WRONG_SPOT = 2;
const PERFECT_BONUS = 3;

/**
 * Score a podium prediction against the actual podium.
 * predicted/actual are [P1, P2, P3] driverIds.
 * +5 exact position, +2 on podium wrong spot, +3 bonus if all three exact.
 */
export function scorePrediction(
  predicted: [string, string, string],
  actual: [string, string, string]
): PodiumScore {
  const perSlot = predicted.map((driver, i) => {
    if (!driver) return 0;
    if (driver === actual[i]) return EXACT;
    if (actual.includes(driver)) return WRONG_SPOT;
    return 0;
  }) as [number, number, number];

  const allExact = perSlot.every((p) => p === EXACT);
  const bonus = allExact ? PERFECT_BONUS : 0;
  const total = perSlot[0] + perSlot[1] + perSlot[2] + bonus;

  return { perSlot, bonus, total };
}
