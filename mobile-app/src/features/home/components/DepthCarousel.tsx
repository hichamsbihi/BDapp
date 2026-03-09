import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  type ListRenderItem,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  SharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radius, shadows } from '@/theme/theme';
import type { Story } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.62;
const CARD_HEIGHT = 200;
const GAP = spacing.lg;
const ITEM_WIDTH = CARD_WIDTH + GAP;
const PADDING_H = (SCREEN_WIDTH - CARD_WIDTH) / 2;

interface DepthCarouselProps {
  stories: Story[];
  onStoryPress: (story: Story) => void;
  coverImageUrl: (story: Story) => string;
}

function CarouselCard({
  story,
  index,
  scrollX,
  onPress,
  coverUrl,
}: {
  story: Story;
  index: number;
  scrollX: SharedValue<number>;
  onPress: () => void;
  coverUrl: string;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const offset = scrollX.value + PADDING_H - index * ITEM_WIDTH;
    const position = offset / ITEM_WIDTH;
    const scale = interpolate(position, [-1, 0, 1], [0.82, 1, 0.82]);
    const opacity = interpolate(
      Math.abs(position),
      [0, 0.5, 1],
      [1, 0.85, 0.55]
    );
    const rotateY = interpolate(position, [-1, 0, 1], [-4, 0, 4]);
    const translateY = interpolate(Math.abs(position), [0, 1], [0, 8]);
    return {
      opacity,
      transform: [
        { perspective: 600 },
        { scale },
        { translateY },
        { rotate: `${rotateY}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}
      >
        <Image
          source={{ uri: coverUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)'] as const}
          style={styles.cardGradient}
        />
        <Text style={styles.cardTitle} numberOfLines={2}>
          {story.title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Depth carousel: centered main card (scale 1, elevated), side cards scaled down with slight rotation.
 * Snap scrolling, parallax-style movement. Background shows focused story image with gradient.
 */
export const DepthCarousel: React.FC<DepthCarouselProps> = ({
  stories,
  onStoryPress,
  coverImageUrl,
}) => {
  const scrollX = useSharedValue(0);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const updateFocusedIndex = useCallback((x: number) => {
    const idx = Math.round(x / ITEM_WIDTH);
    setFocusedIndex((prev) => {
      const next = Math.min(Math.max(0, idx), stories.length - 1);
      return next !== prev ? next : prev;
    });
  }, [stories.length]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      const x = e.contentOffset.x;
      scrollX.value = x;
      runOnJS(updateFocusedIndex)(x);
    },
  });

  const renderItem: ListRenderItem<Story> = useCallback(
    ({ item, index }) => (
      <View style={styles.itemContainer}>
        <CarouselCard
          story={item}
          index={index}
          scrollX={scrollX}
          onPress={() => onStoryPress(item)}
          coverUrl={coverImageUrl(item)}
        />
      </View>
    ),
    [onStoryPress, coverImageUrl, scrollX]
  );

  if (stories.length === 0) return null;

  const safeIndex = Math.min(focusedIndex, stories.length - 1);
  const backgroundUrl = coverImageUrl(stories[safeIndex] ?? stories[0]);

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer} pointerEvents="none">
        <Image
          source={{ uri: backgroundUrl }}
          style={styles.backgroundImage}
          resizeMode="cover"
          blurRadius={0}
        />
        <LinearGradient
          colors={['rgba(255,252,245,0.3)', 'rgba(255,252,245,0.92)'] as const}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Animated.FlatList
        data={stories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT + 80,
    marginHorizontal: -spacing.xl,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  listContent: {
    paddingHorizontal: PADDING_H - GAP / 2,
    paddingTop: 24,
    paddingBottom: spacing.lg,
  },
  itemContainer: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.lg,
    elevation: 8,
  },
  cardPressed: {
    opacity: 0.95,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardTitle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
