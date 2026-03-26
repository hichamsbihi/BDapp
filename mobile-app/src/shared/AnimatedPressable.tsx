/**
 * AnimatedPressable — drop-in replacement for Pressable with spring-based
 * scale feedback and built-in accessibility defaults.
 *
 * Usage: replace <Pressable onPress={fn} style={...}> with
 *        <AnimatedPressable onPress={fn} style={...}>
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { damping: 15, stiffness: 150 } as const;
const PRESSED_SCALE = 0.96;

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Override scale when pressed (default 0.96). Use ~0.98 for subtle buttons. */
  scaleValue?: number;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  scaleValue = PRESSED_SCALE,
  onPressIn,
  onPressOut,
  disabled,
  accessibilityRole = 'button',
  ...rest
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(
    (e: any) => {
      scale.value = withSpring(scaleValue, SPRING_CONFIG);
      onPressIn?.(e);
    },
    [scale, scaleValue, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      scale.value = withSpring(1, SPRING_CONFIG);
      onPressOut?.(e);
    },
    [scale, onPressOut]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <ReanimatedPressable
      accessibilityRole={accessibilityRole}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
      {...rest}
    >
      {children}
    </ReanimatedPressable>
  );
};
