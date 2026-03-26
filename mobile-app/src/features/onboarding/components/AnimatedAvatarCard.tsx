import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Image,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AvatarCharacter, FrameType } from '@/types';
import { colors, spacing, typography, shadows } from '@/theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = (SCREEN_WIDTH - 80) / 2;
const RING_PADDING = 6;
const INNER_SIZE = AVATAR_SIZE - RING_PADDING * 2; // Image fills circle, no background visible

interface AnimatedAvatarCardProps {
  avatar: AvatarCharacter;
  index: number;
  isSelected: boolean;
  onSelect: (avatar: AvatarCharacter) => void;
}

const REACTION_FRAMES: FrameType[] = ['wink', 'happy'];

const pickRandomReaction = (avatar: AvatarCharacter, current: FrameType): FrameType => {
  const available = REACTION_FRAMES.filter((f) => avatar.frames[f]);
  if (!available.length) return 'normal';
  if (available.length === 1) return available[0];
  const others = available.filter(f => f !== current);
  return others[Math.floor(Math.random() * others.length)];
};

const AnimatedAvatarCardInner: React.FC<AnimatedAvatarCardProps> = ({
  avatar,
  index,
  isSelected,
  onSelect,
}) => {
  const lottieRef = useRef<LottieView>(null);
  const [activeFrame, setActiveFrame] = useState<FrameType>('normal');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scale = useSharedValue(1);

  const switchToReaction = useCallback(() => {
    setActiveFrame(prev => pickRandomReaction(avatar, prev));
  }, [avatar]);

  const resetFrame = useCallback(() => {
    setActiveFrame('normal');
  }, []);

  const handlePress = useCallback(() => {
    // Squash then back to 1 — no overshoot/enlarge
    scale.value = withSequence(
      withSpring(0.92, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 14, stiffness: 300 })
    );
    lottieRef.current?.reset();
    lottieRef.current?.play();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTimeout(() => runOnJS(switchToReaction)(), 150);
    timeoutRef.current = setTimeout(() => runOnJS(resetFrame)(), 1600);

    onSelect(avatar);
  }, [avatar, onSelect, switchToReaction, resetFrame]);

  // Only scale on press — no entrance animation, no translateY, no glow
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // When deselected: cancel ongoing animation, reset scale and frame immediately
  React.useEffect(() => {
    if (!isSelected) {
      cancelAnimation(scale);
      scale.value = 1;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setActiveFrame('normal');
    }
  }, [isSelected]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const currentImageUrl = avatar.frames[activeFrame] || avatar.frames.normal;

  // Gradient colors: selected = warm orange ring, unselected = subtle light ring
  const gradientColors = isSelected
    ? ['#FF8A65', '#FFD54F', '#FF8A65'] as const
    : ['#F0EAE0', '#E8E0D5', '#F0EAE0'] as const;

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable onPress={handlePress} style={styles.pressable}>

        {/* Gradient ring around avatar */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientRing, isSelected && styles.gradientRingSelected]}
        >
          {/* Inner image circle */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: currentImageUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
              fadeDuration={0}
            />
          </View>
        </LinearGradient>

        {/* Lottie sparkle overlay — sits on top of everything */}
        <LottieView
          ref={lottieRef}
          source={require('@/assets/animations/stars-burst.json')}
          autoPlay={false}
          loop={false}
          style={styles.sparkleOverlay}
          speed={1.3}
        />

        {/* Name badge */}
        <View style={[styles.nameBadge, isSelected && styles.nameBadgeSelected]}>
          <Text
            style={[styles.name, isSelected && styles.nameSelected]}
            numberOfLines={1}
          >
            {avatar.characterName}
          </Text>
        </View>

      </Pressable>
    </Animated.View>
  );
};

export const AnimatedAvatarCard = React.memo(AnimatedAvatarCardInner);

const styles = StyleSheet.create({
  wrapper: {
    width: AVATAR_SIZE,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  pressable: {
    alignItems: 'center',
  },
  gradientRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    padding: RING_PADDING,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  gradientRingSelected: {
    ...shadows.md,
  },
 // AFTER — image is scaled up 115%, overflow:hidden clips the padding invisibly
imageContainer: {
  width: INNER_SIZE,
  height: INNER_SIZE,
  borderRadius: INNER_SIZE / 2,
  overflow: 'hidden',
  backgroundColor: 'transparent',       // ← no background bleeds through
  alignItems: 'center',
  justifyContent: 'center',
},
avatarImage: {
  width: INNER_SIZE * 1.25 ,             // ← 15% bigger than the container
  height: INNER_SIZE * 1.25,            // ← overflow:hidden clips the excess
},
  sparkleOverlay: {
    position: 'absolute',
    top: -AVATAR_SIZE * 0.3,
    left: -AVATAR_SIZE * 0.3,
    width: AVATAR_SIZE * 1.6,
    height: AVATAR_SIZE * 1.6,
    pointerEvents: 'none',
  },
  nameBadge: {
    marginTop: -14,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  nameBadgeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  name: {
    fontSize: typography.size.md + 1,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
  },
  nameSelected: {
    color: colors.text.inverse,
  },
});
