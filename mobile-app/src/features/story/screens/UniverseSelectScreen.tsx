import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Button, ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';
import { UNIVERSES } from '@/data';
import { Universe } from '@/types';
import { generateStoryId } from '@/data/mockStories';

/**
 * Universe selection screen - first step of story creation
 */
export const UniverseSelectScreen: React.FC = () => {
  const [selectedUniverseId, setSelectedUniverseId] = useState<string | null>(null);
  const setCurrentStory = useAppStore((state) => state.setCurrentStory);
  const heroProfile = useAppStore((state) => state.heroProfile);

  const handleContinue = () => {
    if (!selectedUniverseId) return;

    // Initialize current story with selected universe
    setCurrentStory({
      id: generateStoryId(),
      universeId: selectedUniverseId,
      heroId: heroProfile?.id || 'default-hero',
      pages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isComplete: false,
    });

    router.push('/story/start-select');
  };

  const renderUniverse = ({ item }: { item: Universe }) => {
    const isSelected = selectedUniverseId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.universeCard,
          { borderColor: isSelected ? item.color : 'transparent' },
        ]}
        onPress={() => setSelectedUniverseId(item.id)}
      >
        {/* Colored background with universe icon/emoji */}
        <View style={[styles.universeImage, { backgroundColor: item.color }]}>
          <Text style={styles.universeEmoji}>
            {item.id === 'universe-fantasy' ? '🏰' : item.id === 'universe-space' ? '🚀' : '🌊'}
          </Text>
        </View>
        <View style={styles.universeContent}>
          <Text style={styles.universeName}>{item.name}</Text>
          <Text style={styles.universeDescription}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Choisis ton univers</Text>
        <Text style={styles.subtitle}>
          Ou veux-tu vivre ton aventure aujourd'hui ?
        </Text>

        <FlatList
          data={UNIVERSES}
          renderItem={renderUniverse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.universeList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.footer}>
        <Button
          title="Continuer"
          onPress={handleContinue}
          size="large"
          disabled={!selectedUniverseId}
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
  universeList: {
    paddingBottom: 20,
  },
  universeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  universeImage: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  universeEmoji: {
    fontSize: 50,
  },
  universeContent: {
    padding: 16,
  },
  universeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  universeDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
});
