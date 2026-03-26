import React, { useState } from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAppStore } from '@/store';
import { StarsBadge } from './StarsBadge';
import { StarsModal } from './StarsModal';

interface StarsBadgeWithModalProps {
  style?: ViewStyle;
}

/**
 * Stars badge that opens the Stars modal on press.
 * Hidden when user is premium (no stars needed).
 */
export const StarsBadgeWithModal: React.FC<StarsBadgeWithModalProps> = ({ style }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const stars = useAppStore((s) => s.stars);
  const isPremium = useAppStore((s) => s.isPremium);

  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  if (isPremium) return null;

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        onPressIn={() => { pressScale.value = withSpring(0.95, { damping: 15 }); }}
        onPressOut={() => { pressScale.value = withSpring(1, { damping: 12 }); }}
        style={style}
      >
        <Animated.View style={pressStyle}>
          <StarsBadge count={stars} />
        </Animated.View>
      </Pressable>
      <StarsModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
};
