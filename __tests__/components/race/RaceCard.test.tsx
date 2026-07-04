import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RaceCard from '@/components/race/RaceCard';
import { Race } from '@/types';

// Mock react-native-paper components
jest.mock('react-native-paper', () => {
  const { View, Text: RNText } = require('react-native');
  const Card = ({
    children,
  }: {
    children: React.ReactNode;
    style?: any;
  }) => <View>{children}</View>;
  Card.Content = ({
    children,
  }: {
    children: React.ReactNode;
    style?: any;
  }) => <View>{children}</View>;
  return {
    Card,
    Text: ({
      children,
    }: {
      children: React.ReactNode;
      variant?: string;
      style?: any;
    }) => <RNText>{children}</RNText>,
  };
});

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

  it('displays formatted date', async () => {
    await render(<RaceCard race={mockRace} />);

    // formatDate converts the ISO date into a localized "Mon D, YYYY" string.
    // Compute the expected value the same way the mock does so the assertion
    // is not sensitive to the test environment's timezone.
    const expectedDate = new Date(mockRace.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    expect(screen.getByText(expectedDate)).toBeTruthy();
  });

  it('displays formatted time', async () => {
    await render(<RaceCard race={mockRace} />);

    // formatTime will convert '13:00:00Z' to '13:00'
    expect(screen.getByText('13:00')).toBeTruthy();
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
    // Should display the formatter's fallback '--:--'
    expect(screen.getByText('--:--')).toBeTruthy();
  });

  it('displays race info blocks with labels', async () => {
    await render(<RaceCard race={mockRace} />);

    // These labels should appear in the component
    expect(screen.getByText('Date')).toBeTruthy();
    expect(screen.getByText('Circuit')).toBeTruthy();
    expect(screen.getByText('Location')).toBeTruthy();
    expect(screen.getByText('Time')).toBeTruthy();
  });
});
