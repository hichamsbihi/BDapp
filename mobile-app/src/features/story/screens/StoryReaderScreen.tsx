import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { useAppStore } from '@/store';
import { ComicPage } from '../components/ComicPage';
import { ViewerControls } from '../components/ViewerControls';
import { ViewerHeader } from '../components/ViewerHeader';

/**
 * Story reader - illustrated book style viewer.
 * Uses PagerView for horizontal swiping with image + paragraph per page.
 * Header and controls overlay toggle on tap.
 */
export const StoryReaderScreen: React.FC = () => {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const pagerRef = useRef<PagerView>(null);

  const stories = useAppStore((state) => state.stories);
  const story = stories.find((s) => s.id === storyId);

  const handleClose = useCallback(() => {
    router.replace('/');
  }, []);

  const toggleOverlay = useCallback(() => {
    setShowOverlay((prev) => !prev);
  }, []);

  const handlePageSelected = useCallback((e: any) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  const handlePrev = useCallback(() => {
    if (currentPage > 0) {
      pagerRef.current?.setPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleNext = useCallback(() => {
    if (story && currentPage < story.pages.length - 1) {
      pagerRef.current?.setPage(currentPage + 1);
    }
  }, [currentPage, story]);

  if (!story || !story.pages || story.pages.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Histoire introuvable</Text>
        <TouchableOpacity onPress={handleClose} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalPages = story.pages.length;

  return (
    <View style={styles.container}>
      <StatusBar hidden={!showOverlay} />

      <ViewerHeader
        title={story.title}
        visible={showOverlay}
        onClose={handleClose}
      />

      <PagerView
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
        ref={pagerRef}
      >
        {story.pages.map((page) => (
          <View style={styles.pageWrapper} key={page.id}>
            <ComicPage
              page={page}
              totalPages={totalPages}
              onTap={toggleOverlay}
            />
          </View>
        ))}
      </PagerView>

      {/* Bottom controls */}
      {showOverlay && (
        <View style={[styles.controlsWrapper, { paddingBottom: insets.bottom }]}>
          <ViewerControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        </View>
      )}

      {/* Swipe hint on first page only */}
      {currentPage === 0 && showOverlay && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Glisse pour tourner la page</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.ink,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.accent,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 16,
    color: colors.surface,
    fontWeight: '600',
  },

  pagerView: {
    flex: 1,
  },
  pageWrapper: {
    flex: 1,
  },

  controlsWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  hintContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  hintText: {
    fontSize: 13,
    color: colors.inkMuted,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontStyle: 'italic',
    overflow: 'hidden',
  },
});
