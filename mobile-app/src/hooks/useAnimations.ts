import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
  WithSpringConfig,
} from 'react-native-reanimated';

const SPRING_BOUNCY: WithSpringConfig = { damping: 8, stiffness: 150 };
const SPRING_GENTLE: WithSpringConfig = { damping: 15, stiffness: 120 };

/**
 * Press-in bounce effect for interactive elements.
 * Returns animated style + pressIn/pressOut handlers.
 */
export const usePressAnimation = (scaleTo = 0.92) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(scaleTo, SPRING_BOUNCY);
  }, [scaleTo]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_BOUNCY);
  }, []);

  return { animatedStyle, onPressIn, onPressOut };
};

/**
 * Celebration bounce (e.g. star reward, story completion).
 * Call trigger() to play a single overshoot bounce.
 */
export const useCelebrationBounce = () => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const trigger = useCallback(() => {
    scale.value = withSequence(
      withSpring(1.3, SPRING_BOUNCY),
      withSpring(0.9, SPRING_GENTLE),
      withSpring(1, SPRING_GENTLE)
    );
  }, []);

  return { animatedStyle, trigger };
};

/**
 * Gentle floating animation for decorative elements (mascot, badges).
 * Automatically starts on mount.
 */
export const useFloatingAnimation = (amplitude = 6) => {
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const start = useCallback(() => {
    translateY.value = withSequence(
      withTiming(-amplitude, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      withTiming(amplitude, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
    );
  }, [amplitude]);

  return { animatedStyle, start };
};

/**
 * Fade-in from bottom (for page content, cards appearing).
 */
export const useFadeInUp = (delay = 0) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const enter = useCallback(() => {
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.back(1.2)) });
  }, []);

  return { animatedStyle, enter };
};
