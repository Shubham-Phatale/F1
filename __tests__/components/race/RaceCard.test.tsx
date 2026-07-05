import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RaceCard from '@/components/race/RaceCard';
import { Race } from '@/types';

// Mock formatters
jest.mock('@/utils/formatters', () => ({
  formatDate: (date: string) => {
    if (!date) return '--';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '--';
    }
  },
  formatTime: (time: string) => {
    if (!time) return '--:--';
    try {
      const parts = time.split(':');
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
      return '--:--';
    } catch {
      return '--:--';
    }
  },
}));

const mockRace: Race = {
  raceId: '1',
  season: '2026',
  round: '1',
  raceName: 'Bahrain GP',
  date: '2026-03-15',
  time: '13:00:00Z',
  circuit: {
    circuitId: 'bahrain',
    circuitName: 'Bahrain International Circuit',
    location: {
      lat: '26.0325',
      long: '50.5106',
      locality: 'Bahrain',
      country: 'Bahrain',
    },
    url: 'http://en.wikipedia.org/wiki/Bahrain_International_Circuit',
  },
  url: 'http://en.wikipedia.org/wiki/2026_Bahrain_Grand_Prix',
};

describe('RaceCard', () => {
  it('renders race card with race name', async () => {
    await render(<RaceCard race={mockRace} />);

    expect(screen.getByText('Bahrain GP')).toBeTruthy();
  });

  it('displays circuit name', async () => {
    await render(<RaceCard race={mockRace} />);

    expect(screen.getByText('Bahrain International Circuit')).toBeTruthy();
  });

  it('displays race location', async () => {
    await render(<RaceCard race={mockRace} />);

    expect(screen.getByText('Bahrain, Bahrain')).toBeTruthy();
  });

  it('displays formatted date and time together', async () => {
    await render(<RaceCard race={mockRace} />);

    // Date + time are combined into a single meta line: "<date> · <time>".
    // Compute the expected date the same way the mock does so the assertion
    // is not sensitive to the test environment's timezone.
    const expectedDate = new Date(mockRace.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    expect(screen.getByText(`${expectedDate} · 13:00`)).toBeTruthy();
  });

  it('renders race card with optional onPress handler', async () => {
    const onPress = jest.fn();
    await render(<RaceCard race={mockRace} onPress={onPress} />);

    expect(screen.getByText('Bahrain GP')).toBeTruthy();
  });

  it('handles race with no time gracefully', async () => {
    const raceWithoutTime: Race = {
      ...mockRace,
      time: undefined,
    };

    await render(<RaceCard race={raceWithoutTime} />);

    expect(screen.getByText('Bahrain GP')).toBeTruthy();
    // Should display the formatter's fallback '--:--' in the combined meta line
    const expectedDate = new Date(mockRace.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    expect(screen.getByText(`${expectedDate} · --:--`)).toBeTruthy();
  });

  it('handles race with missing location gracefully', async () => {
    const raceWithoutLocation = {
      ...mockRace,
      circuit: { ...mockRace.circuit, location: undefined },
    } as unknown as Race;

    await render(<RaceCard race={raceWithoutLocation} />);

    expect(screen.getByText('Bahrain GP')).toBeTruthy();
    expect(screen.getByText('Location TBD')).toBeTruthy();
  });
});
