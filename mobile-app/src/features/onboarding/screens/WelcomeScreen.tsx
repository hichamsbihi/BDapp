import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ScreenContainer, ComicIllustration, Button } from '@/shared';
import { colors, spacing, typography, radius, shadows } from '@/theme';

const ANIM_DURATION = 700;
const EASE = Easing.out(Easing.cubic);

export const WelcomeScreen: React.FC = () => {
  const illustrationProgress = useSharedValue(0);
  const breathing = useSharedValue(1);
  const titleProgress = useSharedValue(0);
  const subtitleProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);

  useEffect(() => {
    illustrationProgress.value = withTiming(1, { duration: ANIM_DURATION, easing: EASE });
    titleProgress.value = withDelay(400, withTiming(1, { duration: ANIM_DURATION, easing: EASE }));
    subtitleProgress.value = withDelay(650, withTiming(1, { duration: ANIM_DURATION, easing: EASE }));
    buttonProgress.value = withDelay(950, withTiming(1, { duration: 800, easing: EASE }));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      breathing.value = withRepeat(
        withTiming(1.04, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    }, ANIM_DURATION);
    return () => clearTimeout(timeout);
  }, []);

  const illustrationStyle = useAnimatedStyle(() => ({
    opacity: illustrationProgress.value,
    transform: [
      { scale: interpolate(illustrationProgress.value, [0, 1], [0.5, 1]) * breathing.value },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleProgress.value,
    transform: [{ translateY: interpolate(titleProgress.value, [0, 1], [20, 0]) }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleProgress.value,
    transform: [{ translateY: interpolate(subtitleProgress.value, [0, 1], [15, 0]) }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonProgress.value,
    transform: [{ scale: interpolate(buttonProgress.value, [0, 1], [0.9, 1]) }],
  }));

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        {/* Comic panel decoration */}
        <View style={styles.panelDecoration}>
          <View style={styles.panelLine} />
          <View style={[styles.panelLine, styles.panelLineRight]} />
        </View>

        <Animated.View style={[styles.illustrationWrap, illustrationStyle]}>
          <ComicIllustration variant="welcome" size="large" />
        </Animated.View>

        <Animated.View style={[styles.titleBlock, titleStyle]}>
          <Text style={styles.titleSmall}>Bienvenue dans</Text>
          <View style={styles.titleHighlight}>
            <Text style={styles.titleBig}>Monde d'Histoires</Text>
          </View>
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <View style={styles.speechBubble}>
            <Text style={styles.subtitle}>Ici, tu inventes des histoires</Text>
            <Text style={styles.subtitleBold}>ou TU es le heros !</Text>
            <View style={styles.speechTail} />
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, buttonStyle]}>
        <Button
          title="C'est parti !"
          onPress={() => router.push('/onboarding/hero-info')}
          variant="primary"
          size="large"
        />
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  panelDecoration: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    height: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  panelLine: {
    width: 40,
    height: 3,
    backgroundColor: colors.ink,
    borderRadius: 2,
    opacity: 0.08,
  },
  panelLineRight: {
    width: 28,
  },
  illustrationWrap: {
    marginBottom: spacing.xl,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  titleSmall: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.inkLight,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  titleHighlight: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.ink,
    transform: [{ rotate: '-1deg' }],
  },
  titleBig: {
    ...typography.hero,
    color: colors.ink,
    textAlign: 'center',
  },
  speechBubble: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    position: 'relative',
  },
  speechTail: {
    position: 'absolute',
    bottom: -10,
    left: '45%',
    width: 20,
    height: 20,
    backgroundColor: colors.surfaceAlt,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.ink,
    transform: [{ rotate: '45deg' }],
  },
  subtitle: {
    ...typography.subtitle,
    fontWeight: '400',
    color: colors.inkLight,
    textAlign: 'center',
    lineHeight: 28,
  },
  subtitleBold: {
    ...typography.subtitle,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 28,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
