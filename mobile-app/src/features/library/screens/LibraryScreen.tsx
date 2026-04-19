import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ScreenContainer, Modal, StarsBadgeWithModal, NotEnoughStarsModal } from '@/shared';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import { useAppStore } from '@/store';
import { fetchUniverseById } from '@/services/storyService';
import { exportAndSharePdf } from '@/utils/pdfGenerator';
import { PDF_EXPORT_COST } from '@/constants/stars';
import { Story, Universe } from '@/types';
import { colors, spacing, radius, typography, shadows } from '@/theme/theme';

// 8-digit hex: subtle tints from text tokens (no dedicated overlay token in theme).
const OVERLAY_TEXT_PRIMARY_SUBTLE = `${colors.text.primary}1A`;
const OVERLAY_TEXT_SECONDARY_SPINE = `${colors.text.secondary}26`;

/**
 * LibraryScreen
 * 
 * A place of memories, not a list of content.
 * Each story is a treasure the user created.
 * 
 * The latest creation is highlighted.
 * Older stories rest quietly, ready to be revisited.
 */
export const LibraryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showNotEnoughStars, setShowNotEnoughStars] = useState(false);

  const stories = useAppStore((state) => state.stories);
  const heroProfile = useAppStore((state) => state.heroProfile);
  const credits = useAppStore((state) => state.credits);
  const isPremium = useAppStore((state) => state.isPremium);
  const canAfford = useAppStore((state) => state.canAfford);
  const spendCredits = useAppStore((state) => state.spendCredits);

  // Cache universe data for story cards (color, name)
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
        // Silently skip if universe not found
      }
    });
  }, [stories]);

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

  const handleExportPDF = async () => {
    if (!selectedStory) return;

    if (!isPremium && !canAfford(PDF_EXPORT_COST)) {
      setModalVisible(false);
      setShowNotEnoughStars(true);
      return;
    }

    setIsExporting(true);
    try {
      if (!isPremium) {
        const spent = spendCredits(PDF_EXPORT_COST);
        if (!spent) return;
      }
      await exportAndSharePdf(selectedStory, heroProfile?.name);
      setModalVisible(false);
    } catch (error) {
      if (__DEV__) console.log('PDF export failed:', error);
      Alert.alert('Erreur', 'La creation du PDF a echoue. Reessaie plus tard.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/selection/universe-select');
  };

  // Featured story card (latest creation)
  const renderFeaturedStory = (story: Story) => {
    const universe = universesMap[story.universeId];
    const coverImage = story.pages[0]?.imageUrl;

    return (
      <AnimatedPressable
        style={[styles.featuredCard]}
        onPress={() => handleStoryPress(story)}
      >
        <View style={styles.featuredCover}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.featuredImage} />
          ) : (
            <View style={[styles.featuredPlaceholder, { backgroundColor: universe?.color || colors.surface }]} />
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
      </AnimatedPressable>
    );
  };

  // Smaller story card for older stories
  const renderStoryCard = (story: Story) => {
    const universe = universesMap[story.universeId];
    const coverImage = story.pages[0]?.imageUrl;

    return (
      <AnimatedPressable
        key={story.id}
        style={[styles.storyCard]}
        onPress={() => handleStoryPress(story)}
      >
        <View style={styles.storyCover}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.storyImage} />
          ) : (
            <View style={[styles.storyPlaceholder, { backgroundColor: universe?.color || colors.surface }]} />
          )}
          <View style={styles.bookSpine} />
        </View>
        <Text style={styles.storyTitle} numberOfLines={2}>{story.title}</Text>
      </AnimatedPressable>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Rien encore...</Text>
      <Text style={styles.emptyText}>
        Ta premiere histoire attend{'\n'}d'etre ecrite.
      </Text>
      <AnimatedPressable
        style={[styles.emptyButton]}
        onPress={handleCreateNew}
      >
        <Text style={styles.emptyButtonText}>Commencer</Text>
      </AnimatedPressable>
    </View>
  );

  if (stories.length === 0) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <AnimatedPressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </AnimatedPressable>
        </View>
        <View
          style={[
            styles.starsHeader,
            { top: insets.top + spacing.sm, right: insets.right + spacing.xl - spacing.xs },
          ]}
        >
          <StarsBadgeWithModal />
        </View>
        {renderEmptyState()}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <AnimatedPressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </AnimatedPressable>
      </View>
      <View
        style={[
          styles.starsHeader,
          { top: insets.top + spacing.sm, right: insets.right + spacing.xl - spacing.xs },
        ]}
      >
        <StarsBadgeWithModal />
      </View>
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
          <AnimatedPressable
            style={[styles.createCard]}
            onPress={handleCreateNew}
          >
            <Text style={styles.createText}>Ecrire une nouvelle histoire</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>

      {/* Story actions modal */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={selectedStory?.title}
      >
        <View style={styles.modalContent}>
          <AnimatedPressable
            style={[styles.modalAction]}
            onPress={handleReadStory}
          >
            <Text style={styles.modalActionText}>Relire cette histoire</Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={[styles.modalActionSecondary, isExporting && styles.modalActionDisabled]}
            onPress={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color={colors.text.secondary} size="small" />
            ) : (
              <>
                <Text style={styles.modalActionSecondaryText}>
                  Créer mon livre PDF
                </Text>
              </>
            )}
          </AnimatedPressable>

        </View>
      </Modal>

      <NotEnoughStarsModal
        visible={showNotEnoughStars}
        onClose={() => setShowNotEnoughStars(false)}
        needed={PDF_EXPORT_COST}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xs,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  backButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  starsHeader: {
    position: 'absolute',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl + spacing.sm,
  },

  // Header
  header: {
    paddingHorizontal: spacing.xl + spacing.xs,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.xs,
  },
  headerTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.size.md,
    fontStyle: 'italic',
    color: colors.text.muted,
  },

  // Featured (latest story)
  featuredSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  featuredCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.background,
    ...shadows.lg,
  },
  featuredCover: {
    height: spacing.xxxl * 3 + spacing.xxl + spacing.xs,
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
    backgroundColor: OVERLAY_TEXT_PRIMARY_SUBTLE,
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + spacing.xxs,
    paddingVertical: spacing.xs + spacing.xxs,
    borderRadius: radius.sm,
  },
  featuredBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  featuredContent: {
    padding: spacing.lg,
  },
  featuredTitle: {
    fontSize: typography.size.lg + spacing.xxs,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  featuredMeta: {
    fontSize: typography.size.md,
    color: colors.text.muted,
  },

  // Older stories section
  olderSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontStyle: 'italic',
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  storyCard: {
    width: '47%',
  },
  storyCover: {
    aspectRatio: 3 / 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    position: 'relative',
    ...shadows.sm,
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
    width: spacing.xs + spacing.xxs,
    backgroundColor: OVERLAY_TEXT_SECONDARY_SPINE,
  },
  storyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginTop: spacing.sm + spacing.xxs,
    lineHeight: typography.size.lg + spacing.xxs,
  },

  // Create new section
  createSection: {
    paddingHorizontal: spacing.xl,
  },
  createCard: {
    paddingVertical: typography.size.lg + spacing.xxs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    // Subtle fill replaces previous pressed background; scale animation handles press feedback.
    backgroundColor: colors.surfaceWarm,
  },
  createText: {
    fontSize: typography.size.md + spacing.xxs,
    color: colors.text.muted,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl + spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.size.xl + spacing.xxs,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.size.lg,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: typography.size.lg * typography.lineHeight.normal + spacing.xxs,
    marginBottom: spacing.xxl,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.lg,
  },
  emptyButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },

  // Modal
  modalContent: {
    gap: spacing.md,
  },
  modalAction: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modalActionSecondary: {
    backgroundColor: colors.background,
    paddingVertical: typography.size.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalActionDisabled: {
    opacity: 0.5,
  },
  modalActionText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  modalActionSecondaryText: {
    fontSize: typography.size.md + spacing.xxs,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
});
