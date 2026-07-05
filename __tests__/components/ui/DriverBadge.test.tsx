import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DriverBadge } from '@/components/ui/DriverBadge';

/** Flatten a possibly-array RN style prop into a single object. */
function flatStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (acc, s) => ({ ...acc, ...flatStyle(s) }),
      {}
    );
  }
  return (style as Record<string, unknown>) ?? {};
}

describe('DriverBadge', () => {
  test('renders the driver code', async () => {
    await render(<DriverBadge code="VER" teamColor="#3671C6" />);
    expect(screen.getByText('VER')).toBeTruthy();
  });

  test('uses white text on a dark team color', async () => {
    await render(<DriverBadge code="VER" teamColor="#3671C6" />);
    expect(flatStyle(screen.getByText('VER').props.style).color).toBe('#ffffff');
  });

  test('uses dark text on a light team color (Mercedes teal)', async () => {
    await render(<DriverBadge code="RUS" teamColor="#27F4D2" />);
    expect(flatStyle(screen.getByText('RUS').props.style).color).toBe('#06231D');
  });
});
