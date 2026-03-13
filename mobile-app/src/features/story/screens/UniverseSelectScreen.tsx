import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal as RNModal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ScreenContainer, StarsBadge, NotEnoughStarsModal, StepIndicator, Button } from '@/shared';
import { useAppStore } from '@/store';
import { UNIVERSE_UNLOCK_COST } from '@/constants/stars';
import { UniverseConfig } from '@/types';
import { useUniverses } from '@/hooks/useStoryData';
import { generateStoryId } from '@/utils/ids';
import { colors, spacing, typography, radius, shadows } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const EASE = Easing.out(Easing.cubic);

interface UniverseCardProps {
  universe: UniverseConfig;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onLockedPress: (universe: UniverseConfig) => void;
}

const UniverseCard: React.FC<UniverseCardProps> = ({
  universe,
  index,
  isSelected,
  onSelect,
  onLockedPress,
}) => {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      400 + index * 180,
      withTiming(1, { duration: 600, easing: EASE }),
    );
  }, [index, universe.isLocked]);

  const handlePress = () => {
    if (universe.isLocked) {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 40 }),
        withTiming(8, { duration: 40 }),
        withTiming(-6, { duration: 40 }),
        withTiming(6, { duration: 40 }),
        withTiming(0, { duration: 40 }),
      );
      onLockedPress(universe);
    } else {
      scale.value = withSequence(
        withSpring(0.96, { damping: 10, stiffness: 400 }),
        withSpring(1.02, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 400 }),
      );
      onSelect(universe.id);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: progress.value * scale.value },
      { translateX: shakeX.value },
    ],
  }));

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <Pressable
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          universe.isLocked && styles.cardLocked,
        ]}
        onPress={handlePress}
      >
        {/* Universe visual */}
        <View
          style={[
            styles.cardVisual,
            { backgroundColor: universe.color },
            universe.isLocked && styles.cardVisualLocked,
          ]}
        >
          <Text style={styles.cardEmoji}>{universe.emoji}</Text>

          {!universe.isLocked && (
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>OUVERT</Text>
            </View>
          )}

          {universe.isLocked && (
            <View style={styles.lockedOverlay}>
              <View style={styles.lockBadge}>
                <Text style={styles.lockIcon}>✨</Text>
              </View>
            </View>
          )}
        </View>

        {/* Universe info */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, universe.isLocked && styles.cardTitleLocked]}>
              {universe.name}
            </Text>
            {!universe.isLocked && isSelected && (
              <View style={styles.checkBadge}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardDesc, universe.isLocked && styles.cardDescLocked]}>
            {universe.isLocked ? 'Ce monde dort encore...' : universe.description}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

interface LockedModalProps {
  visible: boolean;
  universe: UniverseConfig | null;
  onClose: () => void;
  onUnlocked: () => void;
  canAfford: boolean;
  canAffordFn: (amount: number) => boolean;
  onUnlock: (id: string) => boolean;
  onWatchMagic: () => Promise<unknown>;
}

const LockedModal: React.FC<LockedModalProps> = ({
  visible,
  universe,
  onClose,
  onUnlocked,
  canAfford,
  canAffordFn,
  onUnlock,
  onWatchMagic,
}) => {
  const [showGainStars, setShowGainStars] = React.useState(false);

  if (!universe) return null;

  const handleUseStars = () => {
    if (onUnlock(universe.id)) {
      onUnlocked();
      onClose();
    } else {
      setShowGainStars(true);
    }
  };

  const handleGainStars = () => {
    setShowGainStars(true);
  };

  const handleWatchMagicForUnlock = async () => {
    await onWatchMagic();
    if (canAffordFn(UNIVERSE_UNLOCK_COST) && onUnlock(universe.id)) {
      onUnlocked();
      setShowGainStars(false);
      onClose();
    }
  };

  return (
    <>
      <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalEmoji}>{universe.emoji}</Text>
            <Text style={styles.modalTitle}>{universe.name}</Text>
            <Text style={styles.modalSubtitle}>Ce monde dort encore...</Text>
            <Text style={styles.modalMessage}>
              {canAfford
                ? "Tu as assez d'etoiles pour le reveiller !"
                : "Il lui manque encore quelques etoiles..."}
            </Text>

            <View style={styles.modalButtons}>
              {canAfford ? (
                <Button
                  title="Utiliser 3 etoiles"
                  onPress={handleUseStars}
                  variant="primary"
                  size="medium"
                  style={styles.modalBtn}
                />
              ) : (
                <Button
                  title="Gagner des etoiles"
                  onPress={handleGainStars}
                  variant="primary"
                  size="medium"
                  style={styles.modalBtn}
                />
              )}
              <Button
                title="Plus tard"
                onPress={onClose}
                variant="secondary"
                size="medium"
                style={styles.modalBtn}
              />
            </View>
          </Pressable>
        </Pressable>
      </RNModal>

      <NotEnoughStarsModal
        visible={showGainStars}
        onClose={() => setShowGainStars(false)}
        needed={UNIVERSE_UNLOCK_COST}
        onWatchMagic={handleWatchMagicForUnlock}
      />
    </>
  );
};

export const UniverseSelectScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [selectedUniverseId, setSelectedUniverseId] = useState<string | null>(null);
  const [lockedModalVisible, setLockedModalVisible] = useState(false);
  const [selectedLockedUniverse, setSelectedLockedUniverse] = useState<UniverseConfig | null>(null);

  const setCurrentStory = useAppStore((state) => state.setCurrentStory);
  const heroProfile = useAppStore((state) => state.heroProfile);
  const isPremium = useAppStore((state) => state.isPremium);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const setHasCompletedOnboarding = useAppStore((state) => state.setHasCompletedOnboarding);
  const stars = useAppStore((state) => state.stars);
  const unlockedUniverses = useAppStore((state) => state.unlockedUniverses);
  const canAfford = useAppStore((state) => state.canAfford);
  const unlockUniverse = useAppStore((state) => state.unlockUniverse);
  const rewardStar = useAppStore((state) => state.rewardStar);

  const isNewUser = !hasCompletedOnboarding;
  const gender = heroProfile?.gender || 'boy';
  const { data: rawUniverses, loading: universesLoading } = useUniverses(gender);

  const universes = useMemo(() => {
    if (isPremium) {
      return rawUniverses.map((u) => ({ ...u, isLocked: false }));
    }
    return rawUniverses.map((u) => {
      const isUnlocked = (unlockedUniverses ?? []).includes(u.id);
      return { ...u, isLocked: !isUnlocked };
    });
  }, [rawUniverses, isPremium, unlockedUniverses]);

  const introProgress = useSharedValue(0);
  const headerProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);

  useEffect(() => {
    introProgress.value = withTiming(1, { duration: 800, easing: EASE });
    headerProgress.value = withDelay(200, withTiming(1, { duration: 700, easing: EASE }));
    buttonProgress.value = withDelay(1200, withTiming(1, { duration: 700, easing: EASE }));
  }, []);

  const introStyle = useAnimatedStyle(() => ({
    opacity: introProgress.value,
    transform: [{ scale: interpolate(introProgress.value, [0, 1], [0.95, 1]) }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
    transform: [{ translateY: interpolate(headerProgress.value, [0, 1], [15, 0]) }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonProgress.value,
    transform: [{ scale: interpolate(buttonProgress.value, [0, 1], [0.9, 1]) }],
  }));

  const handleLockedPress = (universe: UniverseConfig) => {
    setSelectedLockedUniverse(universe);
    setLockedModalVisible(true);
  };

  const handleContinue = () => {
    if (!selectedUniverseId) return;
    if (!hasCompletedOnboarding) {
      setHasCompletedOnboarding(true);
    }
    setCurrentStory({
      id: generateStoryId(),
      universeId: selectedUniverseId,
      heroId: heroProfile?.id || 'default-hero',
      pages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isComplete: false,
    });
    router.push('/story/start-select');
  };

  const selectedUniverse = universes.find((u) => u.id === selectedUniverseId);

  return (
    <ScreenContainer style={styles.container}>
      <View style={[styles.starsHeader, { top: insets.top + 8, right: insets.right + 24 }]}>
        <StarsBadge count={stars} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isNewUser && (
          <View style={styles.stepWrap}>
            <StepIndicator currentStep={3} totalSteps={3} />
          </View>
        )}

        <Animated.View style={[styles.introContainer, introStyle]}>
          <Text style={styles.introText}>Une grande aventure t'attend...</Text>
        </Animated.View>

        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.greeting}>
            {heroProfile?.name ? `${heroProfile.name}, ` : ''}c'est le moment !
          </Text>
          <Text style={styles.title}>Choisis ta porte magique</Text>
          <Text style={styles.subtitle}>Chaque monde cache des secrets...</Text>
        </Animated.View>

        <View style={styles.cardsContainer}>
          {universes.map((universe, index) => (
            <UniverseCard
              key={universe.id}
              universe={universe}
              index={index}
              isSelected={selectedUniverseId === universe.id}
              onSelect={setSelectedUniverseId}
              onLockedPress={handleLockedPress}
            />
          ))}
        </View>

        <Text style={styles.hintText}>D'autres mondes t'attendent bientot...</Text>
      </ScrollView>

      <Animated.View style={[styles.footer, buttonStyle]}>
        <Button
          title={selectedUniverse ? 'Entrer dans ce monde' : 'Choisis une porte magique'}
          onPress={handleContinue}
          variant="primary"
          size="large"
          disabled={!selectedUniverseId}
        />
      </Animated.View>

      <LockedModal
        visible={lockedModalVisible}
        universe={selectedLockedUniverse}
        onClose={() => setLockedModalVisible(false)}
        onUnlocked={() => setSelectedUniverseId(selectedLockedUniverse?.id ?? null)}
        canAfford={canAfford(UNIVERSE_UNLOCK_COST)}
        canAffordFn={canAfford}
        onUnlock={unlockUniverse}
        onWatchMagic={() => rewardStar('watch_ad').then(() => {})}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  starsHeader: {
    position: 'absolute',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },

  stepWrap: {
    marginBottom: spacing.md,
  },

  introContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  introText: {
    ...typography.subtitle,
    fontWeight: '500',
    color: colors.inkLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  header: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  greeting: {
    ...typography.label,
    fontWeight: '500',
    color: colors.inkMuted,
    marginBottom: spacing.xs,
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

  cardsContainer: {
    gap: spacing.lg - 4,
    alignItems: 'center',
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: colors.ink,
    ...shadows.comic,
  },
  cardSelected: {
    borderColor: colors.accent,
    ...shadows.cardLifted,
  },
  cardLocked: {
    borderColor: colors.inkMuted,
    opacity: 0.7,
  },
  cardVisual: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardVisualLocked: {
    opacity: 0.5,
  },
  cardEmoji: {
    fontSize: 64,
  },
  openBadge: {
    position: 'absolute',
    top: spacing.md - 4,
    right: spacing.md - 4,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md - 4,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.md,
  },
  openBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.surface,
    letterSpacing: 0.5,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 24,
  },
  cardContent: {
    padding: spacing.md + 2,
    backgroundColor: colors.background,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm - 2,
  },
  cardTitle: {
    ...typography.title,
    fontSize: 20,
    color: colors.ink,
  },
  cardTitleLocked: {
    color: colors.inkMuted,
  },
  cardDesc: {
    ...typography.body,
    fontSize: 15,
    color: colors.inkLight,
  },
  cardDescLocked: {
    color: colors.inkMuted,
    fontStyle: 'italic',
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },

  hintText: {
    ...typography.caption,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },

  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl + spacing.sm,
    backgroundColor: colors.background,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  modalEmoji: {
    fontSize: 56,
    marginBottom: spacing.md - 4,
  },
  modalTitle: {
    ...typography.title,
    color: colors.ink,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.body,
    fontWeight: '500',
    color: colors.inkLight,
    marginBottom: spacing.md - 4,
  },
  modalMessage: {
    ...typography.body,
    fontSize: 15,
    color: colors.inkLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    width: '100%',
    gap: spacing.md - 4,
  },
  modalBtn: {
    width: '100%',
  },
});
