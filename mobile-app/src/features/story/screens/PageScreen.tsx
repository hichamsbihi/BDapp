import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';
import { getStoryStartById, generateMockPageImage } from '@/data';
import { generatePageId } from '@/data/mockStories';
import { StoryPage } from '@/types';

const TOTAL_PAGES = 5;

/**
 * Page display screen - shows the BD page with image and text
 * Manages the creation of 5 pages total
 */
export const PageScreen: React.FC = () => {
  const { paragraphText } = useLocalSearchParams<{ paragraphText: string }>();

  const currentStory = useAppStore((state) => state.currentStory);
  const updateCurrentStory = useAppStore((state) => state.updateCurrentStory);
  const addStory = useAppStore((state) => state.addStory);
  const clearCurrentStory = useAppStore((state) => state.clearCurrentStory);

  const currentPageNumber = (currentStory?.pages?.length || 0) + 1;
  const isLastPage = currentPageNumber >= TOTAL_PAGES;

  // Generate mock image for this page
  const imageUrl = currentStory?.universeId
    ? generateMockPageImage(currentPageNumber, currentStory.universeId)
    : 'https://picsum.photos/seed/default/400/300';

  const handleAddPage = () => {
    if (!currentStory) return;

    // Create new page
    const newPage: StoryPage = {
      id: generatePageId(),
      paragraphText: paragraphText || '',
      imageUrl,
      pageNumber: currentPageNumber,
    };

    // Add page to current story
    const updatedPages = [...(currentStory.pages || []), newPage];
    updateCurrentStory({ pages: updatedPages });

    if (isLastPage) {
      // Story complete - save to library
      addStory({
        ...currentStory,
        pages: updatedPages,
        updatedAt: new Date(),
        isComplete: true,
      } as any);

      clearCurrentStory();
      
      // Navigate to library
      router.replace('/(tabs)');
    } else {
      // Continue to next page
      router.replace('/story/paragraph');
    }
  };

  const handleSave = () => {
    if (!currentStory) return;

    // Create current page
    const newPage: StoryPage = {
      id: generatePageId(),
      paragraphText: paragraphText || '',
      imageUrl,
      pageNumber: currentPageNumber,
    };

    // Save story as incomplete
    const updatedPages = [...(currentStory.pages || []), newPage];
    addStory({
      ...currentStory,
      pages: updatedPages,
      updatedAt: new Date(),
      isComplete: false,
    } as any);

    clearCurrentStory();
    router.replace('/(tabs)');
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.chapterLabel}>
            Page {currentPageNumber} / {TOTAL_PAGES}
          </Text>
          <Text style={styles.title}>{currentStory?.title}</Text>
        </View>

        {/* BD Page */}
        <View style={styles.pageContainer}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.paragraphText}>{paragraphText}</Text>
          </View>
        </View>

        {/* Success message */}
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>
            {isLastPage ? 'Histoire terminee !' : 'Bravo !'}
          </Text>
          <Text style={styles.successText}>
            {isLastPage
              ? 'Ton histoire est complete ! Elle est maintenant dans ta bibliotheque.'
              : `Ta page ${currentPageNumber} est creee ! Continue pour creer la suite.`}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!isLastPage && (
          <Button
            title="Sauvegarder"
            onPress={handleSave}
            size="large"
            variant="outline"
            style={styles.footerButton}
          />
        )}
        <Button
          title={isLastPage ? 'Terminer' : 'Continuer'}
          onPress={handleAddPage}
          size="large"
          style={isLastPage ? undefined : styles.footerButton}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 24,
  },
  chapterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  pageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 24,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#F2F2F7',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    padding: 20,
    backgroundColor: '#FFFBF0',
  },
  paragraphText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1C1C1E',
    fontStyle: 'italic',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#1B5E20',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});
