import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
}

export const Reveal: React.FC<Props> = ({ children, index = 0, style }) => (
  <Animated.View
    style={style}
    entering={FadeInDown.duration(420).delay(index * 70)}
  >
    {children}
  </Animated.View>
);
