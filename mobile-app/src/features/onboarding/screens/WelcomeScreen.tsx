import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Image } from 'react-native';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSpring,
  withSequence,
  cancelAnimation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';
import { colors, spacing, typography, radius } from '@/theme/theme';

const { width: SW } = Dimensions.get('window');

// Manga-specific creative colors — intentional overrides, not in theme
const INK = '#1A1A2E';
const GOLD = '#FFD700';
const WARM_BROWN = '#8D7B68';

// --- Pre-computed layout data ---

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  left: (i * 73 + 17) % 90 + 5,
  top: (i * 41 + 11) % 70 + 15,
  size: 6 + (i % 4) * 2.5,
  opacity: 0.2 + (i % 3) * 0.08,
  color: i % 2 === 0 ? colors.primary : colors.accent,
  duration: 2800 + (i % 5) * 400,
}));

const SPEED_LINES = Array.from({ length: 16 }, (_, i) => ({
  deg: (360 / 16) * i,
  opacity: 0.08 + (i % 3) * 0.02,
  length: 80 + (i % 3) * 30,
}));

const RING_R = 105;
const RING_DOTS = Array.from({ length: 8 }, (_, i) => {
  const a = (Math.PI * 2 * i) / 8;
  return { x: Math.cos(a) * RING_R, y: Math.sin(a) * RING_R };
});

const SPIKE_ROTATIONS = Array.from({ length: 8 }, (_, i) => (360 / 8) * i);

const CONFETTI_DATA = [
  { color: colors.primary, dx: -55, dy: -75 },
  { color: colors.accent, dx: 50, dy: -85 },
  { color: colors.secondary, dx: -35, dy: -55 },
  { color: GOLD, dx: 65, dy: -65 },
  { color: colors.primary, dx: -25, dy: -95 },
  { color: colors.accent, dx: 40, dy: -45 },
];

// --- Animated sub-components ---

function FloatingParticle({
  data,
  startDelay,
}: {
  data: (typeof PARTICLES)[0];
  startDelay: number;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(startDelay, withTiming(data.opacity, { duration: 600 }));
    translateY.value = withDelay(
      startDelay,
      withRepeat(
        withTiming(-20, { duration: data.duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${data.left}%`,
          top: `${data.top}%`,
          width: data.size,
          height: data.size,
          borderRadius: data.size / 2,
          backgroundColor: data.color,
        },
        style,
      ]}
    />
  );
}

function ConfettiPiece({
  color,
  dx,
  dy,
  trigger,
}: {
  color: string;
  dx: number;
  dy: number;
  trigger: number;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    translateX.value = 0;
    translateY.value = 0;
    opacity.value = 1;
    scale.value = 1;
    translateX.value = withTiming(dx, { duration: 500, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(dy, { duration: 500, easing: Easing.out(Easing.cubic) });
    opacity.value = withDelay(250, withTiming(0, { duration: 250 }));
    scale.value = withSequence(
      withSpring(1.3, { damping: 8 }),
      withTiming(0.4, { duration: 300 }),
    );
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: spacing.sm,
          height: spacing.sm,
          borderRadius: spacing.xs,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// 🔧 FIX — High-quality image wrapper
// Problem: React Native degrades image rendering quality during Animated
//          transforms (scale, spring, translateY). The GPU rasterises the
//          image at its CURRENT (smaller/zoomed) size and then upscales it,
//          producing a blurry result.
// Solution:
//   1. Wrap the Image in a plain View that is NOT animated — the View acts as
//      a stable raster layer for the image.
//   2. Apply all Animated transforms to the OUTER wrapper View only.
//   3. Set `renderToHardwareTextureAndroid` + `shouldRasterizeIOS` on the
//      stable inner View so the image is rasterised once at full resolution
//      and then composited by the GPU during animation — sharp at all scales.
// ---------------------------------------------------------------------------
const HeroImage: React.FC<{ animatedStyle: object }> = ({ animatedStyle }) => (
  <Animated.View style={[styles.mainCircle, animatedStyle]}>
    {/*
      ✅ KEY FIX:
      - renderToHardwareTextureAndroid: tells Android to rasterise this
        subtree once into a GPU texture — keeps full resolution during parent
        transform animations.
      - shouldRasterizeIOS: same concept for iOS — rasterises to an offscreen
        bitmap at full size, then composites during animation.
      Do NOT put these on the Animated.View that has the transform — put them
      on the inner stable View that holds the actual Image.
    */}
    <View
      style={styles.imageWrapper}
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
    >
      <Image
        source={require('@/assets/images/welcome-icon.png')}
        style={styles.heroImage}
        resizeMode="cover"
        // ✅ fadeDuration=0 prevents the initial fade-in blur on Android
        fadeDuration={0}
      />
    </View>
  </Animated.View>
);

// --- Main Screen ---

/**
 * Welcome screen — first screen of onboarding.
 * Data (name, gender, avatar) is stored in localStorage only; no Supabase account yet.
 * If user already completed onboarding (returning without account), skip to (tabs).
 */
export const WelcomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const isFocused = useIsFocused();
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // ✅ FIX #4 — nav timeout ref so it can be cleaned up on unmount
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hasCompletedOnboarding && isFocused) {
      router.replace('/(tabs)');
    }
  }, [hasCompletedOnboarding, isFocused]);

  // --- Shared values ---
  const bgOpacity = useSharedValue(0);
  const speedLinesOpacity = useSharedValue(0);
  const speedLinesRotation = useSharedValue(0);
  const portalY = useSharedValue(-150);
  const circleScale = useSharedValue(0);
  const ringRotation = useSharedValue(0);
  const spikesPulse = useSharedValue(1);
  const emojiScale = useSharedValue(1);
  const welcomeX = useSharedValue(-40);
  const welcomeOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.3);
  const titleOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const buttonEntryScale = useSharedValue(0);
  const shimmerX = useSharedValue(-SW);
  const buttonPressY = useSharedValue(0);
  const buttonPressScale = useSharedValue(1);
  const linkScale = useSharedValue(1);

  // --- Entrance sequence ---
  useEffect(() => {
    const EASE = Easing.out(Easing.cubic);

    bgOpacity.value = withTiming(1, { duration: 400, easing: EASE });
    speedLinesOpacity.value = withDelay(100, withTiming(1, { duration: 500, easing: EASE }));
    portalY.value = withDelay(400, withSpring(0, { damping: 8, stiffness: 100 }));
    circleScale.value = withDelay(600, withSpring(1, { damping: 6, stiffness: 120 }));
    welcomeOpacity.value = withDelay(900, withTiming(1, { duration: 300, easing: EASE }));
    welcomeX.value = withDelay(900, withTiming(0, { duration: 400, easing: EASE }));
    titleOpacity.value = withDelay(1000, withTiming(1, { duration: 200 }));
    titleScale.value = withDelay(
      1000,
      withSequence(
        withSpring(1.05, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 12 }),
      ),
    );
    subtitleOpacity.value = withDelay(1200, withTiming(1, { duration: 350, easing: EASE }));
    subtitleY.value = withDelay(1200, withSpring(0, { damping: 14 }));
    badgeScale.value = withDelay(
      1300,
      withSequence(
        withSpring(1.1, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 12 }),
      ),
    );
    buttonEntryScale.value = withDelay(
      1500,
      withSequence(
        withSpring(1.08, { damping: 6, stiffness: 160 }),
        withSpring(1, { damping: 10 }),
      ),
    );

    const loopTimer = setTimeout(() => {
      ringRotation.value = withRepeat(
        withTiming(360, { duration: 6000, easing: Easing.linear }),
        -1,
        false,
      );
      speedLinesRotation.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false,
      );
      spikesPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.9, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
      emojiScale.value = withRepeat(
        withTiming(1.12, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
      shimmerX.value = withRepeat(
        withTiming(SW, { duration: 2500, easing: Easing.inOut(Easing.cubic) }),
        -1,
        false,
      );
    }, 1800);

    // ✅ FIX #1 — cancel ALL looping animations on unmount to prevent memory leaks
    return () => {
      clearTimeout(loopTimer);
      cancelAnimation(ringRotation);
      cancelAnimation(speedLinesRotation);
      cancelAnimation(spikesPulse);
      cancelAnimation(emojiScale);
      cancelAnimation(shimmerX);
      cancelAnimation(bgOpacity);
      cancelAnimation(speedLinesOpacity);
      cancelAnimation(portalY);
      cancelAnimation(circleScale);
      cancelAnimation(welcomeOpacity);
      cancelAnimation(welcomeX);
      cancelAnimation(titleOpacity);
      cancelAnimation(titleScale);
      cancelAnimation(subtitleOpacity);
      cancelAnimation(subtitleY);
      cancelAnimation(badgeScale);
      cancelAnimation(buttonEntryScale);
    };
  }, []);

  // ✅ FIX #4 — clean up nav timer on unmount
  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  // --- Animated styles ---

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));

  const speedLinesStyle = useAnimatedStyle(() => ({
    opacity: speedLinesOpacity.value,
    transform: [{ rotate: `${speedLinesRotation.value}deg` }],
  }));

  const portalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: portalY.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  const spikesStyle = useAnimatedStyle(() => ({
    transform: [{ scale: spikesPulse.value }],
  }));

  const circleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  const welcomeStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
    transform: [{ translateX: welcomeX.value }],
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const subtitleAnimStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleY.value }],
  }));

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: buttonEntryScale.value * buttonPressScale.value },
      { translateY: buttonPressY.value },
    ],
  }));

  const linkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: linkScale.value }],
  }));

  // --- Handlers ---

  // ✅ FIX #4 — nav timer stored in ref so it can be cancelled on unmount
  const handleStart = () => {
    setConfettiTrigger((t) => t + 1);
    navTimerRef.current = setTimeout(
      () => router.push('/onboarding/hero-info'),
      600,
    );
  };

  const handleAlreadyHaveAccount = () => {
    router.push('/(auth)/login?from=onboarding&mode=signin');
  };

  return (
    <ScreenContainer style={styles.container}>
      {/* ====== BACKGROUND LAYERS ====== */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <LinearGradient
          colors={[colors.background, colors.surface, colors.background]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.glowContainer}>
          <LinearGradient
            colors={['rgba(255,138,101,0.15)', 'transparent']}
            style={styles.glowCircle}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
        <Animated.View style={[styles.speedLinesContainer, speedLinesStyle]}>
          {SPEED_LINES.map((line, i) => (
            <View
              key={i}
              style={[
                styles.speedLine,
                {
                  opacity: line.opacity,
                  height: line.length,
                  transform: [
                    { rotate: `${line.deg}deg` },
                    { translateY: -(line.length / 2 + spacing.xxl) },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>
        {PARTICLES.map((p, i) => (
          <FloatingParticle key={i} data={p} startDelay={200 + i * 150} />
        ))}
      </Animated.View>

      {/* ====== CONTENT ====== */}
      <View style={[styles.content, { paddingTop: insets.top + spacing.xxl }]}>

        {/* --- HERO PORTAL --- */}
        <Animated.View style={[styles.portalContainer, portalStyle]}>

          {/* Layer 1: Rotating outer ring */}
          <Animated.View style={[styles.ringContainer, ringStyle]}>
            {RING_DOTS.map((dot, i) => (
              <View
                key={i}
                style={[
                  styles.ringDot,
                  { transform: [{ translateX: dot.x }, { translateY: dot.y }] },
                ]}
              />
            ))}
          </Animated.View>

          {/* Layer 2: Manga burst spikes */}
          <Animated.View style={[styles.spikesContainer, spikesStyle]}>
            {SPIKE_ROTATIONS.map((rot, i) => (
              <View
                key={i}
                style={[
                  styles.spike,
                  { transform: [{ rotate: `${rot}deg` }, { translateY: -55 }] },
                ]}
              />
            ))}
          </Animated.View>

          {/* ✅ Layer 3: Main circle — image with hardware rasterisation fix */}
          <HeroImage animatedStyle={circleAnimStyle} />

          {/* Layer 4: Lottie stars overlay */}
          <LottieView
            source={require('@/assets/animations/stars-burst.json')}
            autoPlay
            loop
            speed={0.6}
            style={styles.lottieOverlay}
          />
        </Animated.View>

        {/* --- TYPOGRAPHY --- */}
        <View style={styles.titleBlock}>
          <Animated.Text style={[styles.welcomeLabel, welcomeStyle]}>
            BIENVENUE DANS
          </Animated.Text>

          <Animated.View style={[styles.titleContainer, titleAnimStyle]}>
            <Text style={styles.titleBig}>Monde d'Histoires</Text>
            {/* ✅ FIX #2 — shimmerClip needs explicit width to show shimmer */}
            <View style={styles.shimmerClip}>
              <Animated.View style={[styles.shimmerGradient, shimmerStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.35)', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
          </Animated.View>

          <Animated.View style={subtitleAnimStyle}>
            <Text style={styles.subtitleText}>Ici, tu inventes des histoires</Text>
          </Animated.View>

          <Animated.View style={[styles.heroBadge, badgeAnimStyle]}>
            <Text style={styles.heroBadgeText}>ou TU es le héros !</Text>
          </Animated.View>
        </View>
      </View>

      {/* ====== FOOTER ====== */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Animated.View style={[styles.buttonOuter, buttonAnimStyle]}>
          <View style={styles.buttonShadow} />
          <Pressable
            style={styles.button}
            onPress={handleStart}
            onPressIn={() => {
              buttonPressY.value = withTiming(4, { duration: 80 });
              buttonPressScale.value = withSpring(0.97, { damping: 15 });
            }}
            onPressOut={() => {
              buttonPressY.value = withSpring(0, { damping: 12, stiffness: 200 });
              buttonPressScale.value = withSpring(1, { damping: 12 });
            }}
          >
            <Text style={styles.buttonText}>✦ C'est parti ✦</Text>
          </Pressable>
          {/* ✅ FIX #3 — confettiAnchor no longer uses percentage bottom */}
          <View style={styles.confettiAnchor}>
            {CONFETTI_DATA.map((c, i) => (
              <ConfettiPiece
                key={`${i}-${confettiTrigger}`}
                color={c.color}
                dx={c.dx}
                dy={c.dy}
                trigger={confettiTrigger}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View style={linkAnimStyle}>
          <Pressable
            style={styles.linkButton}
            onPressIn={() => {
              linkScale.value = withSpring(0.95, { damping: 15 });
            }}
            onPressOut={() => {
              linkScale.value = withSpring(1, { damping: 12 });
            }}
            onPress={handleAlreadyHaveAccount}
          >
            <Text style={styles.linkButtonText}>J'ai déjà un compte</Text>
          </Pressable>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
};

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },

  // Background
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    width: SW * 1.5,
    height: SW * 1.5,
    borderRadius: SW * 0.75,
  },
  speedLinesContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.xs,
  },

  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },

  // Portal
  portalContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  ringContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GOLD,
  },
  spikesContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spike: {
    position: 'absolute',
    width: 14,
    height: 50,
    backgroundColor: GOLD,
    borderRadius: 3,
    opacity: 0.7,
  },

  // ✅ FIX — mainCircle is now on Animated.View (transform target)
  //          imageWrapper is the stable rasterised layer inside it
  mainCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',            // clips imageWrapper to circle shape
    borderWidth: 4,
    borderColor: INK,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  imageWrapper: {
    // ✅ Slightly oversized so the image fills the circle with no gaps
    // (matches the 115% trick from AvatarCard)
    width: 180 * 1.15,
    height: 180 * 1.15,
    // renderToHardwareTextureAndroid + shouldRasterizeIOS are set as props
    // on the View component in JSX — not as style properties
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  lottieOverlay: {
    position: 'absolute',
    width: 280,
    height: 280,
  },

  // Typography
  titleBlock: {
    alignItems: 'center',
    transform: [{ rotate: '-1deg' }],
  },
  welcomeLabel: {
    fontSize: 15,
    fontWeight: typography.weight.medium,
    color: WARM_BROWN,
    letterSpacing: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  titleContainer: {
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  titleBig: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    textShadowColor: INK,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  // ✅ FIX #2 — explicit width so shimmer gradient is visible
  shimmerClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: radius.sm,
    width: '100%',
  },
  shimmerGradient: {
    width: 80,
    height: '100%',
  },
  subtitleText: {
    fontSize: 18,
    fontWeight: typography.weight.regular,
    color: WARM_BROWN,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  heroBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: INK,
    transform: [{ rotate: '1.5deg' }],
  },
  heroBadgeText: {
    color: colors.text.inverse,
    fontWeight: '800',
    fontSize: 19,
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  buttonOuter: {
    alignSelf: 'stretch',
  },
  buttonShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: INK,
    borderRadius: 18,
  },
  button: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 18,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.inverse,
    letterSpacing: 1,
  },
  // ✅ FIX #3 — no more percentage string for bottom
  confettiAnchor: {
    position: 'absolute',
    alignSelf: 'center',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  linkButton: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 44,
    justifyContent: 'center',
  },
  linkButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: WARM_BROWN,
    textAlign: 'center',
  },
});
