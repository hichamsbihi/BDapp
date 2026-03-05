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
import { ScreenContainer, StarsBadge, NotEnoughStarsModal } from '@/shared';
import { useAppStore } from '@/store';
import { UNIVERSE_UNLOCK_COST } from '@/constants/stars';
import { UniverseConfig } from '@/types';
import { useUniverses } from '@/hooks/useStoryData';
import { generateStoryId } from '@/utils/ids';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const ANIMATION_DURATION = 700;
const EASING = Easing.out(Easing.cubic);

/**
 * Animated universe card - "Magic Door" design
 */
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
  const glowOpacity = useSharedValue(0);
  const sparkle = useSharedValue(1);

  // Entrance animation
  useEffect(() => {
    progress.value = withDelay(
      400 + index * 180,
      withTiming(1, { duration: 600, easing: EASING })
    );

    // Subtle glow animation for unlocked universe
    if (!universe.isLocked) {
      glowOpacity.value = withDelay(
        800 + index * 180,
        withRepeat(
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          -1,
          true
        )
      );
    }
  }, [index, universe.isLocked]);

  const handlePress = () => {
    if (universe.isLocked) {
      // "Blocked magic" animation - shake + flash
      shakeX.value = withSequence(
        withTiming(-10, { duration: 40 }),
        withTiming(10, { duration: 40 }),
        withTiming(-8, { duration: 40 }),
        withTiming(8, { duration: 40 }),
        withTiming(-4, { duration: 40 }),
        withTiming(0, { duration: 40 })
      );
      sparkle.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(0.9, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      onLockedPress(universe);
    } else {
      scale.value = withSequence(
        withSpring(0.96, { damping: 10, stiffness: 400 }),
        withSpring(1.03, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 400 })
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

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkle.value }],
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
        {/* Animated glow for unlocked */}
        {!universe.isLocked && (
          <Animated.View
            style={[
              styles.cardGlow,
              { backgroundColor: universe.color },
              glowStyle,
            ]}
          />
        )}

        {/* Universe visual */}
        <View
          style={[
            styles.cardVisual,
            { backgroundColor: universe.color },
            universe.isLocked && styles.cardVisualLocked,
          ]}
        >
          <Animated.Text style={[styles.cardEmoji, sparkleStyle]}>
            {universe.emoji}
          </Animated.Text>

          {/* FREE badge for unlocked */}
          {!universe.isLocked && (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>OUVERT</Text>
            </View>
          )}

          {/* Locked overlay - "endormi" */}
          {universe.isLocked && (
            <View style={styles.lockedOverlay}>
              <View style={styles.lockBadge}>
                <Text style={styles.lockIcon}>✨</Text>
              </View>
              <Text style={styles.lockedHint}>Tu peux le réveiller ✨</Text>
            </View>
          )}

          {/* Selection glow */}
          {isSelected && (
            <View style={[styles.selectedGlow, { backgroundColor: universe.color }]} />
          )}
        </View>

        {/* Universe info */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, universe.isLocked && styles.cardTitleLocked]}>
              {universe.name}
            </Text>
            {!universe.isLocked && isSelected && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>✓</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardDescription, universe.isLocked && styles.cardDescriptionLocked]}>
            {universe.isLocked
              ? "Ce monde dort encore..."
              : universe.description}
          </Text>
          {!universe.isLocked && !isSelected && (
            <Text style={styles.availableHint}>Disponible maintenant ✨</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

/**
 * Locked universe modal - ton magique et rassurant pour l'enfant
 * Message émotionnel : "Ce monde dort encore", pas de wording technique
 */
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

  // Après la "magie", si assez d'étoiles : débloquer + fermer tout.
  // UX fluide : l'enfant entre DIRECTEMENT sans frustration.
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
                ? "Tu as assez d'étoiles pour le réveiller ! ✨"
                : "Tu peux le réveiller avec un peu de magie ✨\nIl lui manque encore quelques étoiles..."}
            </Text>

            <View style={styles.modalButtonsColumn}>
              {canAfford ? (
                <Pressable style={styles.modalButtonPrimary} onPress={handleUseStars}>
                  <Text style={styles.modalButtonPrimaryText}>Utiliser 3 étoiles ✨</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.modalButtonPrimary} onPress={handleGainStars}>
                  <Text style={styles.modalButtonPrimaryText}>Gagner des étoiles ✨</Text>
                </Pressable>
              )}
              <Pressable style={styles.modalButtonSecondary} onPress={onClose}>
                <Text style={styles.modalButtonSecondaryText}>⏳ Plus tard</Text>
              </Pressable>
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

/**
 * Universe selection screen - "Magic Doors" experience
 */
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

  // isLocked is computed client-side from unlockedUniverses / isPremium
  const universes = useMemo(() => {
    if (isPremium) {
      return rawUniverses.map((u) => ({ ...u, isLocked: false }));
    }
    return rawUniverses.map((u) => {
      const isUnlocked = (unlockedUniverses ?? []).includes(u.id);
      return { ...u, isLocked: !isUnlocked };
    });
  }, [rawUniverses, isPremium, unlockedUniverses]);

  // Animation values
  const introProgress = useSharedValue(0);
  const headerProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);
  const buttonPulse = useSharedValue(1);

  useEffect(() => {
    // Intro appears first (narrative moment)
    introProgress.value = withTiming(1, { duration: 800, easing: EASING });

    // Header follows
    headerProgress.value = withDelay(200, withTiming(1, { duration: ANIMATION_DURATION, easing: EASING }));

    // Button last
    buttonProgress.value = withDelay(1200, withTiming(1, { duration: 700, easing: EASING }));

    // Subtle pulse on button when visible
    setTimeout(() => {
      buttonPulse.value = withRepeat(
        withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    }, 2000);
  }, []);

  const introStyle = useAnimatedStyle(() => ({
    opacity: introProgress.value,
    transform: [
      { scale: interpolate(introProgress.value, [0, 1], [0.95, 1]) },
    ],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
    transform: [{ translateY: interpolate(headerProgress.value, [0, 1], [15, 0]) }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonProgress.value,
    transform: [
      { scale: interpolate(buttonProgress.value, [0, 1], [0.9, 1]) * buttonPulse.value },
    ],
  }));

  const handleLockedPress = (universe: UniverseConfig) => {
    setSelectedLockedUniverse(universe);
    setLockedModalVisible(true);
  };

  const handleContinue = () => {
    if (!selectedUniverseId) return;

    // Mark onboarding as complete when user proceeds (keeps step 3 visible until now)
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
        {/* Step indicator - only for new users */}
        {isNewUser && (
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>Étape 3</Text>
            <View style={styles.stepDots}>
              <View style={styles.stepDot} />
              <View style={styles.stepDot} />
              <View style={[styles.stepDot, styles.stepDotActive]} />
            </View>
          </View>
        )}

        {/* Narrative intro */}
        <Animated.View style={[styles.introContainer, introStyle]}>
          <Text style={styles.introEmoji}>✨🚪✨</Text>
          <Text style={styles.introText}>Une grande aventure t'attend...</Text>
        </Animated.View>

        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.greeting}>
            {heroProfile?.name ? `${heroProfile.name}, ` : ''}c'est le moment !
          </Text>
          <Text style={styles.title}>Choisis ta porte magique</Text>
          <Text style={styles.subtitle}>Chaque monde cache des secrets...</Text>
        </Animated.View>

        {/* Universe cards */}
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

        {/* Motivation hint */}
        <Text style={styles.hintText}>D'autres mondes t'attendent bientôt... ✨</Text>
      </ScrollView>

      {/* Footer with CTA */}
      <Animated.View style={[styles.footer, buttonStyle]}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            !selectedUniverseId && styles.buttonDisabled,
            pressed && selectedUniverseId && styles.buttonPressed,
          ]}
          onPress={handleContinue}
          disabled={!selectedUniverseId}
        >
          <Text style={[styles.buttonText, !selectedUniverseId && styles.buttonTextDisabled]}>
            {selectedUniverse ? `Entrer dans ce monde ✨` : 'Choisis une porte magique'}
          </Text>
        </Pressable>
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
    backgroundColor: '#FFFCF5',
  },
  starsHeader: {
    position: 'absolute',
    zIndex: 10,
    // top/right appliqués dynamiquement via useSafeAreaInsets
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B8A99A',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5DDD3',
  },
  stepDotActive: {
    backgroundColor: '#FF8A65',
    width: 20,
  },

  // Narrative intro
  introContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  introEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  introText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#8D7B68',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Header
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 15,
    fontWeight: '500',
    color: '#B8A99A',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#5D4E37',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#8D7B68',
    textAlign: 'center',
  },

  // Cards
  cardsContainer: {
    gap: 20,
    alignItems: 'center',
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#F5EBE0',
    shadowColor: '#5D4E37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    position: 'relative',
  },
  cardSelected: {
    borderColor: '#FF8A65',
    shadowColor: '#FF8A65',
    shadowOpacity: 0.3,
  },
  cardLocked: {
    borderColor: '#E5DDD3',
    shadowOpacity: 0.06,
  },
  cardGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 28,
    zIndex: -1,
  },
  cardVisual: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardVisualLocked: {
    opacity: 0.5,
  },
  cardEmoji: {
    fontSize: 70,
  },
  freeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(93, 78, 55, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  lockIcon: {
    fontSize: 28,
  },
  lockedHint: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  cardContent: {
    padding: 18,
    backgroundColor: '#FFFCF5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5D4E37',
  },
  cardTitleLocked: {
    color: '#A99A8A',
  },
  cardDescription: {
    fontSize: 15,
    color: '#8D7B68',
    lineHeight: 22,
  },
  cardDescriptionLocked: {
    color: '#B8A99A',
    fontStyle: 'italic',
  },
  availableHint: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 6,
  },
  selectedBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF8A65',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Hint
  hintText: {
    fontSize: 14,
    color: '#B8A99A',
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },

  // Footer
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#FFFCF5',
  },
  button: {
    backgroundColor: '#FF8A65',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#FF8A65',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  buttonTextDisabled: {
    color: '#B8AFA3',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(93, 78, 55, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFCF5',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  modalEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5D4E37',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8D7B68',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#8D7B68',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonsColumn: {
    width: '100%',
    gap: 12,
    alignItems: 'stretch',
  },
  modalButtonSecondary: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#F5EBE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8D7B68',
  },
  modalButtonPrimary: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#FF8A65',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
