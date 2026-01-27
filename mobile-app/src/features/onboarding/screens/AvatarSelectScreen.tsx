import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';
import { getAvatarsByGender } from '@/data';
import { Avatar } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = (SCREEN_WIDTH - 72) / 2;
const ANIMATION_DURATION = 600;
const EASING = Easing.out(Easing.cubic);

/**
 * Individual animated avatar component
 * Each instance has its own animation hooks (valid React pattern)
 */
interface AnimatedAvatarProps {
  avatar: Avatar;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({
  avatar,
  index,
  isSelected,
  onSelect,
}) => {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);

  // Entrance animation with stagger
  useEffect(() => {
    progress.value = withDelay(
      250 + index * 120,
      withTiming(1, { duration: 500, easing: EASING })
    );
  }, [index]);

  // Bounce animation on selection
  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1.08, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 400 })
    );
    onSelect(avatar.id);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value * scale.value }],
  }));

  return (
    <Animated.View style={[styles.avatarWrapper, animatedStyle]}>
      <Pressable
        style={[styles.avatarCard, isSelected && styles.avatarCardSelected]}
        onPress={handlePress}
      >
        {isSelected && (
          <View style={[styles.glowEffect, { backgroundColor: avatar.color }]} />
        )}

        <View style={[styles.avatarCircle, { backgroundColor: avatar.color }]}>
          <Text style={styles.avatarInitial}>{avatar.name.charAt(0)}</Text>
        </View>

        <Text style={[styles.avatarName, isSelected && styles.avatarNameSelected]}>
          {avatar.name}
        </Text>

        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

/**
 * Avatar selection screen - final step of onboarding
 */
export const AvatarSelectScreen: React.FC = () => {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);

  const updateHeroProfile = useAppStore((state) => state.updateHeroProfile);
  const setHasCompletedOnboarding = useAppStore((state) => state.setHasCompletedOnboarding);
  const heroProfile = useAppStore((state) => state.heroProfile);

  // Get avatars filtered by gender
  const avatars = useMemo(() => {
    const gender = heroProfile?.gender || 'boy';
    return getAvatarsByGender(gender);
  }, [heroProfile?.gender]);

  // Animation values
  const headerProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);
  const confirmMessageProgress = useSharedValue(0);

  useEffect(() => {
    headerProgress.value = withTiming(1, { duration: ANIMATION_DURATION, easing: EASING });
    buttonProgress.value = withDelay(800, withTiming(1, { duration: 700, easing: EASING }));
  }, []);

  useEffect(() => {
    confirmMessageProgress.value = selectedAvatarId
      ? withSpring(1, { damping: 12, stiffness: 200 })
      : withTiming(0, { duration: 200 });
  }, [selectedAvatarId]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
    transform: [{ translateY: interpolate(headerProgress.value, [0, 1], [20, 0]) }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonProgress.value,
    transform: [{ scale: interpolate(buttonProgress.value, [0, 1], [0.9, 1]) }],
  }));

  const confirmMessageStyle = useAnimatedStyle(() => ({
    opacity: confirmMessageProgress.value,
    transform: [
      { scale: interpolate(confirmMessageProgress.value, [0, 1], [0.8, 1]) },
      { translateY: interpolate(confirmMessageProgress.value, [0, 1], [10, 0]) },
    ],
  }));

  const handleComplete = () => {
    if (!selectedAvatarId) return;
    updateHeroProfile({ avatarId: selectedAvatarId });
    setHasCompletedOnboarding(true);
    router.replace('/story/universe-select');
  };

  const getConfirmationMessage = () => {
    const name = heroProfile?.name || '';
    return name
      ? `Parfait ${name} ! Ton héros est prêt ✨`
      : 'Super choix ! Ton héros est prêt ✨';
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.stepIndicator}>Dernière étape</Text>
          <Text style={styles.headerIcon}>🦸‍♂️</Text>
          <Text style={styles.title}>Voici tes héros !</Text>
          <Text style={styles.subtitle}>
            {heroProfile?.name
              ? `${heroProfile.name}, choisis celui qui te ressemble`
              : 'Choisis celui qui te ressemble'}
          </Text>
          <Text style={styles.subtitleHint}>
            C'est lui qui vivra toutes tes aventures !
          </Text>
        </Animated.View>

        <View style={styles.avatarGrid}>
          <View style={styles.avatarRow}>
            {avatars.slice(0, 2).map((avatar, index) => (
              <AnimatedAvatar
                key={avatar.id}
                avatar={avatar}
                index={index}
                isSelected={selectedAvatarId === avatar.id}
                onSelect={setSelectedAvatarId}
              />
            ))}
          </View>
          <View style={styles.avatarRow}>
            {avatars.slice(2, 4).map((avatar, index) => (
              <AnimatedAvatar
                key={avatar.id}
                avatar={avatar}
                index={index + 2}
                isSelected={selectedAvatarId === avatar.id}
                onSelect={setSelectedAvatarId}
              />
            ))}
          </View>
        </View>
      </View>

      <Animated.View style={[styles.footer, buttonStyle]}>
        <Animated.Text style={[styles.confirmMessage, confirmMessageStyle]}>
          {getConfirmationMessage()}
        </Animated.Text>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !selectedAvatarId && styles.buttonDisabled,
            pressed && selectedAvatarId && styles.buttonPressed,
          ]}
          onPress={handleComplete}
          disabled={!selectedAvatarId}
        >
          <Text style={[styles.buttonText, !selectedAvatarId && styles.buttonTextDisabled]}>
            L'aventure commence !
          </Text>
        </Pressable>
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFCF5',
  },
  content: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B8A99A',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  headerIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#5D4E37',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#8D7B68',
    textAlign: 'center',
  },
  subtitleHint: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF8A65',
    textAlign: 'center',
    marginTop: 4,
  },
  avatarGrid: {
    flex: 1,
    justifyContent: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
  },
  avatarCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F5EBE0',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarCardSelected: {
    borderColor: '#FF8A65',
    backgroundColor: '#FFF3E8',
    shadowColor: '#FF8A65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  glowEffect: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    opacity: 0.15,
    borderRadius: 30,
  },
  avatarCircle: {
    width: AVATAR_SIZE - 48,
    height: AVATAR_SIZE - 48,
    borderRadius: (AVATAR_SIZE - 48) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D4E37',
  },
  avatarNameSelected: {
    color: '#FF8A65',
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF8A65',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  confirmMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8A65',
    textAlign: 'center',
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#FF8A65',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF8A65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#E5DDD3',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    color: '#B8AFA3',
  },
});
