import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
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
import { useAppStore } from '@/store';

type Gender = 'boy' | 'girl';

/**
 * Hero info screen - collect hero name, age, and gender
 * Designed as a warm, engaging experience for children (6-10 years)
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
  const setHeroProfile = useAppStore((state) => state.setHeroProfile);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  
  // Show step indicator only for new users
  const isNewUser = !hasCompletedOnboarding;

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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
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
                placeholderTextColor="#C4B8A8"
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
                placeholderTextColor="#C4B8A8"
                keyboardType="number-pad"
                maxLength={2}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={styles.inputHint}>Entre 6 et 12 ans</Text>
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

        {/* Call-to-action button */}
        <Animated.View style={[styles.footer, buttonStyle]}>
          {/* Feedback message when form is complete - animated */}
          <Animated.Text style={[styles.readyMessage, readyMessageStyle]}>
            Parfait ! Ton héros est prêt ✨
          </Animated.Text>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              !isValid && styles.buttonDisabled,
              pressed && isValid && styles.buttonPressed,
            ]}
            onPress={handleContinue}
            disabled={!isValid}
          >
            <Text style={[styles.buttonText, !isValid && styles.buttonTextDisabled]}>
              C'est moi !
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFCF5', // Same warm background as WelcomeScreen
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingTop: 32,
    paddingHorizontal: 24,
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

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5D4E37', // Warm brown (same as WelcomeScreen)
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8D7B68', // Muted warm brown
    textAlign: 'center',
  },

  // Input groups
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D4E37',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFF8F0', // Soft warm white
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    color: '#5D4E37',
    borderWidth: 2,
    borderColor: '#F5EBE0', // Subtle border
  },
  inputHint: {
    fontSize: 13,
    color: '#B8A99A',
    marginTop: 6,
    marginLeft: 4,
  },

  // Gender selection
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButtonWrapper: {
    flex: 1,
  },
  genderButton: {
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F5EBE0',
  },
  genderButtonSelected: {
    borderColor: '#FF8A65', // Coral (same as WelcomeScreen accent)
    backgroundColor: '#FFF3E8',
  },
  genderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8D7B68',
  },
  genderTextSelected: {
    color: '#FF8A65',
  },

  // Footer & Button
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  readyMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8A65', // Coral - same as accent color
    textAlign: 'center',
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#FF8A65', // Coral (same as WelcomeScreen)
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
