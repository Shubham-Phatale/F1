import React, { useEffect } from 'react';
import { View, Animated, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';

interface SkeletonLoaderProps {
  width?: number;
  height?: number;
  count?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width,
  height = 100,
  count = 1,
  borderRadius = 8,
  style,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  // Set default width to screen width minus padding (16)
  const skeletonWidth = width !== undefined ? width : screenWidth - 16;

  useEffect(() => {
    // Create a shimmer animation that loops: 0 -> 1 -> 0
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [animatedValue]);

  // Interpolate animated value to opacity range 0.3 - 0.7
  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.skeleton,
            {
              width: skeletonWidth,
              height,
              borderRadius,
              opacity,
              marginBottom: index < count - 1 ? 12 : 0,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
  },
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
});

export default SkeletonLoader;
