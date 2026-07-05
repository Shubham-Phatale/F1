import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PodiumCard } from '@/components/home/PodiumCard';
import { RaceResult } from '@/types';

function makeResult(
  position: string,
  code: string,
  family: string,
  team: string,
  fastestLap?: RaceResult['fastestLap']
): RaceResult {
  return {
    number: position,
    position,
    positionText: position,
    points: '25',
    grid: position,
    laps: '57',
    status: 'Finished',
    fastestLap,
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
  makeResult('1', 'VER', 'Verstappen', 'Red Bull', {
    rank: '1',
    lap: '44',
    time: { time: '1:26.8' },
    averageSpeed: { speed: '210', units: 'kph' },
  }),
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

  it('renders the optional round label when provided', async () => {
    await render(
      <PodiumCard
        raceName="Bahrain GP"
        podium={podium}
        roundLabel="Round 12 · Silverstone"
      />
    );
    expect(screen.getByText('Round 12 · Silverstone')).toBeTruthy();
  });

  it('shows the fastest lap of the driver whose fastestLap rank is 1', async () => {
    await render(<PodiumCard raceName="Bahrain GP" podium={podium} />);
    expect(screen.getByText('Fastest lap VER 1:26.8')).toBeTruthy();
  });

  it('hides the fastest lap when no result has a rank-1 fastest lap', async () => {
    const noFastest: RaceResult[] = [
      makeResult('1', 'VER', 'Verstappen', 'Red Bull'),
      makeResult('2', 'HAM', 'Hamilton', 'Ferrari'),
      makeResult('3', 'NOR', 'Norris', 'McLaren'),
    ];
    await render(<PodiumCard raceName="Bahrain GP" podium={noFastest} />);
    expect(screen.queryByText(/Fastest lap/)).toBeNull();
  });

  it('fires onFullResults when the Full results link is pressed', async () => {
    const onFullResults = jest.fn();
    await render(
      <PodiumCard raceName="Bahrain GP" podium={podium} onFullResults={onFullResults} />
    );
    fireEvent.press(screen.getByText('Full results →'));
    expect(onFullResults).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when the podium is empty', async () => {
    const { toJSON } = await render(
      <PodiumCard raceName="Bahrain GP" podium={[]} />
    );
    expect(toJSON()).toBeNull();
  });
});
