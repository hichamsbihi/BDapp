import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer, Button } from '@/shared';
import { useAppStore } from '@/store';
import { StoryPage } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Story reader screen - displays complete story in swipeable pages
 */
export const StoryReaderScreen: React.FC = () => {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const stories = useAppStore((state) => state.stories);
  const story = stories.find((s) => s.id === storyId);

  if (!story) {
    return (
      <ScreenContainer style={styles.errorContainer}>
        <Text style={styles.errorText}>Histoire introuvable</Text>
        <Button title="Retour" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const goToNextPage = () => {
    if (currentIndex < story.pages.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const goToPrevPage = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  const renderPage = ({ item }: { item: StoryPage }) => (
    <View style={styles.pageWrapper}>
      <View style={styles.pageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.pageImage}
          resizeMode="cover"
        />
        <View style={styles.textContainer}>
          <Text style={styles.pageNumber}>Page {item.pageNumber}</Text>
          <Text style={styles.pageText}>{item.paragraphText}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{story.title}</Text>
        <View style={styles.pageIndicator}>
          <Text style={styles.pageIndicatorText}>
            {currentIndex + 1}/{story.pages.length}
          </Text>
        </View>
      </View>

      {/* Pages swipeable */}
      <FlatList
        ref={flatListRef}
        data={story.pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Navigation dots */}
      <View style={styles.dotsContainer}>
        {story.pages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={styles.footer}>
        <Button
          title="Page precedente"
          onPress={goToPrevPage}
          variant="outline"
          disabled={currentIndex === 0}
          style={styles.navButton}
        />
        <Button
          title={currentIndex === story.pages.length - 1 ? 'Terminer' : 'Page suivante'}
          onPress={currentIndex === story.pages.length - 1 ? () => router.back() : goToNextPage}
          style={styles.navButton}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F8F8',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  pageIndicator: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pageIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  pageWrapper: {
    width: SCREEN_WIDTH,
    padding: 20,
  },
  pageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  pageImage: {
    width: '100%',
    height: SCREEN_WIDTH * 0.75,
    backgroundColor: '#F2F2F7',
  },
  textContainer: {
    padding: 20,
    backgroundColor: '#FFFBF0',
  },
  pageNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  pageText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1C1C1E',
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C7C7CC',
  },
  dotActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  navButton: {
    flex: 1,
  },
});
