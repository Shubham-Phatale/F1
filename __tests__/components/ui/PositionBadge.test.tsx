import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PositionBadge } from '@/components/ui/PositionBadge';

describe('PositionBadge', () => {
  test('renders the position number', async () => {
    await render(<PositionBadge position={1} />);
    expect(screen.getByText('1')).toBeTruthy();
  });
  test('renders string positions (e.g. DNF text position)', async () => {
    await render(<PositionBadge position="3" />);
    expect(screen.getByText('3')).toBeTruthy();
  });
});
