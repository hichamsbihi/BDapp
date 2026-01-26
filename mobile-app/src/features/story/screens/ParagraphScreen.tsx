import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';
import { getStoryStartById } from '@/data';

/**
 * Paragraph display screen - shows the current story paragraph
 */
export const ParagraphScreen: React.FC = () => {
  const { startId } = useLocalSearchParams<{ startId: string }>();

  const currentStory = useAppStore((state) => state.currentStory);
  const heroProfile = useAppStore((state) => state.heroProfile);

  // Get the story start text
  const storyStart = startId ? getStoryStartById(startId) : null;

  // Replace placeholder with hero name if available
  const paragraphText = storyStart?.text.replace(
    /tu/g,
    heroProfile?.name || 'tu'
  );

  const handleGenerateImage = () => {
    router.push({
      pathname: '/story/generating',
      params: { startId },
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.chapterLabel}>Chapitre 1</Text>
          <Text style={styles.title}>{currentStory?.title || storyStart?.title}</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.paragraphContainer}>
            <Text style={styles.paragraphText}>{paragraphText}</Text>
          </View>

          <View style={styles.continuationHint}>
            <Text style={styles.hintText}>
              Pret a voir cette scene prendre vie ?
            </Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Button
          title="Generer l'image"
          onPress={handleGenerateImage}
          size="large"
          variant="secondary"
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 20,
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
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  paragraphContainer: {
    backgroundColor: '#FFFBF0',
    borderRadius: 16,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD60A',
  },
  paragraphText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#1C1C1E',
    fontStyle: 'italic',
  },
  continuationHint: {
    marginTop: 24,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
});
