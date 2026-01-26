import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';
import { getStoryStartById, getUniverseById } from '@/data';
import { generatePageId } from '@/data/mockStories';

/**
 * Page display screen - shows the BD page with image and text
 */
export const PageScreen: React.FC = () => {
  const { startId } = useLocalSearchParams<{ startId: string }>();

  const currentStory = useAppStore((state) => state.currentStory);
  const updateCurrentStory = useAppStore((state) => state.updateCurrentStory);
  const addStory = useAppStore((state) => state.addStory);
  const heroProfile = useAppStore((state) => state.heroProfile);

  const storyStart = startId ? getStoryStartById(startId) : null;
  const universe = currentStory?.universeId
    ? getUniverseById(currentStory.universeId)
    : null;

  // Placeholder image URL based on universe
  const imageUrl = universe
    ? `https://via.placeholder.com/400x300/${universe.color.replace('#', '')}/FFFFFF?text=${encodeURIComponent(storyStart?.title || 'Histoire')}`
    : 'https://via.placeholder.com/400x300/E8E8E8/333333?text=Image';

  const paragraphText = storyStart?.text.replace(
    /tu/g,
    heroProfile?.name || 'tu'
  );

  const handleSaveAndFinish = () => {
    if (!currentStory) return;

    // Create the page
    const newPage = {
      id: generatePageId(),
      paragraphText: paragraphText || '',
      imageUrl,
      pageNumber: 1,
    };

    // Save story to library
    addStory({
      ...currentStory,
      title: storyStart?.title || 'Mon Histoire',
      pages: [newPage],
      updatedAt: new Date(),
      isComplete: true,
    } as any);

    // Clear current story and navigate to library
    router.replace('/(tabs)');
  };

  const handleContinue = () => {
    // In MVP, we just save and finish
    // In full version, this would continue to next paragraph
    handleSaveAndFinish();
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.chapterLabel}>Page 1</Text>
          <Text style={styles.title}>{storyStart?.title}</Text>
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
          <Text style={styles.successTitle}>Bravo !</Text>
          <Text style={styles.successText}>
            Ta premiere page est creee ! Tu peux continuer l'aventure ou
            sauvegarder cette histoire.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Sauvegarder"
          onPress={handleSaveAndFinish}
          size="large"
          variant="outline"
          style={styles.footerButton}
        />
        <Button
          title="Continuer l'histoire"
          onPress={handleContinue}
          size="large"
          style={styles.footerButton}
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
