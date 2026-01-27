import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Story reader screen - comic book style reader with full-screen images
 * Uses react-native-pager-view for smooth page flipping
 */
export const StoryReaderScreen: React.FC = () => {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const [currentPage, setCurrentPage] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const pagerRef = useRef<PagerView>(null);

  const stories = useAppStore((state) => state.stories);
  const story = stories.find((s) => s.id === storyId);

  if (!story || !story.pages || story.pages.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Histoire introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handlePageSelected = (e: any) => {
    setCurrentPage(e.nativeEvent.position);
  };

  const toggleHeader = () => {
    setShowHeader(!showHeader);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={!showHeader} />
      
      {/* Header - toggleable by tapping screen */}
      {showHeader && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
          
          <Text style={styles.title} numberOfLines={1}>
            {story.title}
          </Text>
          
          <View style={styles.pageCounter}>
            <Text style={styles.pageCounterText}>
              {currentPage + 1}/{story.pages.length}
            </Text>
          </View>
        </View>
      )}

      {/* PagerView for comic book pages */}
      <PagerView
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
        ref={pagerRef}
      >
        {story.pages.map((page, index) => (
          <View style={styles.pageContainer} key={page.id}>
            <TouchableOpacity
              style={styles.imageTouchable}
              activeOpacity={1}
              onPress={toggleHeader}
            >
              <Image
                source={{ uri: page.imageUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            {/* Page number overlay (always visible) */}
            <View style={styles.pageNumberOverlay}>
              <Text style={styles.pageNumberText}>{page.pageNumber}</Text>
            </View>
          </View>
        ))}
      </PagerView>

      {/* Navigation hint (only on first page) */}
      {currentPage === 0 && showHeader && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>← Glisse pour tourner la page →</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  pageCounter: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pageCounterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  imageTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  pageNumberOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pageNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  hintText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
