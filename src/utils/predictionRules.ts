export function getRaceLockTime(date: string, time?: string): number {
  if (time) {
    // Ergast time is like "15:00:00Z"
    return Date.parse(`${date}T${time}`);
  }
  return Date.parse(`${date}T00:00:00Z`);
}

export function isPredictionOpen(date: string, time: string | undefined, now: number): boolean {
  return now < getRaceLockTime(date, time);
}

export function validatePodium(
  p1: string,
  p2: string,
  p3: string
): { valid: boolean; error?: string } {
  if (!p1 || !p2 || !p3) {
    return { valid: false, error: 'Pick a driver for all three positions.' };
  }
  if (p1 === p2 || p1 === p3 || p2 === p3) {
    return { valid: false, error: 'Each position must be a different driver.' };
  }
  return { valid: true };
}
