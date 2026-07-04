import React from 'react';
import { render } from '@testing-library/react-native';
import RaceCard from '@/components/race/RaceCard';
import { Race } from '@/types';

// Mock react-native-paper components
jest.mock('react-native-paper', () => ({
  Card: ({
    children,
    style,
  }: {
    children: React.ReactNode;
    style?: any;
  }) => <>{children}</>,
  'Card.Content': ({
    children,
    style,
  }: {
    children: React.ReactNode;
    style?: any;
  }) => <>{children}</>,
  Text: ({
    children,
    variant,
    style,
  }: {
    children: React.ReactNode;
    variant?: string;
    style?: any;
  }) => <>{children}</>,
}));

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
  it('renders race card with race name', () => {
    const { getByText } = render(<RaceCard race={mockRace} />);

    expect(getByText('Bahrain GP')).toBeTruthy();
  });

  it('displays circuit name', () => {
    const { getByText } = render(<RaceCard race={mockRace} />);

    expect(getByText('Bahrain International Circuit')).toBeTruthy();
  });

  it('displays race location', () => {
    const { getByText } = render(<RaceCard race={mockRace} />);

    expect(getByText('Bahrain, Bahrain')).toBeTruthy();
  });

  it('displays formatted date', () => {
    const { getByText } = render(<RaceCard race={mockRace} />);

    // formatDate will convert '2026-03-15' to 'Mar 15, 2026'
    expect(getByText('Mar 15, 2026')).toBeTruthy();
  });

  it('displays formatted time', () => {
    const { getByText } = render(<RaceCard race={mockRace} />);

    // formatTime will convert '13:00:00Z' to '13:00'
    expect(getByText('13:00')).toBeTruthy();
  });

  it('renders race card with optional onPress handler', () => {
    const onPress = jest.fn();
    const { getByText } = render(<RaceCard race={mockRace} onPress={onPress} />);

    expect(getByText('Bahrain GP')).toBeTruthy();
  });

  it('handles race with no time gracefully', () => {
    const raceWithoutTime: Race = {
      ...mockRace,
      time: undefined,
    };

    const { getByText } = render(<RaceCard race={raceWithoutTime} />);

    expect(getByText('Bahrain GP')).toBeTruthy();
    // Should display the formatter's fallback '--:--'
    expect(getByText('--:--')).toBeTruthy();
  });

  it('displays race info blocks with labels', () => {
    const { getByText } = render(<RaceCard race={mockRace} />);

    // These labels should appear in the component
    expect(getByText('Date')).toBeTruthy();
    expect(getByText('Circuit')).toBeTruthy();
    expect(getByText('Location')).toBeTruthy();
    expect(getByText('Time')).toBeTruthy();
  });
});
