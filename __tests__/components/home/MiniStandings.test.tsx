import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MiniStandings, MiniStandingRow } from '@/components/home/MiniStandings';

const rows: MiniStandingRow[] = [
  {
    position: '1',
    primary: 'M. Verstappen',
    secondary: 'Red Bull',
    points: '310',
    teamColor: '#0600ef',
    badgeText: 'VER',
    emphasize: true,
  },
  {
    position: '2',
    primary: 'L. Hamilton',
    secondary: 'Ferrari',
    points: '280',
    teamColor: '#dc0000',
    badgeText: 'HAM',
  },
];

describe('MiniStandings', () => {
  it('renders the title and a row primary and points', async () => {
    await render(<MiniStandings title="Drivers Championship" rows={rows} />);

    expect(screen.getByText('Drivers Championship')).toBeTruthy();
    expect(screen.getByText('M. Verstappen')).toBeTruthy();
    expect(screen.getByText('310')).toBeTruthy();
  });

  it('renders a View all pressable when onViewAll is provided', async () => {
    await render(
      <MiniStandings title="Drivers Championship" rows={rows} onViewAll={() => {}} />
    );

    expect(screen.getByText('View all →')).toBeTruthy();
  });
});
