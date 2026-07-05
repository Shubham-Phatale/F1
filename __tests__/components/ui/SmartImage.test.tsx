import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SmartImage } from '@/components/ui/SmartImage';

describe('SmartImage', () => {
  test('renders fallback when uri is null', async () => {
    await render(<SmartImage uri={null} fallback={<Text>FB</Text>} width={40} height={40} />);
    expect(screen.getByText('FB')).toBeTruthy();
  });
  test('renders an image when uri is provided', async () => {
    await render(
      <SmartImage uri="https://x/p.png" fallback={<Text>FB</Text>} width={40} height={40} testID="img" />
    );
    expect(screen.getByTestId('img')).toBeTruthy();
  });
});
