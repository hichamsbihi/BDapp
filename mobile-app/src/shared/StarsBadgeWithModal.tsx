import React, { useState } from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { useAppStore } from '@/store';
import { StarsBadge } from './StarsBadge';
import { StarsModal } from './StarsModal';

interface StarsBadgeWithModalProps {
  style?: ViewStyle;
}

/**
 * Stars badge that opens the Stars modal on press.
 * Use this instead of StarsBadge when the badge should be tappable.
 */
export const StarsBadgeWithModal: React.FC<StarsBadgeWithModalProps> = ({ style }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const stars = useAppStore((s) => s.stars);

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, style]}
      >
        <StarsBadge count={stars} />
      </Pressable>
      <StarsModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
};
