import React, { useState } from 'react';
import { Image, View } from 'react-native';

interface Props {
  uri: string | null;
  fallback: React.ReactNode;
  width: number;
  height: number;
  borderRadius?: number;
  testID?: string;
}

export const SmartImage: React.FC<Props> = ({ uri, fallback, width, height, borderRadius = 0, testID }) => {
  const [errored, setErrored] = useState(false);
  if (!uri || errored) {
    return <View style={{ width, height }}>{fallback}</View>;
  }
  return (
    <Image
      testID={testID}
      source={{ uri }}
      style={{ width, height, borderRadius }}
      onError={() => setErrored(true)}
      resizeMode="cover"
    />
  );
};
