import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DriverPicker } from '@/components/predict/DriverPicker';
import type { Driver } from '@/types';

const drivers: Driver[] = [
  { driverId: 'ver', code: 'VER', givenName: 'Max', familyName: 'Verstappen', dob: '', nationality: '', url: '' },
  { driverId: 'lec', code: 'LEC', givenName: 'Charles', familyName: 'Leclerc', dob: '', nationality: '', url: '' },
];

describe('DriverPicker', () => {
  test('renders the three position slots', async () => {
    await render(
      <DriverPicker drivers={drivers} selected={['', '', '']} onChange={() => {}} />
    );
    expect(screen.getByText('P1')).toBeTruthy();
    expect(screen.getByText('P2')).toBeTruthy();
    expect(screen.getByText('P3')).toBeTruthy();
  });
});
