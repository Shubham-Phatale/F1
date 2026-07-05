import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';

describe('LeaderboardRow', () => {
  test('renders rank, name, and points', async () => {
    await render(<LeaderboardRow rank={1} displayName="Ann" points={42} />);
    expect(screen.getByText('Ann')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });
});
