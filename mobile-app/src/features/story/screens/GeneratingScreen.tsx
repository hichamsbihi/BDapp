import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/shared';

/**
 * Image generation screen - mock loading screen
 * In production, this would call the AI image generation API
 */
export const GeneratingScreen: React.FC = () => {
  const { startId } = useLocalSearchParams<{ startId: string }>();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Preparation de la magie...');

  // Animated value for pulsing effect
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Status messages to cycle through
  const statusMessages = [
    'Preparation de la magie...',
    'Les couleurs se melangent...',
    'Les personnages prennent vie...',
    'Ajout des details magiques...',
    'Presque termine...',
  ];

  useEffect(() => {
    // Pulsing animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Progress simulation (mock)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 15;
        return Math.min(newProgress, 100);
      });
    }, 500);

    // Status text updates
    const statusInterval = setInterval(() => {
      setStatusText((prev) => {
        const currentIndex = statusMessages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % statusMessages.length;
        return statusMessages[nextIndex];
      });
    }, 1500);

    // Navigate to page screen after "generation" completes
    const timeout = setTimeout(() => {
      router.replace({
        pathname: '/story/page',
        params: { startId },
      });
    }, 4000);

    return () => {
      pulse.stop();
      clearInterval(progressInterval);
      clearInterval(statusInterval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={styles.iconPlaceholder}>
            <Text style={styles.iconText}>*</Text>
          </View>
        </Animated.View>

        <Text style={styles.title}>Creation en cours...</Text>
        <Text style={styles.statusText}>{statusText}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#5856D6',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 60,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 40,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
