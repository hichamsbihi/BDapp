import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Keyboard,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/shared';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import { useAppStore } from '@/store';
import { colors, radius, shadows, spacing, typography } from '@/theme/theme';

type Gender = 'boy' | 'girl';

/**
 * Hero info screen - collect hero name, age, and gender
 * 
 * Animation sequence matches WelcomeScreen philosophy:
 * - Progressive reveal (storytelling)
 * - Soft, non-aggressive transitions
 * - Micro-interactions on selection
 */
export const HeroInfoScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);

  const ageInputRef = useRef<TextInput>(null);
  const heroProfile = useAppStore((state) => state.heroProfile);
  const setHeroProfile = useAppStore((state) => state.setHeroProfile);
  const updateHeroProfile = useAppStore((state) => state.updateHeroProfile);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);

  const isEditMode = Boolean(hasCompletedOnboarding && heroProfile);
  const isNewUser = !hasCompletedOnboarding;

  useEffect(() => {
    if (isEditMode && heroProfile) {
      setName(heroProfile.name || '');
      setAge(heroProfile.age ? String(heroProfile.age) : '');
      setGender(heroProfile.gender || null);
    }
  }, [isEditMode, heroProfile?.id]);

  // Animation progress values (0 = hidden, 1 = visible)
  const headerProgress = useSharedValue(0);
  const nameInputProgress = useSharedValue(0);
  const ageInputProgress = useSharedValue(0);
  const genderProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);

  // Scale values for gender selection bounce effect
  const boyScale = useSharedValue(1);
  const girlScale = useSharedValue(1);

  // Ready message animation
  const readyMessageProgress = useSharedValue(0);

  const ANIMATION_DURATION = 600;
  const EASING = Easing.out(Easing.cubic);

  useEffect(() => {
    // Staggered entrance animation
    headerProgress.value = withTiming(1, { duration: ANIMATION_DURATION, easing: EASING });
    
    nameInputProgress.value = withDelay(
      250,
      withTiming(1, { duration: ANIMATION_DURATION, easing: EASING })
    );
    
    ageInputProgress.value = withDelay(
      400,
      withTiming(1, { duration: ANIMATION_DURATION, easing: EASING })
    );
    
    genderProgress.value = withDelay(
      550,
      withTiming(1, { duration: ANIMATION_DURATION, easing: EASING })
    );
    
    buttonProgress.value = withDelay(
      750,
      withTiming(1, { duration: 700, easing: EASING })
    );
  }, []);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
    transform: [
      { translateY: interpolate(headerProgress.value, [0, 1], [20, 0]) },
    ],
  }));

  const nameInputStyle = useAnimatedStyle(() => ({
    opacity: nameInputProgress.value,
    transform: [
      { translateY: interpolate(nameInputProgress.value, [0, 1], [15, 0]) },
    ],
  }));

  const ageInputStyle = useAnimatedStyle(() => ({
    opacity: ageInputProgress.value,
    transform: [
      { translateY: interpolate(ageInputProgress.value, [0, 1], [15, 0]) },
    ],
  }));

  const genderStyle = useAnimatedStyle(() => ({
    opacity: genderProgress.value,
    transform: [
      { translateY: interpolate(genderProgress.value, [0, 1], [15, 0]) },
    ],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonProgress.value,
    transform: [
      { scale: interpolate(buttonProgress.value, [0, 1], [0.9, 1]) },
    ],
  }));

  // Gender button bounce animations
  const boyButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boyScale.value }],
  }));

  const girlButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: girlScale.value }],
  }));

  // Ready message animated style (fade + scale + slide)
  const readyMessageStyle = useAnimatedStyle(() => ({
    opacity: readyMessageProgress.value,
    transform: [
      { scale: interpolate(readyMessageProgress.value, [0, 1], [0.8, 1]) },
      { translateY: interpolate(readyMessageProgress.value, [0, 1], [10, 0]) },
    ],
  }));

  const isValid = name.trim().length > 0 && age.length > 0 && gender !== null;

  // Animate ready message when form becomes valid
  useEffect(() => {
    if (isValid) {
      readyMessageProgress.value = withSpring(1, { damping: 12, stiffness: 200 });
    } else {
      readyMessageProgress.value = withTiming(0, { duration: 200 });
    }
  }, [isValid]);

  const handleContinue = () => {
    Keyboard.dismiss();
    if (!isValid || !gender) return;

    if (isEditMode && heroProfile) {
      updateHeroProfile({
        name: name.trim(),
        age: parseInt(age, 10),
        gender,
      });
      router.back();
      return;
    }

    setHeroProfile({
      id: `hero-${Date.now()}`,
      name: name.trim(),
      age: parseInt(age, 10),
      gender,
      avatarId: '',
    });

    router.push('/onboarding/avatar-select');

  };

  const handleAgeChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setAge(numericValue);
  };

  const handleGenderSelect = (selected: Gender) => {
    Keyboard.dismiss();
    
    // Bounce animation on the selected button
    const targetScale = selected === 'boy' ? boyScale : girlScale;
    targetScale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1.05, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    
    setGender(selected);
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          keyboardDismissMode="on-drag"
        >
          <Pressable onPress={Keyboard.dismiss} style={styles.content}>
            {/* Header with icon */}
            <Animated.View style={[styles.header, headerStyle]}>
              {isNewUser && (
                <View style={styles.stepIndicator}>
                  <Text style={styles.stepText}>Étape 1</Text>
                  <View style={styles.stepDots}>
                    <View style={[styles.stepDot, styles.stepDotActive]} />
                    <View style={styles.stepDot} />
                    <View style={styles.stepDot} />
                  </View>
                </View>
              )}
              <Text style={styles.headerIcon}>🦸</Text>
              <Text style={styles.title}>Dis-moi qui tu es !</Text>
              <Text style={styles.subtitle}>
                Chaque héros a besoin d'un nom...
              </Text>
            </Animated.View>

            {/* Name input */}
            <Animated.View style={[styles.inputGroup, nameInputStyle]}>
              <Text style={styles.label}>Ton prénom de héros</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ecris ton prénom ici"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="words"
                maxLength={20}
                returnKeyType="next"
                onSubmitEditing={() => ageInputRef.current?.focus()}
              />
            </Animated.View>

            {/* Age input */}
            <Animated.View style={[styles.inputGroup, ageInputStyle]}>
              <Text style={styles.label}>Tu as quel âge ?</Text>
              <TextInput
                ref={ageInputRef}
                style={styles.input}
                value={age}
                onChangeText={handleAgeChange}
                placeholder="Ton âge"
                placeholderTextColor={colors.text.muted}
                keyboardType="number-pad"
                maxLength={3}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </Animated.View>

            {/* Gender selection */}
            <Animated.View style={[styles.inputGroup, genderStyle]}>
              <Text style={styles.label}>Tu es plutôt...</Text>
              <View style={styles.genderContainer}>
                <Animated.View style={[styles.genderButtonWrapper, boyButtonStyle]}>
                  <Pressable
                    style={[
                      styles.genderButton,
                      gender === 'boy' && styles.genderButtonSelected,
                    ]}
                    onPress={() => handleGenderSelect('boy')}
                  >
                    <Text style={styles.genderIcon}>👦</Text>
                    <Text
                      style={[
                        styles.genderText,
                        gender === 'boy' && styles.genderTextSelected,
                      ]}
                    >
                      Un garcon
                    </Text>
                  </Pressable>
                </Animated.View>

                <Animated.View style={[styles.genderButtonWrapper, girlButtonStyle]}>
                  <Pressable
                    style={[
                      styles.genderButton,
                      gender === 'girl' && styles.genderButtonSelected,
                    ]}
                    onPress={() => handleGenderSelect('girl')}
                  >
                    <Text style={styles.genderIcon}>👧</Text>
                    <Text
                      style={[
                        styles.genderText,
                        gender === 'girl' && styles.genderTextSelected,
                      ]}
                    >
                      Une fille
                    </Text>
                  </Pressable>
                </Animated.View>
              </View>
            </Animated.View>
          </Pressable>
        </ScrollView>

        {/* Bouton C'est moi - sticky en bas, ne bouge pas avec le clavier */}
        <Animated.View style={[styles.footer, buttonStyle]}>
          {/* Feedback message when form is complete - animated */}
          <Animated.Text style={[styles.readyMessage, readyMessageStyle]}>
            Parfait ! Ton héros est prêt
          </Animated.Text>
          <AnimatedPressable
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!isValid}
          >
            <Text style={[styles.buttonText, !isValid && styles.buttonTextDisabled]}>
              {isEditMode ? 'Sauvegarder' : "C'est moi !"}
            </Text>
          </AnimatedPressable>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  main: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    // Room for sticky footer: 48 + 48 + 32 + 32
    paddingBottom:
      spacing.xxxl + spacing.xxxl + spacing.xxl + spacing.xxl,
  },
  content: {
    flex: 1,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },

  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  stepText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepDots: {
    flexDirection: 'row',
    gap: spacing.xs + spacing.xxs,
  },
  stepDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.xs,
    backgroundColor: colors.borderMedium,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: spacing.lg + spacing.xs,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  headerIcon: {
    fontSize: spacing.xxxl,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.lg,
    color: colors.text.muted,
    textAlign: 'center',
  },

  // Input groups
  inputGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg + spacing.xxs,
    paddingVertical: spacing.lg,
    fontSize: typography.size.lg,
    color: colors.text.secondary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  inputHint: {
    fontSize: typography.size.md,
    color: colors.text.muted,
    marginTop: spacing.xs + spacing.xxs,
    marginLeft: spacing.xs,
  },

  // Gender selection
  genderContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  genderButtonWrapper: {
    flex: 1,
  },
  genderButton: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg + spacing.xs,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  genderButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.semantic.warningBg,
  },
  genderIcon: {
    fontSize: typography.size.display + spacing.sm,
    marginBottom: spacing.sm,
  },
  genderText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.muted,
  },
  genderTextSelected: {
    color: colors.primary,
  },

  // Footer & Button - sticky en bas, position fixe
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + spacing.sm,
    backgroundColor: colors.background,
  },
  readyMessage: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md + spacing.xxs,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg + spacing.xxs,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.md,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
  },
  buttonDisabled: {
    backgroundColor: colors.borderMedium,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    color: colors.text.muted,
  },
});
