import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { StoryPage } from '@/types';
import { colors } from '@/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.55;

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
        {/* Image container with subtle shadow frame */}
        <View style={styles.imageFrame}>
          <Image
            source={{ uri: page.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            fadeDuration={300}
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
    paddingBottom: 100,
  },

  imageFrame: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: IMAGE_HEIGHT,
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
    backgroundColor: colors.border,
  },
  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },

  textContainer: {
    paddingHorizontal: 28,
  },
  paragraph: {
    fontSize: 17,
    lineHeight: 30,
    color: colors.ink,
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  pageNumber: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 24,
    letterSpacing: 2,
  },
});
