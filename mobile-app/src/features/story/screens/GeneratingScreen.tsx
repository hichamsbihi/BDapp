import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  withSpring,
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/shared';
import { colors, spacing, radius, typography, shadows } from '@/theme/theme';
import {
  getCreationPhraseByProgress,
  CREATION_PHRASES,
  getRandomPhrase,
} from '@/constants/magicWords';

/**
 * Magical Brush Stroke Component
 * Simulates a brush stroke being drawn on the canvas
 */
interface BrushStrokeProps {
  delay: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  thickness: number;
  duration: number;
}

const BrushStroke: React.FC<BrushStrokeProps> = ({
  delay,
  startX,
  startY,
  endX,
  endY,
  color,
  thickness,
  duration,
}) => {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.8, { duration: 200 }));
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const strokeStyle = useAnimatedStyle(() => {
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const length = Math.sqrt(width * width + height * height);
    const angle = Math.atan2(endY - startY, endX - startX);

    return {
      position: 'absolute',
      left: startX,
      top: startY,
      width: interpolate(progress.value, [0, 1], [0, length]),
      height: thickness,
      backgroundColor: color,
      borderRadius: thickness / 2,
      opacity: opacity.value,
      transform: [{ rotate: `${angle}rad` }],
      transformOrigin: 'left center',
    };
  });

  return <Animated.View style={strokeStyle} />;
};

/**
 * Sparkle Component - magical particle effect
 */
interface SparkleProps {
  x: number;
  y: number;
  delay: number;
  size: number;
  color: string;
}

const Sparkle: React.FC<SparkleProps> = ({ x, y, delay, size, color }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.2, { damping: 8 }),
        withTiming(0, { duration: 800 })
      )
    );
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(400, withTiming(0, { duration: 400 }))
      )
    );
    rotation.value = withDelay(
      delay,
      withTiming(180, { duration: 1000, easing: Easing.linear })
    );
  }, []);

  const sparkleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x - size / 2,
    top: y - size / 2,
    width: size,
    height: size,
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={sparkleStyle}>
      <View style={[styles.sparkleInner, { backgroundColor: color }]} />
    </Animated.View>
  );
};

/**
 * Magic Canvas - the main visual element
 * Shows an evolving, painted canvas effect
 */
const MagicCanvas: React.FC<{ canvasSize: number }> = ({ canvasSize }) => {
  const [strokes, setStrokes] = useState<BrushStrokeProps[]>([]);
  const [sparkles, setSparkles] = useState<SparkleProps[]>([]);
  
  const canvasOpacity = useSharedValue(0);
  const canvasScale = useSharedValue(0.9);
  const glowIntensity = useSharedValue(0);

  const magicPalette = [
    '#FFB366',
    '#FF8A65',
    '#A78BFA',
    '#6EE7B7',
    '#FCD34D',
    '#FDA4AF',
  ];

  useEffect(() => {
    // Canvas entrance animation
    canvasOpacity.value = withTiming(1, { duration: 600 });
    canvasScale.value = withSpring(1, { damping: 15 });
    glowIntensity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Generate brush strokes over time
    const generateStrokes = () => {
      const newStrokes: BrushStrokeProps[] = [];
      const strokeCount = 8;
      
      for (let i = 0; i < strokeCount; i++) {
        const inset = spacing.xl - spacing.xs;
        const margin = spacing.xxl + spacing.sm;
        const startX = Math.random() * (canvasSize - margin) + inset;
        const startY = Math.random() * (canvasSize - margin) + inset;
        const length = spacing.xxxl + spacing.md + Math.random() * (spacing.xxxl + spacing.xxl);
        const angle = Math.random() * Math.PI * 2;
        
        newStrokes.push({
          delay: i * 400 + Math.random() * 200,
          startX,
          startY,
          endX: startX + Math.cos(angle) * length,
          endY: startY + Math.sin(angle) * length,
          color: magicPalette[Math.floor(Math.random() * magicPalette.length)],
          thickness: spacing.sm + Math.random() * spacing.md,
          duration: 600 + Math.random() * 400,
        });
      }
      setStrokes(newStrokes);
    };

    // Generate sparkles
    const generateSparkles = () => {
      const sparkleInterval = setInterval(() => {
        const newSparkle: SparkleProps = {
          x: Math.random() * canvasSize,
          y: Math.random() * canvasSize,
          delay: 0,
          size: spacing.sm + Math.random() * spacing.md,
          color: magicPalette[Math.floor(Math.random() * magicPalette.length)],
        };
        setSparkles(prev => [...prev.slice(-15), newSparkle]);
      }, 300);

      return sparkleInterval;
    };

    generateStrokes();
    const sparkleInterval = generateSparkles();

    // Refresh strokes periodically for continuous effect
    const strokeInterval = setInterval(() => {
      generateStrokes();
    }, 4000);

    return () => {
      clearInterval(sparkleInterval);
      clearInterval(strokeInterval);
    };
  }, [canvasSize]);

  const canvasStyle = useAnimatedStyle(() => ({
    opacity: canvasOpacity.value,
    transform: [{ scale: canvasScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowIntensity.value, [0.5, 1], [0.2, 0.5]),
    transform: [{ scale: interpolate(glowIntensity.value, [0.5, 1], [1, 1.05]) }],
  }));

  return (
    <Animated.View style={[styles.canvasContainer, canvasStyle]}>
      {/* Glow effect behind canvas */}
      <Animated.View
        style={[
          styles.canvasGlow,
          {
            width: canvasSize + spacing.xxl + spacing.sm,
            height: canvasSize + spacing.xxl + spacing.sm,
          },
          glowStyle,
        ]}
      />
      
      {/* Main canvas */}
      <View style={[styles.canvas, { width: canvasSize, height: canvasSize }]}>
        {/* Background texture - subtle paper-like effect */}
        <View style={styles.canvasTexture} />
        
        {/* Brush strokes */}
        {strokes.map((stroke, index) => (
          <BrushStroke key={`stroke-${index}`} {...stroke} />
        ))}
        
        {/* Sparkles */}
        {sparkles.map((sparkle, index) => (
          <Sparkle key={`sparkle-${index}-${sparkle.x}-${sparkle.y}`} {...sparkle} />
        ))}
      </View>
    </Animated.View>
  );
};

/**
 * GeneratingScreen
 * 
 * A spectacular waiting experience for image generation.
 * The child sees visible creation happening - not a loading spinner.
 * 
 * Design philosophy:
 * - Show an active "painting" process
 * - Use poetic, varied phrases
 * - No mechanical progress indicators
 * - Build anticipation and wonder
 */
export const GeneratingScreen: React.FC = () => {
  const { paragraphText } = useLocalSearchParams<{ paragraphText: string }>();
  const { width: windowWidth } = useWindowDimensions();
  
  const [statusText, setStatusText] = useState(
    getRandomPhrase(CREATION_PHRASES.waiting, 'generation_init')
  );

  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const statusOpacity = useSharedValue(0);

  const canvasSize = Math.min(
    windowWidth - spacing.xxl * 2,
    spacing.xxxl * 5 + spacing.xxl + spacing.sm
  );

  useEffect(() => {
    // Title entrance animation
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    titleY.value = withDelay(200, withSpring(0, { damping: 15 }));
    statusOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));

    // Rotate status messages - uses magic words system
    let progress = 0;
    const statusInterval = setInterval(() => {
      progress = Math.min(progress + 15 + Math.random() * 10, 100);
      const newPhrase = getCreationPhraseByProgress(progress);
      setStatusText(newPhrase);
    }, 1800);

    // Navigate to page screen after generation
    const timeout = setTimeout(() => {
      router.replace({
        pathname: '/story/page',
        params: { paragraphText },
      });
    }, 5000);

    return () => {
      clearInterval(statusInterval);
      clearTimeout(timeout);
    };
  }, [paragraphText]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const statusStyle = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
  }));

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        {/* The magical canvas - visible creation */}
        <MagicCanvas canvasSize={canvasSize} />

        {/* Title - poetic, not "Loading..." */}
        <Animated.Text style={[styles.title, titleStyle]}>
          Création en cours
        </Animated.Text>

        {/* Dynamic status - rotates through magic words */}
        <Animated.Text style={[styles.statusText, statusStyle]}>
          {statusText}
        </Animated.Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.generatingBackground,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },

  // Canvas styles
  canvasContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl + spacing.sm,
  },
  canvasGlow: {
    position: 'absolute',
    borderRadius: radius.xxl,
    backgroundColor: colors.generatingGlow,
  },
  canvas: {
    borderRadius: radius.xl,
    backgroundColor: colors.background,
    overflow: 'hidden',
    ...shadows.lg,
  },
  canvasTexture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
    opacity: 0.5,
  },

  // Sparkle inner
  sparkleInner: {
    flex: 1,
    borderRadius: radius.xs,
    transform: [{ rotate: '45deg' }],
  },

  // Text styles
  title: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    marginBottom: spacing.md,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: typography.size.lg,
    fontStyle: 'italic',
    color: colors.generatingTextMuted,
    textAlign: 'center',
    lineHeight: typography.size.xxl,
  },
});
