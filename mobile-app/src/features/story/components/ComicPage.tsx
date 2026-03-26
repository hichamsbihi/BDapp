import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { StoryPage } from '@/types';
import { colors, spacing, radius, typography, shadows } from '@/theme/theme';

interface ComicPageProps {
  page: StoryPage;
  totalPages: number;
  onTap: () => void;
}

/**
 * Single illustrated book page: image on top, narrative paragraph below.
 * Wrapped in React.memo to prevent re-renders when PagerView swipes.
 */
const ComicPageInner: React.FC<ComicPageProps> = ({ page, totalPages, onTap }) => {
  const { width: screenWidth } = useWindowDimensions();
  const imageWidth = screenWidth - spacing.xxl;

  // Dynamic height based on real image aspect ratio
  const [imageHeight, setImageHeight] = useState(imageWidth); // default square
  const handleImageLoad = useCallback(
    (e: { nativeEvent: { source: { width: number; height: number } } }) => {
      const { width: w, height: h } = e.nativeEvent.source;
      if (w > 0 && h > 0) {
        setImageHeight(imageWidth * (h / w));
      }
    },
    [imageWidth]
  );

  return (
    <TouchableOpacity
      style={styles.root}
      activeOpacity={1}
      onPress={onTap}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Image container — height adapts to real aspect ratio */}
        <View style={styles.imageFrame}>
          <Image
            source={{ uri: page.imageUrl }}
            style={[styles.image, { width: imageWidth, height: imageHeight }]}
            resizeMode="contain"
            fadeDuration={300}
            onLoad={handleImageLoad}
          />
        </View>

        {/* Decorative divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerLine} />
        </View>

        {/* Narrative paragraph */}
        <View style={styles.textContainer}>
          <Text style={styles.paragraph}>{page.paragraphText}</Text>
        </View>

        {/* Page number */}
        <Text style={styles.pageNumber}>
          {page.pageNumber} / {totalPages}
        </Text>
      </ScrollView>
    </TouchableOpacity>
  );
};

export const ComicPage = React.memo(ComicPageInner);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom:
      spacing.xxxl + spacing.xxl + spacing.lg + spacing.xs,
  },

  imageFrame: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
    ...shadows.lg,
  },
  image: {
    borderRadius: radius.md,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl - spacing.xs,
    paddingHorizontal: spacing.xl + spacing.xl + spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerDot: {
    width: spacing.sm - spacing.xxs,
    height: spacing.sm - spacing.xxs,
    borderRadius: (spacing.sm - spacing.xxs) / 2,
    backgroundColor: colors.borderMedium,
    marginHorizontal: spacing.md,
  },

  textContainer: {
    paddingHorizontal: spacing.xl + spacing.xs,
  },
  paragraph: {
    fontSize: typography.size.lg + spacing.xxs,
    lineHeight: typography.size.xl * typography.lineHeight.normal,
    color: colors.text.primary,
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  pageNumber: {
    textAlign: 'center',
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginTop: spacing.xl,
    letterSpacing: spacing.xxs,
  },
});
