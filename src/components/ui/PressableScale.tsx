import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const SPRING = { damping: 18, stiffness: 220 };

export const PressableScale: React.FC<Props> = ({
  onPress,
  children,
  style,
  disabled,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        if (!disabled) scale.value = withSpring(0.97, SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING);
      }}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
};
