import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer, Modal } from '@/shared';
import { useAppStore } from '@/store';
import { getUniverseById } from '@/data';
import { Story } from '@/types';

/**
 * LibraryScreen
 * 
 * A place of memories, not a list of content.
 * Each story is a treasure the child created.
 * 
 * The latest creation is highlighted.
 * Older stories rest quietly, ready to be revisited.
 */
export const LibraryScreen: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const stories = useAppStore((state) => state.stories);
  const heroProfile = useAppStore((state) => state.heroProfile);
  const removeStory = useAppStore((state) => state.removeStory);

  // Sort by most recent first
  const sortedStories = [...stories].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const latestStory = sortedStories[0];
  const olderStories = sortedStories.slice(1);
  const heroName = heroProfile?.name || 'auteur';

  const handleStoryPress = (story: Story) => {
    setSelectedStory(story);
    setModalVisible(true);
  };

  const handleReadStory = () => {
    if (selectedStory) {
      setModalVisible(false);
      router.push({
        pathname: '/story/reader',
        params: { storyId: selectedStory.id },
      });
    }
  };

  const handleExportPDF = () => {
    console.log('Export PDF requested - would show rewarded ad');
    setModalVisible(false);
  };

  const handleDeleteStory = () => {
    if (selectedStory) {
      removeStory(selectedStory.id);
      setModalVisible(false);
      setSelectedStory(null);
    }
  };

  const handleCreateNew = () => {
    router.push('/story/universe-select');
  };

  // Featured story card (latest creation)
  const renderFeaturedStory = (story: Story) => {
    const universe = getUniverseById(story.universeId);
    const coverImage = story.pages[0]?.imageUrl;

    return (
      <Pressable
        style={({ pressed }) => [styles.featuredCard, pressed && styles.cardPressed]}
        onPress={() => handleStoryPress(story)}
      >
        <View style={styles.featuredCover}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.featuredImage} />
          ) : (
            <View style={[styles.featuredPlaceholder, { backgroundColor: universe?.color || '#E5DDD3' }]} />
          )}
          <View style={styles.featuredOverlay} />
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>Derniere creation</Text>
          </View>
        </View>
        <View style={styles.featuredContent}>
          <Text style={styles.featuredTitle}>{story.title}</Text>
          <Text style={styles.featuredMeta}>
            {story.pages.length} page{story.pages.length > 1 ? 's' : ''}
          </Text>
        </View>
      </Pressable>
    );
  };

  // Smaller story card for older stories
  const renderStoryCard = (story: Story) => {
    const universe = getUniverseById(story.universeId);
    const coverImage = story.pages[0]?.imageUrl;

    return (
      <Pressable
        key={story.id}
        style={({ pressed }) => [styles.storyCard, pressed && styles.cardPressed]}
        onPress={() => handleStoryPress(story)}
      >
        <View style={styles.storyCover}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.storyImage} />
          ) : (
            <View style={[styles.storyPlaceholder, { backgroundColor: universe?.color || '#E5DDD3' }]} />
          )}
          <View style={styles.bookSpine} />
        </View>
        <Text style={styles.storyTitle} numberOfLines={2}>{story.title}</Text>
      </Pressable>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Rien encore...</Text>
      <Text style={styles.emptyText}>
        Ta premiere histoire attend{'\n'}d'etre ecrite.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.emptyButton, pressed && styles.buttonPressed]}
        onPress={handleCreateNew}
      >
        <Text style={styles.emptyButtonText}>Commencer</Text>
      </Pressable>
    </View>
  );

  if (stories.length === 0) {
    return (
      <ScreenContainer style={styles.container}>
        {renderEmptyState()}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Poetic header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Les histoires de {heroName}</Text>
          <Text style={styles.headerSubtitle}>
            {stories.length} creation{stories.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Featured: latest creation */}
        {latestStory && (
          <View style={styles.featuredSection}>
            {renderFeaturedStory(latestStory)}
          </View>
        )}

        {/* Older stories */}
        {olderStories.length > 0 && (
          <View style={styles.olderSection}>
            <Text style={styles.sectionTitle}>Histoires precedentes</Text>
            <View style={styles.storiesGrid}>
              {olderStories.map(renderStoryCard)}
            </View>
          </View>
        )}

        {/* Create new */}
        <View style={styles.createSection}>
          <Pressable
            style={({ pressed }) => [styles.createCard, pressed && styles.createCardPressed]}
            onPress={handleCreateNew}
          >
            <Text style={styles.createText}>Ecrire une nouvelle histoire</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Story actions modal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={selectedStory?.title}
      >
        <View style={styles.modalContent}>
          <Pressable
            style={({ pressed }) => [styles.modalAction, pressed && styles.modalActionPressed]}
            onPress={handleReadStory}
          >
            <Text style={styles.modalActionText}>Relire cette histoire</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.modalActionSecondary, pressed && styles.modalActionPressed]}
            onPress={handleExportPDF}
          >
            <Text style={styles.modalActionSecondaryText}>
              Creer le livre PDF
            </Text>
            <Text style={styles.modalActionHint}>
              Regarde une courte video pour debloquer
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.modalActionDelete, pressed && styles.modalActionPressed]}
            onPress={handleDeleteStory}
          >
            <Text style={styles.modalActionDeleteText}>Supprimer</Text>
          </Pressable>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A3F32',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#9A8B7A',
  },

  // Featured (latest story)
  featuredSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuredCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFCF5',
    // Elevation
    shadowColor: '#5D4E37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardPressed: {
    opacity: 0.9,
  },
  featuredCover: {
    height: 180,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredPlaceholder: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(74, 63, 50, 0.1)',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF8A65',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featuredContent: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A3F32',
    marginBottom: 4,
  },
  featuredMeta: {
    fontSize: 13,
    color: '#9A8B7A',
  },

  // Older stories section
  olderSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#9A8B7A',
    marginBottom: 16,
  },
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  storyCard: {
    width: '47%',
  },
  storyCover: {
    aspectRatio: 3 / 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5EBE0',
    position: 'relative',
    // Book shadow
    shadowColor: '#5D4E37',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyPlaceholder: {
    width: '100%',
    height: '100%',
  },
  bookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: 'rgba(93, 78, 55, 0.15)',
  },
  storyTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5D4E37',
    marginTop: 10,
    lineHeight: 18,
  },

  // Create new section
  createSection: {
    paddingHorizontal: 24,
  },
  createCard: {
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  createCardPressed: {
    backgroundColor: '#FAF6F0',
  },
  createText: {
    fontSize: 15,
    color: '#9A8B7A',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4A3F32',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#8D7B68',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#FF8A65',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Modal
  modalContent: {
    gap: 12,
  },
  modalAction: {
    backgroundColor: '#FF8A65',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalActionSecondary: {
    backgroundColor: '#FFFCF5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
  },
  modalActionPressed: {
    opacity: 0.8,
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalActionSecondaryText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#5D4E37',
  },
  modalActionHint: {
    fontSize: 12,
    color: '#9A8B7A',
    marginTop: 4,
  },
  modalActionDelete: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  modalActionDeleteText: {
    fontSize: 14,
    color: '#C4A898',
  },
});
