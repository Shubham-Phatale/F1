import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PodiumCard } from '@/components/home/PodiumCard';
import { RaceResult } from '@/types';

function makeResult(position: string, code: string, family: string, team: string): RaceResult {
  return {
    number: position,
    position,
    positionText: position,
    points: '25',
    grid: position,
    laps: '57',
    status: 'Finished',
    driver: {
      driverId: family.toLowerCase(),
      code,
      givenName: 'First',
      familyName: family,
      dob: '1990-01-01',
      nationality: 'Test',
      url: '',
    },
    constructor: {
      constructorId: team.toLowerCase(),
      name: team,
      nationality: 'Test',
      url: '',
    },
  };
}

const podium: RaceResult[] = [
  makeResult('1', 'VER', 'Verstappen', 'Red Bull'),
  makeResult('2', 'HAM', 'Hamilton', 'Ferrari'),
  makeResult('3', 'NOR', 'Norris', 'McLaren'),
];

describe('PodiumCard', () => {
  it('renders the race name and the three drivers', async () => {
    await render(<PodiumCard raceName="Bahrain GP" country="Bahrain" podium={podium} />);

    expect(screen.getByText('Bahrain GP')).toBeTruthy();
    expect(screen.getByText('Verstappen')).toBeTruthy();
    expect(screen.getByText('Hamilton')).toBeTruthy();
    expect(screen.getByText('Norris')).toBeTruthy();
  });

  it('renders nothing when the podium is empty', async () => {
    const { toJSON } = await render(
      <PodiumCard raceName="Bahrain GP" podium={[]} />
    );
    expect(toJSON()).toBeNull();
  });
});
