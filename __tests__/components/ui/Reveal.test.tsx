import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Reveal } from '@/components/ui';

describe('Reveal', () => {
  it('renders its children', async () => {
    await render(
      <Reveal>
        <Text>hi</Text>
      </Reveal>
    );

    expect(screen.getByText('hi')).toBeTruthy();
  });

  it('renders children with a stagger index', async () => {
    await render(
      <Reveal index={2}>
        <Text>staggered</Text>
      </Reveal>
    );

    expect(screen.getByText('staggered')).toBeTruthy();
  });
});
