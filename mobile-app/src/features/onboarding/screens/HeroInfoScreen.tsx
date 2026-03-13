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
import { ScreenContainer, StepIndicator, Button } from '@/shared';
import { colors, spacing, typography, radius, shadows } from '@/theme';
import { useAppStore } from '@/store';

type Gender = 'boy' | 'girl';

export const HeroInfoScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);

  const ageInputRef = useRef<TextInput>(null);
  const setHeroProfile = useAppStore((state) => state.setHeroProfile);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const isNewUser = !hasCompletedOnboarding;

  const headerProgress = useSharedValue(0);
  const nameInputProgress = useSharedValue(0);
  const ageInputProgress = useSharedValue(0);
  const genderProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);
  const boyScale = useSharedValue(1);
  const girlScale = useSharedValue(1);
  const readyMessageProgress = useSharedValue(0);

  const ANIMATION_DURATION = 600;
  const EASING = Easing.out(Easing.cubic);

  useEffect(() => {
    headerProgress.value = withTiming(1, { duration: ANIMATION_DURATION, easing: EASING });
    nameInputProgress.value = withDelay(250, withTiming(1, { duration: ANIMATION_DURATION, easing: EASING }));
    ageInputProgress.value = withDelay(400, withTiming(1, { duration: ANIMATION_DURATION, easing: EASING }));
    genderProgress.value = withDelay(550, withTiming(1, { duration: ANIMATION_DURATION, easing: EASING }));
    buttonProgress.value = withDelay(750, withTiming(1, { duration: 700, easing: EASING }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
    transform: [{ translateY: interpolate(headerProgress.value, [0, 1], [20, 0]) }],
  }));

  const nameInputStyle = useAnimatedStyle(() => ({
    opacity: nameInputProgress.value,
    transform: [{ translateY: interpolate(nameInputProgress.value, [0, 1], [15, 0]) }],
  }));

  const ageInputStyle = useAnimatedStyle(() => ({
    opacity: ageInputProgress.value,
    transform: [{ translateY: interpolate(ageInputProgress.value, [0, 1], [15, 0]) }],
  }));

  const genderStyle = useAnimatedStyle(() => ({
    opacity: genderProgress.value,
    transform: [{ translateY: interpolate(genderProgress.value, [0, 1], [15, 0]) }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonProgress.value,
    transform: [{ scale: interpolate(buttonProgress.value, [0, 1], [0.9, 1]) }],
  }));

  const boyButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boyScale.value }],
  }));

  const girlButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: girlScale.value }],
  }));

  const readyMessageStyle = useAnimatedStyle(() => ({
    opacity: readyMessageProgress.value,
    transform: [
      { scale: interpolate(readyMessageProgress.value, [0, 1], [0.8, 1]) },
      { translateY: interpolate(readyMessageProgress.value, [0, 1], [10, 0]) },
    ],
  }));

  const isValid = name.trim().length > 0 && age.length > 0 && gender !== null;

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
    if (numericValue === '' || parseInt(numericValue, 10) <= 12) {
      setAge(numericValue);
    }
  };

  const handleGenderSelect = (selected: Gender) => {
    Keyboard.dismiss();
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
            <Animated.View style={[styles.header, headerStyle]}>
              {isNewUser && (
                <View style={styles.stepIndicatorWrapper}>
                  <StepIndicator currentStep={1} totalSteps={3} />
                </View>
              )}
              <View style={styles.headerIconWrap}>
                <Text style={styles.headerIcon}>🦸</Text>
              </View>
              <Text style={styles.title}>Dis-moi qui tu es !</Text>
              <Text style={styles.subtitle}>
                Chaque heros a besoin d'un nom...
              </Text>
            </Animated.View>

            <Animated.View style={[styles.inputGroup, nameInputStyle]}>
              <Text style={styles.label}>TON PRENOM DE HEROS</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ecris ton prenom ici"
                placeholderTextColor={colors.inkMuted}
                autoCapitalize="words"
                maxLength={20}
                returnKeyType="next"
                onSubmitEditing={() => ageInputRef.current?.focus()}
              />
            </Animated.View>

            <Animated.View style={[styles.inputGroup, ageInputStyle]}>
              <Text style={styles.label}>TU AS QUEL AGE ?</Text>
              <TextInput
                ref={ageInputRef}
                style={styles.input}
                value={age}
                onChangeText={handleAgeChange}
                placeholder="Ton age"
                placeholderTextColor={colors.inkMuted}
                keyboardType="number-pad"
                maxLength={2}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={styles.inputHint}>Entre 6 et 12 ans</Text>
            </Animated.View>

            <Animated.View style={[styles.inputGroup, genderStyle]}>
              <Text style={styles.label}>TU ES PLUTOT...</Text>
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

        <Animated.View style={[styles.footer, buttonStyle]}>
          <Animated.View style={[styles.readyBubble, readyMessageStyle]}>
            <Text style={styles.readyMessage}>Parfait ! Ton heros est pret</Text>
          </Animated.View>
          <Button
            title="C'est moi !"
            onPress={handleContinue}
            disabled={!isValid}
            size="large"
          />
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
    paddingBottom: 160,
  },
  content: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  stepIndicatorWrapper: {
    marginBottom: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: colors.accentLight,
    borderWidth: 2.5,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.comic,
  },
  headerIcon: {
    fontSize: 36,
  },
  title: {
    ...typography.title,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.inkLight,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.ink,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    color: colors.ink,
    borderWidth: 2.5,
    borderColor: colors.ink,
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 6,
    marginLeft: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButtonWrapper: {
    flex: 1,
  },
  genderButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.ink,
    ...shadows.comic,
  },
  genderButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  genderIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.inkLight,
  },
  genderTextSelected: {
    color: colors.accent,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: 40,
    backgroundColor: colors.background,
  },
  readyBubble: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  readyMessage: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
  },
});
