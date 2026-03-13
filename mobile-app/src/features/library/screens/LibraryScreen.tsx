import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ScreenContainer,
  Modal,
  StarsBadge,
  NotEnoughStarsModal,
  EmptyState,
  Button,
} from '@/shared';
import { useAppStore } from '@/store';
import { fetchUniverseById } from '@/services/storyService';
import { exportAndSharePdf } from '@/utils/pdfGenerator';
import { PDF_EXPORT_COST } from '@/constants/stars';
import { Story, Universe } from '@/types';
import { colors, spacing, typography, radius, shadows } from '@/theme';

export const LibraryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showNotEnoughStars, setShowNotEnoughStars] = useState(false);

  const stories = useAppStore((state) => state.stories);
  const heroProfile = useAppStore((state) => state.heroProfile);
  const removeStory = useAppStore((state) => state.removeStory);
  const stars = useAppStore((state) => state.stars);
  const canAfford = useAppStore((state) => state.canAfford);
  const spendStars = useAppStore((state) => state.spendStars);
  const rewardStar = useAppStore((state) => state.rewardStar);

  const [universesMap, setUniversesMap] = useState<Record<string, Universe>>({});

  useEffect(() => {
    const universeIds = [...new Set(stories.map((s) => s.universeId))];
    universeIds.forEach(async (id) => {
      if (universesMap[id]) return;
      try {
        const universe = await fetchUniverseById(id);
        if (universe) {
          setUniversesMap((prev) => ({ ...prev, [id]: universe }));
        }
      } catch {
        // skip
      }
    });
  }, [stories]);

  const sortedStories = [...stories].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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

  const handleExportPDF = async () => {
    if (!selectedStory) return;
    if (!canAfford(PDF_EXPORT_COST)) {
      setModalVisible(false);
      setShowNotEnoughStars(true);
      return;
    }
    setIsExporting(true);
    try {
      const spent = spendStars(PDF_EXPORT_COST);
      if (!spent) return;
      await exportAndSharePdf(selectedStory);
      setModalVisible(false);
    } catch (error) {
      console.log('PDF export failed:', error);
      Alert.alert('Erreur', 'La creation du PDF a echoue. Reessaie plus tard.');
    } finally {
      setIsExporting(false);
    }
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

  const renderFeaturedStory = (story: Story) => {
    const universe = universesMap[story.universeId];
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
            <View style={[styles.featuredPlaceholder, { backgroundColor: universe?.color || colors.surfaceAlt }]} />
          )}
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

  const renderStoryCard = (story: Story) => {
    const universe = universesMap[story.universeId];
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
            <View style={[styles.storyPlaceholder, { backgroundColor: universe?.color || colors.surfaceAlt }]} />
          )}
          <View style={styles.bookSpine} />
        </View>
        <Text style={styles.storyTitle} numberOfLines={2}>{story.title}</Text>
      </Pressable>
    );
  };

  if (stories.length === 0) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={[styles.starsHeader, { top: insets.top + 8, right: insets.right + 20 }]}>
          <StarsBadge count={stars} />
        </View>
        <EmptyState
          title="Rien encore..."
          message={'Ta premiere histoire attend\nd\'etre ecrite.'}
          actionLabel="Commencer"
          onAction={handleCreateNew}
          illustrationVariant="empty"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <View style={[styles.starsHeader, { top: insets.top + 8, right: insets.right + 20 }]}>
        <StarsBadge count={stars} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Les histoires de {heroName}</Text>
          <Text style={styles.headerSubtitle}>
            {stories.length} creation{stories.length > 1 ? 's' : ''}
          </Text>
        </View>

        {latestStory && (
          <View style={styles.featuredSection}>
            {renderFeaturedStory(latestStory)}
          </View>
        )}

        {olderStories.length > 0 && (
          <View style={styles.olderSection}>
            <Text style={styles.sectionTitle}>Histoires precedentes</Text>
            <View style={styles.storiesGrid}>
              {olderStories.map(renderStoryCard)}
            </View>
          </View>
        )}

        <View style={styles.createSection}>
          <Pressable
            style={({ pressed }) => [styles.createCard, pressed && styles.createCardPressed]}
            onPress={handleCreateNew}
          >
            <Text style={styles.createText}>Ecrire une nouvelle histoire</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={selectedStory?.title}
      >
        <View style={styles.modalContent}>
          <Button
            title="Relire cette histoire"
            onPress={handleReadStory}
            variant="primary"
            size="medium"
          />

          <Pressable
            style={({ pressed }) => [
              styles.modalActionSecondary,
              pressed && styles.modalActionPressed,
              isExporting && styles.modalActionDisabled,
            ]}
            onPress={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color={colors.ink} size="small" />
            ) : (
              <Text style={styles.modalActionSecondaryText}>
                Creer le livre PDF ({PDF_EXPORT_COST} etoiles)
              </Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.modalActionDelete, pressed && styles.modalActionPressed]}
            onPress={handleDeleteStory}
          >
            <Text style={styles.modalActionDeleteText}>Supprimer</Text>
          </Pressable>
        </View>
      </Modal>

      <NotEnoughStarsModal
        visible={showNotEnoughStars}
        onClose={() => setShowNotEnoughStars(false)}
        needed={PDF_EXPORT_COST}
        onWatchMagic={() => rewardStar('watch_ad')}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  starsHeader: {
    position: 'absolute',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl + spacing.md,
  },

  header: {
    paddingHorizontal: spacing.lg + 4,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg + 4,
  },
  headerTitle: {
    ...typography.title,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.caption,
    fontStyle: 'italic',
    color: colors.inkMuted,
  },

  featuredSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  featuredCard: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 2.5,
    borderColor: colors.ink,
    ...shadows.comic,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }, { translateY: 2 }],
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
  featuredBadge: {
    position: 'absolute',
    top: spacing.md - 4,
    left: spacing.md - 4,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.surface,
  },
  featuredContent: {
    padding: spacing.md,
  },
  featuredTitle: {
    ...typography.subtitle,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  featuredMeta: {
    ...typography.caption,
    color: colors.inkMuted,
  },

  olderSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    fontStyle: 'italic',
    color: colors.inkMuted,
    marginBottom: spacing.md,
  },
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  storyCard: {
    width: '47%',
  },
  storyCover: {
    aspectRatio: 3 / 4,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    position: 'relative',
    borderWidth: 2,
    borderColor: colors.ink,
    ...shadows.comic,
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
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  storyTitle: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.inkLight,
    marginTop: spacing.sm + 2,
    lineHeight: 18,
  },

  createSection: {
    paddingHorizontal: spacing.lg,
  },
  createCard: {
    paddingVertical: spacing.md + 2,
    borderRadius: radius.xl,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  createCardPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  createText: {
    ...typography.label,
    fontWeight: '400',
    color: colors.inkMuted,
  },

  modalContent: {
    gap: spacing.md - 4,
  },
  modalActionSecondary: {
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  modalActionPressed: {
    opacity: 0.8,
  },
  modalActionDisabled: {
    opacity: 0.5,
  },
  modalActionSecondaryText: {
    ...typography.label,
    fontWeight: '500',
    color: colors.ink,
  },
  modalActionDelete: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  modalActionDeleteText: {
    ...typography.caption,
    color: colors.inkMuted,
  },
});
