import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NextRaceCard } from '@/components/home/NextRaceCard';
import { Race } from '@/types';

const mockRace: Race = {
  raceId: '1',
  season: '2026',
  round: '1',
  raceName: 'Bahrain GP',
  date: '2099-03-15',
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
    url: '',
  },
  url: '',
};

describe('NextRaceCard', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the race name and circuit', async () => {
    await render(<NextRaceCard race={mockRace} />);

    expect(screen.getByText('Bahrain GP')).toBeTruthy();
    expect(screen.getByText('Bahrain International Circuit')).toBeTruthy();
  });
});
