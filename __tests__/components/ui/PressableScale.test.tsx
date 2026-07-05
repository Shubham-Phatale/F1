import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PressableScale } from '@/components/ui';

describe('PressableScale', () => {
  it('renders its children', async () => {
    await render(
      <PressableScale>
        <Text>tap me</Text>
      </PressableScale>
    );

    expect(screen.getByText('tap me')).toBeTruthy();
  });

  it('fires onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(
      <PressableScale onPress={onPress}>
        <Text>tap me</Text>
      </PressableScale>
    );

    fireEvent.press(screen.getByText('tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
