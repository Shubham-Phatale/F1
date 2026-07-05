import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatCard } from '@/components/ui/StatCard';

describe('StatCard', () => {
  test('renders label and value', async () => {
    await render(<StatCard label="Points" value={575} />);
    expect(screen.getByText('Points')).toBeTruthy();
    expect(screen.getByText('575')).toBeTruthy();
  });
});
