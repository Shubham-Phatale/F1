import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, SCREEN_GUTTER } from '@/theme';

interface Props {
  width?: number;
  height?: number;
  count?: number;
  borderRadius?: number;
}

export const Skeleton: React.FC<Props> = ({ width, height = 80, count = 1, borderRadius = 12 }) => {
  const screen = useWindowDimensions();
  const w = width ?? screen.width - 24;
  const shimmer = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={[styles.box, { width: w, height, borderRadius, opacity: shimmer }]}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surfaceRaised, marginHorizontal: SCREEN_GUTTER, marginBottom: 12 },
});
