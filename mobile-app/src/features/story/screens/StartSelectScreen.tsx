import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Button, ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';
import { getStoryStartsByUniverse, getUniverseById } from '@/data';
import { StoryStart } from '@/types';

/**
 * Story start selection screen - choose how the story begins
 */
export const StartSelectScreen: React.FC = () => {
  const [selectedStartId, setSelectedStartId] = useState<string | null>(null);

  const currentStory = useAppStore((state) => state.currentStory);
  const updateCurrentStory = useAppStore((state) => state.updateCurrentStory);

  // Get available story starts for the selected universe
  const storyStarts = currentStory?.universeId
    ? getStoryStartsByUniverse(currentStory.universeId)
    : [];

  const universe = currentStory?.universeId
    ? getUniverseById(currentStory.universeId)
    : null;

  const handleContinue = () => {
    if (!selectedStartId) return;

    const selectedStart = storyStarts.find((s) => s.id === selectedStartId);
    if (!selectedStart) return;

    // Update current story with selected start and title
    updateCurrentStory({
      title: selectedStart.title,
    });

    // Navigate to paragraph screen with the start text
    router.push({
      pathname: '/story/paragraph',
      params: { startId: selectedStartId },
    });
  };

  const renderStoryStart = ({ item }: { item: StoryStart }) => {
    const isSelected = selectedStartId === item.id;

    return (
      <TouchableOpacity
        style={[styles.startCard, isSelected && styles.startCardSelected]}
        onPress={() => setSelectedStartId(item.id)}
      >
        <Text style={[styles.startTitle, isSelected && styles.startTitleSelected]}>
          {item.title}
        </Text>
        <Text style={styles.startPreview} numberOfLines={2}>
          {item.text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Choisis ton histoire</Text>
        <Text style={styles.subtitle}>
          {universe
            ? `Dans ${universe.name}, quelle aventure veux-tu vivre ?`
            : 'Quelle aventure veux-tu vivre ?'}
        </Text>

        <FlatList
          data={storyStarts}
          renderItem={renderStoryStart}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.startList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.footer}>
        <Button
          title="Commencer l'histoire"
          onPress={handleContinue}
          size="large"
          disabled={!selectedStartId}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
  },
  startList: {
    paddingBottom: 20,
  },
  startCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  startCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FD',
  },
  startTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  startTitleSelected: {
    color: '#007AFF',
  },
  startPreview: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
});
