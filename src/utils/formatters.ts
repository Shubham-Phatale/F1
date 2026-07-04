/**
 * Formatter utility functions for dates, times, points, positions, and race data
 * All functions are pure and handle edge cases gracefully
 */

/**
 * Converts ISO date string to formatted date (e.g., "Mar 15, 2026")
 * @param dateString ISO date string (YYYY-MM-DD format)
 * @returns Formatted date string or "--" on error
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) {
    return '--';
  }

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '--';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '--';
  }
}

/**
 * Converts time string to HH:MM format
 * @param timeString Time string in HH:MM:SSZ format or HH:MM format
 * @returns Formatted time string (HH:MM) or "--:--" if invalid
 */
export function formatTime(timeString: string | undefined | null): string {
  if (!timeString || timeString.trim() === '') {
    return '--:--';
  }

  try {
    // Extract HH:MM from HH:MM:SS or HH:MM:SSZ format
    const timeParts = timeString.split(':');
    if (timeParts.length >= 2) {
      const hours = timeParts[0];
      const minutes = timeParts[1];
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    return '--:--';
  } catch {
    return '--:--';
  }
}

/**
 * Converts milliseconds to M:SS or HH:MM:SS format
 * @param milliseconds Duration in milliseconds
 * @returns Formatted duration string or "--:--" on error
 */
export function formatDuration(
  milliseconds: number | string | undefined | null
): string {
  if (milliseconds === null || milliseconds === undefined) {
    return '--:--';
  }

  try {
    const ms = typeof milliseconds === 'string' ? parseInt(milliseconds, 10) : milliseconds;

    if (isNaN(ms) || ms < 0) {
      return '--:--';
    }

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } catch {
    return '--:--';
  }
}

/**
 * Converts points value to string
 * @param points Points as string or number
 * @returns Points as string or "0" on invalid input
 */
export function formatPoints(points: string | number | undefined | null): string {
  if (points === null || points === undefined) {
    return '0';
  }

  if (typeof points === 'string') {
    // Check if string is empty or just whitespace
    if (points.trim() === '') {
      return '0';
    }
    const parsed = parseFloat(points);
    return isNaN(parsed) ? '0' : parsed.toString();
  }

  if (typeof points === 'number') {
    return isNaN(points) ? '0' : points.toString();
  }

  return '0';
}

/**
 * Converts position number to ordinal format (1st, 2nd, 3rd, etc.)
 * @param position Position as string or number
 * @returns Ordinal formatted position (e.g., "1st", "2nd") or "--" on error
 */
export function formatPosition(position: string | number | undefined | null): string {
  if (position === null || position === undefined) {
    return '--';
  }

  try {
    const pos = typeof position === 'string' ? parseInt(position, 10) : position;

    if (isNaN(pos) || pos < 1) {
      return '--';
    }

    // Handle ordinal suffix
    if (pos % 100 >= 11 && pos % 100 <= 13) {
      return `${pos}th`;
    }

    const lastDigit = pos % 10;
    switch (lastDigit) {
      case 1:
        return `${pos}st`;
      case 2:
        return `${pos}nd`;
      case 3:
        return `${pos}rd`;
      default:
        return `${pos}th`;
    }
  } catch {
    return '--';
  }
}

/**
 * Gets driver initials from first and last names
 * @param firstName Driver's first name
 * @param lastName Driver's last name
 * @returns Two-letter initials (e.g., "MV") or "" if inputs are invalid
 */
export function getDriverInitials(
  firstName: string | undefined | null,
  lastName: string | undefined | null
): string {
  if (!firstName || !lastName) {
    return '';
  }

  try {
    const first = firstName.trim().charAt(0).toUpperCase();
    const last = lastName.trim().charAt(0).toUpperCase();

    if (!first || !last) {
      return '';
    }

    return `${first}${last}`;
  } catch {
    return '';
  }
}

/**
 * Formats driver name as full or short version
 * @param givenName Driver's given name
 * @param familyName Driver's family name
 * @param short If true, returns initials + family name (e.g., "V VERSTAPPEN"), else full name
 * @returns Formatted driver name or "Unknown" on error
 */
export function formatDriverName(
  givenName: string | undefined | null,
  familyName: string | undefined | null,
  short = false
): string {
  if (!givenName || !familyName) {
    return 'Unknown';
  }

  try {
    const given = givenName.trim();
    const family = familyName.trim();

    if (!given || !family) {
      return 'Unknown';
    }

    if (short) {
      const initial = given.charAt(0).toUpperCase();
      return `${initial} ${family.toUpperCase()}`;
    }

    return `${given} ${family}`;
  } catch {
    return 'Unknown';
  }
}

/**
 * Checks if a race has finished based on status
 * @param status Race status string
 * @returns True if race is finished, false otherwise
 */
export function isRaceFinished(status: string | undefined | null): boolean {
  if (!status || typeof status !== 'string') {
    return false;
  }

  const statusLower = status.toLowerCase();

  // Race is finished if it has a numeric position (1, 2, 3, etc.)
  // or contains "lapped", "dnf", "accident", "collision", "mechanical", etc.
  const finishedPatterns = [
    /^\d+$/, // Numeric position
    /lapped/i,
    /dnf/i, // Did not finish
    /retired/i,
    /accident/i,
    /collision/i,
    /mechanical/i,
    /engine/i,
    /transmission/i,
    /hydraulic/i,
    /electrical/i,
    /brake/i,
    /suspension/i,
    /disqualified/i,
  ];

  return finishedPatterns.some((pattern) => pattern.test(statusLower));
}

/**
 * Returns human-readable race status
 * Common statuses: "Finished", "Lapped", "DNF", "Accident", "Retired", etc.
 * @param status Raw status string from API
 * @returns Formatted human-readable status or "Unknown" if invalid
 */
export function getRaceStatus(status: string | undefined | null): string {
  if (!status || typeof status !== 'string') {
    return 'Unknown';
  }

  try {
    const statusTrimmed = status.trim();

    // If it's a number, driver finished
    if (/^\d+$/.test(statusTrimmed)) {
      return 'Finished';
    }

    const statusLower = statusTrimmed.toLowerCase();

    // Map common status codes/abbreviations to human-readable format
    const statusMap: { [key: string]: string } = {
      dnf: 'DNF',
      rnf: 'DNF',
      ret: 'Retired',
      retired: 'Retired',
      accident: 'Accident',
      collision: 'Collision',
      mechanical: 'Mechanical',
      engine: 'Engine Failure',
      transmission: 'Transmission',
      hydraulic: 'Hydraulic',
      electrical: 'Electrical',
      brake: 'Brake Failure',
      suspension: 'Suspension',
      disqualified: 'Disqualified',
      excluded: 'Excluded',
      +lap: 'Lapped',
      lapped: 'Lapped',
      spun: 'Spun',
      fuel: 'Fuel Problem',
      power: 'Power Unit',
      'did not qualify': 'DNQ',
      'withdrew': 'Withdrew',
      'did not start': 'DNS',
      'not classified': 'NC',
    };

    // Try direct lookup
    if (statusMap[statusLower]) {
      return statusMap[statusLower];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(statusMap)) {
      if (statusLower.includes(key)) {
        return value;
      }
    }

    // If no match found, return the original status in title case
    return statusTrimmed
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  } catch {
    return 'Unknown';
  }
}
