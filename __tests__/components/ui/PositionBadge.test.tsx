import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PositionBadge } from '@/components/ui/PositionBadge';
import { colors } from '@/theme';

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

describe('PositionBadge', () => {
  test('renders the position number', async () => {
    await render(<PositionBadge position={1} />);
    expect(screen.getByText('1')).toBeTruthy();
  });
  test('renders string positions (e.g. DNF text position)', async () => {
    await render(<PositionBadge position="3" />);
    expect(screen.getByText('3')).toBeTruthy();
  });

  test('P1 uses the gold medal background with dark text', async () => {
    await render(<PositionBadge position={1} />);
    const badge = screen.getByText('1').parent;
    expect(flatStyle(badge?.props.style).backgroundColor).toBe(colors.podiumGold);
    expect(flatStyle(screen.getByText('1').props.style).color).toBe('#3a2c00');
  });

  test('non-podium positions use the tile background with secondary text', async () => {
    await render(<PositionBadge position={7} />);
    const badge = screen.getByText('7').parent;
    expect(flatStyle(badge?.props.style).backgroundColor).toBe(colors.tile);
    expect(flatStyle(screen.getByText('7').props.style).color).toBe(colors.textSecondary);
  });
});
