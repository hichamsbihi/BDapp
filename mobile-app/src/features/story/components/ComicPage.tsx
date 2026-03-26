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
  const imageWidth = screenWidth - 32; // 16px margin each side

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
    backgroundColor: '#FFFCF5',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },

  imageFrame: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFCF5',
    shadowColor: '#5D4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  image: {
    borderRadius: 12,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 60,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0D5C5',
  },
  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4C4AE',
    marginHorizontal: 12,
  },

  textContainer: {
    paddingHorizontal: 28,
  },
  paragraph: {
    fontSize: 17,
    lineHeight: 30,
    color: '#3D3229',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  pageNumber: {
    textAlign: 'center',
    fontSize: 12,
    color: '#B8A99A',
    marginTop: 24,
    letterSpacing: 2,
  },
});
