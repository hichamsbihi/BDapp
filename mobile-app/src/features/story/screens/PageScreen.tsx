import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';
import { generateMockPageImage, getChoicesForPage } from '@/data';
import { generatePageId } from '@/data/mockStories';
import { StoryPage, NarrativeChoice } from '@/types';

const TOTAL_PAGES = 5;

// Pivot phrases that vary by page — keeps the experience fresh
const PIVOT_PHRASES = [
  'Et maintenant...',
  'Et ensuite...',
  'La suite commence ici...',
  'Que va-t-il se passer ?',
];

/**
 * PageScreen
 * 
 * An illustrated book page. Simple, calm, natural.
 * 
 * - The image is the hero, always visible at the top
 * - The child scrolls to reveal the caption and choices
 * - No timers, no phases — just a page to explore
 */
export const PageScreen: React.FC = () => {
  const { height: windowHeight } = useWindowDimensions();
  const { paragraphText } = useLocalSearchParams<{ paragraphText: string }>();
  
  const [selectedChoice, setSelectedChoice] = useState<NarrativeChoice | null>(null);

  const currentStory = useAppStore((state) => state.currentStory);
  const updateCurrentStory = useAppStore((state) => state.updateCurrentStory);
  const addStory = useAppStore((state) => state.addStory);
  const clearCurrentStory = useAppStore((state) => state.clearCurrentStory);

  const currentPageNumber = (currentStory?.pages?.length || 0) + 1;
  const isLastPage = currentPageNumber >= TOTAL_PAGES;

  // Get narrative choices
  const choices = currentStory?.universeId
    ? getChoicesForPage(currentStory.universeId, currentPageNumber)
    : [];

  // Generate mock image
  const imageUrl = currentStory?.universeId
    ? generateMockPageImage(currentPageNumber, currentStory.universeId)
    : 'https://picsum.photos/seed/default/400/300';

  // Image takes ~65% of screen height
  const imageHeight = windowHeight * 0.65;

  // Single animation: image fade-in on mount
  const imageOpacity = useSharedValue(0);

  useEffect(() => {
    imageOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.quad),
    });
  }, []);

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const handleChoiceSelect = (choice: NarrativeChoice) => {
    setSelectedChoice(choice);
  };

  const handleContinue = () => {
    if (!currentStory) return;

    const newPage: StoryPage = {
      id: generatePageId(),
      paragraphText: paragraphText || '',
      imageUrl,
      pageNumber: currentPageNumber,
      choiceId: selectedChoice?.id,
    };

    const updatedPages = [...(currentStory.pages || []), newPage];

    if (isLastPage) {
      // Story complete — save and celebrate
      const completedStory = {
        ...currentStory,
        pages: updatedPages,
        updatedAt: new Date(),
        isComplete: true,
      } as any;

      addStory(completedStory);
      clearCurrentStory();

      // Navigate to celebration screen
      router.replace({
        pathname: '/story/completed',
        params: { storyId: completedStory.id },
      });
    } else {
      // Continue to next paragraph
      updateCurrentStory({
        pages: updatedPages,
        selectedChoiceId: selectedChoice?.id,
      });

      router.replace('/story/paragraph');
    }
  };

  const showCTA = selectedChoice !== null || isLastPage;

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* The illustrated scene — the heart of the page */}
        <Animated.View style={[styles.imageWrapper, { height: imageHeight }, imageStyle]}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Caption — revealed by scroll */}
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>{paragraphText}</Text>
        </View>

        {/* Choices section — revealed by scroll (not on last page) */}
        {!isLastPage && (
          <View style={styles.choicesSection}>
            <Text style={styles.pivotText}>
              {PIVOT_PHRASES[(currentPageNumber - 1) % PIVOT_PHRASES.length]}
            </Text>

            <View style={styles.choicesContainer}>
              {choices.map((choice) => {
                const isSelected = selectedChoice?.id === choice.id;
                const isDimmed = selectedChoice !== null && !isSelected;

                return (
                  <Pressable
                    key={choice.id}
                    style={[
                      styles.choiceCard,
                      isSelected && styles.choiceCardSelected,
                      isDimmed && styles.choiceCardDimmed,
                    ]}
                    onPress={() => handleChoiceSelect(choice)}
                  >
                    <Text style={[styles.choiceText, isSelected && styles.choiceTextSelected]}>
                      {choice.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Last page ending */}
        {isLastPage && (
          <View style={styles.endSection}>
            <Text style={styles.endTitle}>Fin de l'histoire</Text>
            <Text style={styles.endText}>
              Bravo ! Tu as cree une histoire merveilleuse.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* CTA — appears after selection */}
      {showCTA && (
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>
              {isLastPage ? 'Terminer l\'histoire' : 'Continuer l\'histoire'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFCF5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Image — the hero of the page
  imageWrapper: {
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5EBE0',
  },

  // Caption — discrete legend
  captionContainer: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 16,
  },
  captionText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#6B5E50',
    lineHeight: 24,
    textAlign: 'center',
  },

  // Choices section
  choicesSection: {
    paddingHorizontal: 28,
    paddingTop: 8,
  },
  pivotText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#9A8B7A',
    textAlign: 'center',
    marginBottom: 20,
  },
  choicesContainer: {
    gap: 14,
  },
  choiceCard: {
    backgroundColor: '#FFFCF5',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
  },
  choiceCardSelected: {
    borderColor: '#FF8A65',
    borderWidth: 2,
    backgroundColor: '#FFFAF6',
  },
  choiceCardDimmed: {
    opacity: 0.4,
  },
  choiceText: {
    fontSize: 15,
    color: '#5D4E37',
    lineHeight: 24,
    textAlign: 'center',
  },
  choiceTextSelected: {
    color: '#4A3F32',
  },

  // End section
  endSection: {
    paddingHorizontal: 28,
    paddingTop: 16,
    alignItems: 'center',
  },
  endTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5D4E37',
    marginBottom: 10,
  },
  endText: {
    fontSize: 15,
    color: '#8D7B68',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    backgroundColor: '#FFFCF5',
  },
  button: {
    backgroundColor: '#FF8A65',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
