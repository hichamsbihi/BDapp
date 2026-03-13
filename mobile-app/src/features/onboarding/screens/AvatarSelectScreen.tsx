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
import { ScreenContainer, StepIndicator, Button } from '@/shared';
import { useAppStore } from '@/store';
import { getAvatarsByGender } from '@/data';
import { Avatar } from '@/types';
import { colors, spacing, typography, radius, shadows } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = (SCREEN_WIDTH - 72) / 2;
const EASE = Easing.out(Easing.cubic);

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

  useEffect(() => {
    progress.value = withDelay(
      250 + index * 120,
      withTiming(1, { duration: 500, easing: EASE }),
    );
  }, [index]);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1.05, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 400 }),
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
        {/* Character silhouette placeholder */}
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

export const AvatarSelectScreen: React.FC = () => {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);

  const updateHeroProfile = useAppStore((state) => state.updateHeroProfile);
  const heroProfile = useAppStore((state) => state.heroProfile);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);

  const isNewUser = !hasCompletedOnboarding;

  const avatars = useMemo(() => {
    const gender = heroProfile?.gender || 'boy';
    return getAvatarsByGender(gender);
  }, [heroProfile?.gender]);

  const headerProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);
  const confirmProgress = useSharedValue(0);

  useEffect(() => {
    headerProgress.value = withTiming(1, { duration: 600, easing: EASE });
    buttonProgress.value = withDelay(800, withTiming(1, { duration: 700, easing: EASE }));
  }, []);

  useEffect(() => {
    confirmProgress.value = selectedAvatarId
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

  const confirmStyle = useAnimatedStyle(() => ({
    opacity: confirmProgress.value,
    transform: [
      { scale: interpolate(confirmProgress.value, [0, 1], [0.8, 1]) },
      { translateY: interpolate(confirmProgress.value, [0, 1], [10, 0]) },
    ],
  }));

  const handleComplete = () => {
    if (!selectedAvatarId) return;
    updateHeroProfile({ avatarId: selectedAvatarId });
    router.replace('/story/universe-select');
  };

  const confirmMessage = heroProfile?.name
    ? `Parfait ${heroProfile.name} ! Ton heros est pret`
    : 'Super choix ! Ton heros est pret';

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.header, headerStyle]}>
          {isNewUser && (
            <View style={styles.stepWrap}>
              <StepIndicator currentStep={2} totalSteps={3} />
            </View>
          )}
          <Text style={styles.title}>Voici tes heros !</Text>
          <Text style={styles.subtitle}>
            {heroProfile?.name
              ? `${heroProfile.name}, choisis celui qui te ressemble`
              : 'Choisis celui qui te ressemble'}
          </Text>
          <Text style={styles.hint}>
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
        <Animated.Text style={[styles.confirmMessage, confirmStyle]}>
          {confirmMessage}
        </Animated.Text>

        <Button
          title="L'aventure commence !"
          onPress={handleComplete}
          variant="primary"
          size="large"
          disabled={!selectedAvatarId}
        />
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stepWrap: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    fontSize: 26,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.sm - 2,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkLight,
    textAlign: 'center',
  },
  hint: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.accent,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  avatarGrid: {
    flex: 1,
    justifyContent: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
  },
  avatarCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.ink,
    position: 'relative',
    overflow: 'hidden',
    ...shadows.comic,
  },
  avatarCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
    ...shadows.cardLifted,
  },
  avatarCircle: {
    width: AVATAR_SIZE - 48,
    height: AVATAR_SIZE - 48,
    borderRadius: (AVATAR_SIZE - 48) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md - 4,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.surface,
  },
  avatarName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.ink,
  },
  avatarNameSelected: {
    color: colors.accent,
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },

  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl + spacing.sm,
  },
  confirmMessage: {
    ...typography.body,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: spacing.md - 2,
  },
});
