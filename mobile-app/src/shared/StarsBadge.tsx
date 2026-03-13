import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, radius, shadows } from '@/theme';

interface StarsBadgeProps {
  count: number;
  style?: object;
}

export const StarsBadge: React.FC<StarsBadgeProps> = ({ count, style }) => {
  const scale = useSharedValue(1);
  const prevCount = React.useRef(count);

  useEffect(() => {
    if (prevCount.current !== count) {
      prevCount.current = count;
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 }),
      );
    }
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.badge, animatedStyle, style]}>
      <Text style={styles.icon}>⭐</Text>
      <Text style={styles.count}>{count}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  icon: {
    fontSize: 18,
  },
  count: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
});
