import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Button, ScreenContainer, Modal, Loader } from '@/shared';
import { useAppStore } from '@/store';
import { getUniverseById } from '@/data';
import { Story } from '@/types';

/**
 * Library screen - displays saved stories
 */
export const LibraryScreen: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const stories = useAppStore((state) => state.stories);
  const heroProfile = useAppStore((state) => state.heroProfile);
  const removeStory = useAppStore((state) => state.removeStory);
  const isPremium = useAppStore((state) => state.isPremium);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);

  // Redirect new users to onboarding
  useEffect(() => {
    if (!hasCompletedOnboarding) {
      const timer = setTimeout(() => router.replace('/onboarding'), 50);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding]);

  if (!hasCompletedOnboarding) {
    return <Loader fullScreen />;
  }

  const handleCreateNew = () => {
    if (!isPremium && stories.length >= 1) {
      router.push('/paywall');
      return;
    }
    router.push('/story/universe-select');
  };

  const handleDeleteStory = () => {
    if (selectedStory) {
      removeStory(selectedStory.id);
      setModalVisible(false);
      setSelectedStory(null);
    }
  };

  const renderStoryCard = ({ item }: { item: Story }) => {
    const universe = getUniverseById(item.universeId);

    return (
      <TouchableOpacity
        style={styles.storyCard}
        onPress={() => {
          setSelectedStory(item);
          setModalVisible(true);
        }}
      >
        <View style={[styles.storyImage, { backgroundColor: universe?.color || '#E5E5EA' }]}>
          <Text style={styles.storyEmoji}>
            {item.universeId === 'universe-fantasy' ? '🏰' : item.universeId === 'universe-space' ? '🚀' : '🌊'}
          </Text>
        </View>
        <View style={styles.storyContent}>
          <Text style={styles.storyTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.storyMeta}>
            {item.pages.length} page{item.pages.length > 1 ? 's' : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>Aucune histoire</Text>
      <Text style={styles.emptyText}>
        Utilise l'onglet "Nouvelle" pour creer ta premiere histoire !
      </Text>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour {heroProfile?.name || 'Aventurier'} !</Text>
          <Text style={styles.title}>Mes Histoires</Text>
        </View>
        {stories.length > 0 && (
          <TouchableOpacity style={styles.addButton} onPress={handleCreateNew}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isPremium && stories.length > 0 && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitText}>{stories.length}/1 histoire gratuite</Text>
          <TouchableOpacity onPress={() => router.push('/paywall')}>
            <Text style={styles.upgradeLink}>Passer Premium</Text>
          </TouchableOpacity>
        </View>
      )}

      {stories.length > 0 ? (
        <FlatList
          data={stories}
          renderItem={renderStoryCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={selectedStory?.title}
      >
        <View style={styles.modalContent}>
          <Button
            title="Lire l'histoire"
            onPress={() => {
              if (selectedStory) {
                setModalVisible(false);
                router.push({
                  pathname: '/story/reader',
                  params: { storyId: selectedStory.id },
                });
              }
            }}
          />
          <Button
            title="Supprimer"
            onPress={handleDeleteStory}
            variant="outline"
            textStyle={styles.deleteButtonText}
          />
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  limitBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  limitText: {
    fontSize: 14,
    color: '#856404',
  },
  upgradeLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  storyCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  storyImage: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyEmoji: {
    fontSize: 40,
  },
  storyContent: {
    padding: 12,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  storyMeta: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalContent: {
    gap: 12,
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
});
