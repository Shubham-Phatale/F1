import React from 'react';
import { View } from 'react-native';

interface Props {
  color: string;
  width?: number;
}

export const TeamColorBar: React.FC<Props> = ({ color, width = 3 }) => (
  <View style={{ width, alignSelf: 'stretch', backgroundColor: color, borderRadius: width }} />
);
