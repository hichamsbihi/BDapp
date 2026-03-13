import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography, shadows } from '@/theme/theme';

interface StarsBadgeProps {
  count: number;
  style?: object;
}

/**
 * Stars badge with scale animation on count change.
 * Parent should use useSafeAreaInsets for positioning (top/right).
 */
export const StarsBadge: React.FC<StarsBadgeProps> = ({ count, style }) => {
  const scale = useSharedValue(1);
  const prevCount = React.useRef(count);

  useEffect(() => {
    if (prevCount.current !== count) {
      prevCount.current = count;
      scale.value = withSequence(
        withSpring(1.08, { damping: 10 }),
        withSpring(1, { damping: 12 })
      );
    }
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.badge, animatedStyle, style]}>
      <Text style={styles.icon} allowFontScaling={false}>⭐</Text>
      <Text style={styles.count} allowFontScaling={false}>{count}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surface,
    ...shadows.sm,
  },
  icon: {
    fontSize: 18,
  },
  count: {
    fontSize: 17,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
  },
});
