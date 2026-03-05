import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

interface StarsBadgeProps {
  count: number;
  style?: object;
}

/**
 * Stars badge - affichage étoiles
 * Animation douce à chaque changement (scale + sparkle)
 * Le parent doit utiliser useSafeAreaInsets pour le positionner (top/right)
 */
export const StarsBadge: React.FC<StarsBadgeProps> = ({ count, style }) => {
  const scale = useSharedValue(1);
  const prevCount = React.useRef(count);

  useEffect(() => {
    if (prevCount.current !== count) {
      prevCount.current = count;
      // Sparkle animation on change
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F5EBE0',
    shadowColor: '#5D4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: {
    fontSize: 18,
  },
  count: {
    fontSize: 17,
    fontWeight: '700',
    color: '#5D4E37',
  },
});
