import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentUser } from '@/services/authService';
import { useAppStore } from '@/store';
import { ScreenContainer } from '@/shared';
import {
  STARS_PACK_SMALL,
  STARS_PACK_MEDIUM,
  STARS_PACK_LARGE,
  PREMIUM_LIFETIME,
} from '@/constants/stars';
import { colors, radius, spacing, typography, shadows } from '@/theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = spacing.xl;
const CARD_MAX = Math.min(SCREEN_WIDTH - CARD_PADDING * 2, 340);

type PackType = 'small' | 'medium' | 'large';

interface StarPackCardProps {
  stars: number;
  priceEur: number;
  universes: number;
  books: number;
  index: number;
  onPress: () => void;
  loading?: boolean;
}

function StarPackCard({ stars, priceEur, universes, books, index, onPress, loading }: StarPackCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify().damping(14)}
      style={[styles.starPackCard, animatedStyle]}
    >
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onPress}
        disabled={loading}
        style={({ pressed }) => [styles.starPackInner, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={['#FFFBF5', '#FFF5E8', '#FFF9F0'] as const}
          style={styles.starPackGradient}
        >
          <View style={styles.starPackHeader}>
            <Text style={styles.starPackStars} allowFontScaling={false}>{stars}</Text>
            <Text style={styles.starPackLabel}>étoiles</Text>
          </View>
          <Text style={styles.starPackPrice}>{priceEur.toFixed(2).replace('.', ',')} €</Text>
          <View style={styles.starPackFeatures}>
            <Text style={styles.starPackFeature}>{universes} univers</Text>
            <Text style={styles.starPackFeature}>{books} livres</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.cardLoader} />
          ) : (
            <Text style={styles.starPackCta}>Choisir</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

interface PremiumCardProps {
  onPress: () => void;
  loading?: boolean;
}

function PremiumCard({ onPress, loading }: PremiumCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(320).springify().damping(14)} style={animatedStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onPress}
        disabled={loading}
        style={({ pressed }) => [styles.premiumCard, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={['#FFE082', '#FFD54F', '#FFB300'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumGradient}
        >
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>À VIE</Text>
          </View>
          <Text style={styles.premiumTitle}>Premium</Text>
          <Text style={styles.premiumSubtitle}>Tous les univers, sans limite</Text>
          <Text style={styles.premiumPrice}>{PREMIUM_LIFETIME.priceEur.toFixed(2).replace('.', ',')} €</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.text.primary} style={styles.cardLoader} />
          ) : (
            <Text style={styles.premiumCta}>Débloquer tout</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Paywall: packs d'étoiles + option Premium à vie.
 * Si l'utilisateur n'est pas connecté, redirection vers login?from=paywall.
 */
export function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const setIsPremium = useAppStore((s) => s.setIsPremium);
  const [authChecked, setAuthChecked] = useState(false);
  const [loadingPack, setLoadingPack] = useState<PackType | 'premium' | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (cancelled) return;
      if (!user) {
        router.replace('/(auth)/login?from=paywall');
        return;
      }
      setAuthChecked(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleStarPack = async (pack: PackType) => {
    setLoadingPack(pack);
    try {
      // TODO: IAP - for now mock success and add stars
      await new Promise((r) => setTimeout(r, 800));
      const addStars = useAppStore.getState().addStars;
      if (pack === 'small') addStars(STARS_PACK_SMALL.stars);
      else if (pack === 'medium') addStars(STARS_PACK_MEDIUM.stars);
      else addStars(STARS_PACK_LARGE.stars);
      router.back();
    } finally {
      setLoadingPack(null);
    }
  };

  const handlePremium = async () => {
    setLoadingPack('premium');
    try {
      await new Promise((r) => setTimeout(r, 600));
      setIsPremium(true);
      router.back();
    } finally {
      setLoadingPack(null);
    }
  };

  const handleRestore = () => {
    // TODO: restore purchases
  };

  const handleClose = () => {
    router.back();
  };

  if (!authChecked) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <LinearGradient
        colors={['#FFFCF5', '#FFF8EE', '#FFFBF5'] as const}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ÉTOILES</Text>
          </View>
          <Text style={styles.title}>Choisis ton pack</Text>
          <Text style={styles.subtitle}>
            Plus d'étoiles pour débloquer des univers et créer des histoires.
          </Text>
        </Animated.View>

        <View style={styles.packs}>
          <StarPackCard
            stars={STARS_PACK_SMALL.stars}
            priceEur={STARS_PACK_SMALL.priceEur}
            universes={STARS_PACK_SMALL.universes}
            books={STARS_PACK_SMALL.books}
            index={0}
            onPress={() => handleStarPack('small')}
            loading={loadingPack === 'small'}
          />
          <StarPackCard
            stars={STARS_PACK_MEDIUM.stars}
            priceEur={STARS_PACK_MEDIUM.priceEur}
            universes={STARS_PACK_MEDIUM.universes}
            books={STARS_PACK_MEDIUM.books}
            index={1}
            onPress={() => handleStarPack('medium')}
            loading={loadingPack === 'medium'}
          />
          <StarPackCard
            stars={STARS_PACK_LARGE.stars}
            priceEur={STARS_PACK_LARGE.priceEur}
            universes={STARS_PACK_LARGE.universes}
            books={STARS_PACK_LARGE.books}
            index={2}
            onPress={() => handleStarPack('large')}
            loading={loadingPack === 'large'}
          />
        </View>

        <Text style={styles.premiumSectionTitle}>Ou tout débloquer</Text>
        <PremiumCard
          onPress={handlePremium}
          loading={loadingPack === 'premium'}
        />

        <View style={styles.parentNotice}>
          <Text style={styles.parentNoticeTitle}>Pour les parents</Text>
          <Text style={styles.parentNoticeText}>
            Les achats doivent être effectués par un adulte. Tu peux restaurer tes achats sur un autre appareil.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable onPress={handleRestore} style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}>
          <Text style={styles.footerLinkText}>Restaurer mes achats</Text>
        </Pressable>
        <Pressable onPress={handleClose} style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}>
          <Text style={styles.footerLinkText}>Fermer</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.md,
    color: colors.text.muted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: typography.size.display,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  packs: {
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
  starPackCard: {
    maxWidth: CARD_MAX,
    alignSelf: 'center',
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 193, 7, 0.35)',
    ...shadows.md,
  },
  starPackInner: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  starPackGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  starPackHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  starPackStars: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text.primary,
  },
  starPackLabel: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },
  starPackPrice: {
    fontSize: typography.size.xxl,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  starPackFeatures: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  starPackFeature: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  starPackCta: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.primary,
  },
  premiumSectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  premiumCard: {
    maxWidth: CARD_MAX,
    alignSelf: 'center',
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 179, 0, 0.6)',
    ...shadows.lg,
    shadowColor: '#FFB300',
  },
  premiumGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  premiumBadge: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  premiumBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  premiumTitle: {
    fontSize: typography.size.xxl,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  premiumSubtitle: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  premiumPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  premiumCta: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.text.primary,
  },
  cardLoader: {
    marginTop: spacing.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  parentNotice: {
    backgroundColor: 'rgba(255, 138, 101, 0.12)',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.xxl,
  },
  parentNoticeTitle: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  parentNoticeText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  footerLink: {
    paddingVertical: spacing.sm,
  },
  footerLinkText: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: '500',
  },
});
