import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DriverBadge } from '@/components/ui/DriverBadge';

describe('DriverBadge', () => {
  test('renders the driver code', async () => {
    await render(<DriverBadge code="VER" teamColor="#3671C6" />);
    expect(screen.getByText('VER')).toBeTruthy();
  });
});
