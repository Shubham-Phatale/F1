import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SectionHeader } from '@/components/ui/SectionHeader';

describe('SectionHeader', () => {
  test('renders the uppercase title text', async () => {
    await render(<SectionHeader title="Latest Race" />);
    expect(screen.getByText('Latest Race')).toBeTruthy();
  });
});
