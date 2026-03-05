import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';

/**
 * Image de démonstration pour les nouveaux utilisateurs.
 * En production : utiliser votre plus belle image générée.
 * UNE seule image, spectaculaire, qui montre le résultat.
 */
const HERO_IMAGE = 'https://picsum.photos/seed/magic-story-hero/800/1200';

/**
 * HomeScreen - Version Simplifiée
 * 
 * Philosophie :
 * - L'IMAGE est le produit. Elle doit dominer l'écran.
 * - Fond clair, chaleureux, "papier"
 * - Wording pour enfant : court, concret, imaginatif
 * - Une seule animation : apparition douce
 * - Aucun élément superflu
 * 
 * En 3 secondes, l'enfant comprend :
 * "Avec cette app, mon imagination devient un vrai dessin"
 */
export const HomeScreen: React.FC = () => {
  const { height: windowHeight } = useWindowDimensions();
  const [isReady, setIsReady] = useState(false);

  const heroProfile = useAppStore((state) => state.heroProfile);
  const stories = useAppStore((state) => state.stories);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const rewardStar = useAppStore((state) => state.rewardStar);

  const hasStories = stories.length > 0;

  // Bonus quotidien (1 fois par jour) - délai pour laisser le store se réhydrater
  useEffect(() => {
    if (!hasCompletedOnboarding) return;
    const timer = setTimeout(() => {
      rewardStar('daily_bonus');
    }, 800);
    return () => clearTimeout(timer);
  }, [hasCompletedOnboarding]);
  const heroName = heroProfile?.name || 'toi';

  // Image à afficher : la création de l'utilisateur OU l'image de démo
  const heroImage = useMemo(() => {
    if (hasStories) {
      // Montrer la dernière création de l'utilisateur
      const lastStory = stories[stories.length - 1];
      if (lastStory?.pages?.[0]?.imageUrl) {
        return lastStory.pages[0].imageUrl;
      }
    }
    return HERO_IMAGE;
  }, [hasStories, stories]);

  // Animation unique : apparition douce et lente
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (!hasCompletedOnboarding) {
      router.replace('/onboarding');
      return;
    }

    // Apparition simple, organique
    contentOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
  }, [isReady, hasCompletedOnboarding]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleCreateStory = () => {
    router.push('/story/universe-select');
  };

  const handleViewLibrary = () => {
    router.push('/library');
  };

  // État de chargement
  if (!isReady || !hasCompletedOnboarding) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.loadingContainer} />
      </ScreenContainer>
    );
  }

  // L'image prend la majorité de l'écran
  const imageHeight = windowHeight * 0.58;

  return (
    <ScreenContainer style={styles.container}>
      <Animated.View style={[styles.content, contentStyle]}>
        {/* IMAGE HERO - Le cœur de l'écran (aucun élément par-dessus) */}
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          <Image
            source={{ uri: heroImage }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* ZONE TEXTE + ACTIONS */}
        <View style={styles.bottomSection}>
          <Text style={styles.headline}>
            {hasStories
              ? `${heroName}, prêt pour une nouvelle aventure ?`
              : 'Imagine une histoire.\nRegarde-la prendre vie.'}
          </Text>

          {/* CTA PRINCIPAL */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleCreateStory}
          >
            <Text style={styles.primaryButtonText}>Créer une histoire</Text>
          </Pressable>

          {/* CTA SECONDAIRE - seulement si l'utilisateur a des histoires */}
          {hasStories && (
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
              onPress={handleViewLibrary}
            >
              <Text style={styles.secondaryButtonText}>Mes histoires</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFCF5', // Fond papier, chaleureux
  },
  content: {
    flex: 1,
  },

  // Chargement
  loadingContainer: {
    flex: 1,
  },

  // IMAGE - Le héros de l'écran
  imageContainer: {
    width: '100%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    // Ombre douce pour donner de la profondeur
    shadowColor: '#5D4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5EBE0', // Placeholder couleur papier
  },

  // SECTION BASSE - Texte et actions
  bottomSection: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },

  // Headline - court, pour enfant
  headline: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4A3F32',
    lineHeight: 34,
    textAlign: 'center',
  },

  // CTA Principal
  primaryButton: {
    backgroundColor: '#FF8A65',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF8A65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // CTA Secondaire - discret
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#8D7B68',
  },
});
