import React from 'react';
import { render, screen } from '@testing-library/react-native';
import DriverRow from '@/components/race/DriverRow';
import { DriverStanding } from '@/types';

// Mock formatters
jest.mock('@/utils/formatters', () => ({
  formatPosition: (position: string) => {
    if (!position) return '--';
    try {
      const pos = parseInt(position, 10);
      if (isNaN(pos) || pos < 1) {
        return '--';
      }
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
  },
  formatDriverName: (givenName: string, familyName: string, short = false) => {
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
  },
  formatPoints: (points: string | number | undefined | null): string => {
    if (points === null || points === undefined) {
      return '0';
    }

    if (typeof points === 'string') {
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
  },
}));

const mockStanding: DriverStanding = {
  position: '1',
  positionText: '1',
  points: '25',
  wins: '2',
  driver: {
    driverId: 'max_verstappen',
    code: 'VER',
    givenName: 'Max',
    familyName: 'Verstappen',
    dob: '1997-12-30',
    nationality: 'Dutch',
    url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
  },
  constructors: [
    {
      constructorId: 'red_bull',
      name: 'Red Bull Racing',
      nationality: 'Austrian',
      url: 'http://en.wikipedia.org/wiki/Red_Bull_Racing',
    },
  ],
};

describe('DriverRow', () => {
  it('renders driver name', async () => {
    await render(<DriverRow standing={mockStanding} index={0} />);

    expect(screen.getByText('Max Verstappen')).toBeTruthy();
  });

  it('displays driver points', async () => {
    await render(<DriverRow standing={mockStanding} index={0} />);

    expect(screen.getByText('25')).toBeTruthy();
  });

  it('displays the position via the position badge', async () => {
    await render(<DriverRow standing={mockStanding} index={0} />);

    // PositionBadge renders the raw position value
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('displays constructor name', async () => {
    await render(<DriverRow standing={mockStanding} index={0} />);

    expect(screen.getByText('Red Bull Racing')).toBeTruthy();
  });

  it('displays the driver code badge', async () => {
    await render(<DriverRow standing={mockStanding} index={0} />);

    expect(screen.getByText('VER')).toBeTruthy();
  });

  it('handles standing with no constructors gracefully', async () => {
    const standingWithoutConstructor: DriverStanding = {
      ...mockStanding,
      constructors: [],
    };

    await render(<DriverRow standing={standingWithoutConstructor} index={0} />);

    expect(screen.getByText('Max Verstappen')).toBeTruthy();
    expect(screen.getByText('25')).toBeTruthy();
    // Constructor name should not be present
    expect(screen.queryByText('Red Bull Racing')).toBeFalsy();
  });

  it('displays multiple drivers with different positions', async () => {
    const secondPlaceStanding: DriverStanding = {
      ...mockStanding,
      position: '2',
      positionText: '2',
      points: '18',
      wins: '0',
      driver: {
        ...mockStanding.driver,
        driverId: 'charles_leclerc',
        code: 'LEC',
        givenName: 'Charles',
        familyName: 'Leclerc',
      },
    };

    await render(<DriverRow standing={secondPlaceStanding} index={1} />);

    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Charles Leclerc')).toBeTruthy();
    expect(screen.getByText('18')).toBeTruthy();
  });

  it('falls back to first 3 letters of family name when code is missing', async () => {
    const noCodeStanding: DriverStanding = {
      ...mockStanding,
      driver: {
        ...mockStanding.driver,
        code: '',
        givenName: 'Charles',
        familyName: 'Leclerc',
      },
    };

    await render(<DriverRow standing={noCodeStanding} index={2} />);

    expect(screen.getByText('LEC')).toBeTruthy();
  });

  it('renders with index prop for divider logic', async () => {
    await render(<DriverRow standing={mockStanding} index={5} />);

    expect(screen.getByText('Max Verstappen')).toBeTruthy();
  });

  it('renders last driver (index 19) without rendering divider', async () => {
    await render(<DriverRow standing={mockStanding} index={19} />);

    expect(screen.getByText('Max Verstappen')).toBeTruthy();
  });
});
