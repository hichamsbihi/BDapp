import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';
import { getParagraphForPage } from '@/data';

/**
 * Paragraph display screen - shows the current story paragraph
 * Displays different paragraphs for each of the 5 pages
 */
export const ParagraphScreen: React.FC = () => {
  const currentStory = useAppStore((state) => state.currentStory);
  const currentPageNumber = (currentStory?.pages?.length || 0) + 1;

  // Get paragraph text for current page
  const paragraphText = currentStory?.universeId
    ? getParagraphForPage(currentStory.universeId, currentPageNumber)
    : '';

  const handleGenerateImage = () => {
    router.push({
      pathname: '/story/generating',
      params: { paragraphText },
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.chapterLabel}>Page {currentPageNumber} / 5</Text>
          <Text style={styles.title}>{currentStory?.title}</Text>
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
