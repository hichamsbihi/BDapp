import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentUser } from '@/services/authService';
import { useAppStore } from '@/store';
import { ScreenContainer } from '@/shared';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import {
  STARS_PACK_SMALL,
  STARS_PACK_MEDIUM,
  STARS_PACK_LARGE,
  PREMIUM_LIFETIME,
  FIRST_PURCHASE_BONUS_STARS,
} from '@/constants/stars';
import { colors, radius, spacing, typography, shadows } from '@/theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = spacing.xl;
const CARD_MAX = Math.min(SCREEN_WIDTH - CARD_PADDING * 2, 340);

type PackType = 'small' | 'medium' | 'large';

interface StarPackCardProps {
  stars: number;
  priceEur: number;
  index: number;
  onPress: () => void;
  loading?: boolean;
  /** Promo badge shown on first purchase (small pack doubles to 20 stars) */
  promoLabel?: string;
  highlight?: boolean;
}

function StarPackCard({ stars, priceEur, index, onPress, loading, promoLabel, highlight }: StarPackCardProps) {
  const scale = useSharedValue(1);
  const promoScale = useSharedValue(0.8);

  useEffect(() => {
    if (promoLabel) {
      promoScale.value = withDelay(
        index * 80 + 200,
        withSequence(
          withSpring(1.12, { damping: 8, stiffness: 140 }),
          withSpring(1, { damping: 12 })
        )
      );
    }
  }, [promoLabel]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const promoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: promoScale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify().damping(14)}>
      <Animated.View
        style={[
          styles.starPackCard,
          animatedStyle,
          highlight && styles.starPackCardHighlight,
        ]}
      >
      <AnimatedPressable
        scaleValue={1}
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        disabled={loading}
        style={styles.starPackInner}
      >
        <LinearGradient
          colors={highlight ? ['#FFF8E1', '#FFECB3', '#FFE082'] as const : ['#FFFBF5', '#FFF5E8', '#FFF9F0'] as const}
          style={styles.starPackGradient}
        >
          {promoLabel && (
            <Animated.View style={[styles.promoBadge, promoAnimStyle]}>
              <Text style={styles.promoBadgeText}>{promoLabel}</Text>
            </Animated.View>
          )}
          <View style={styles.starPackHeader}>
            <Text style={styles.starPackStars} allowFontScaling={false}>{stars}</Text>
            <Text style={styles.starPackLabel}>étoiles</Text>
          </View>
          <Text style={styles.starPackPrice}>{priceEur.toFixed(2).replace('.', ',')} €</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.cardLoader} />
          ) : (
            <Text style={styles.starPackCta}>Choisir</Text>
          )}
        </LinearGradient>
      </AnimatedPressable>
      </Animated.View>
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
    <Animated.View entering={FadeInDown.delay(320).springify().damping(14)}>
      <Animated.View style={animatedStyle}>
      <AnimatedPressable
        scaleValue={1}
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        disabled={loading}
        style={styles.premiumCard}
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
      </AnimatedPressable>
      </Animated.View>
    </Animated.View>
  );
}

/**
 * Paywall: packs d'étoiles + option Premium à vie.
 * First purchase on small pack gives FIRST_PURCHASE_BONUS_STARS instead of base.
 */
export function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const setIsPremium = useAppStore((s) => s.setIsPremium);
  const [authChecked, setAuthChecked] = useState(false);
  const [loadingPack, setLoadingPack] = useState<PackType | 'premium' | null>(null);

  // Track first purchase via store — once any pack is bought, promo is gone
  const hasEverPurchased = useAppStore((s) => s.hasEverPurchased);
  const setHasEverPurchased = useAppStore((s) => s.setHasEverPurchased);

  const isFirstPurchase = !hasEverPurchased;

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
    if (!__DEV__) {
      Alert.alert('Achats bientôt disponibles');
      return;
    }
    setLoadingPack(pack);
    try {
      // MOCK: Replace with real IAP SDK (e.g. RevenueCat) before production
      await new Promise((r) => setTimeout(r, 800));
      const addStars = useAppStore.getState().addStars;
      let gained = 0;

      if (pack === 'small') {
        gained = isFirstPurchase ? FIRST_PURCHASE_BONUS_STARS : STARS_PACK_SMALL.stars;
      } else if (pack === 'medium') {
        gained = STARS_PACK_MEDIUM.stars;
      } else {
        gained = STARS_PACK_LARGE.stars;
      }

      addStars(gained);
      setHasEverPurchased(true);

      Alert.alert(
        'Bravo !',
        `Tu as recu ${gained} étoiles !`,
        [{ text: 'Super !', onPress: () => router.back() }],
      );
    } finally {
      setLoadingPack(null);
    }
  };

  const handlePremium = async () => {
    if (!__DEV__) {
      Alert.alert('Achats bientôt disponibles');
      return;
    }
    setLoadingPack('premium');
    try {
      // MOCK: Replace with real IAP SDK (e.g. RevenueCat) before production
      await new Promise((r) => setTimeout(r, 600));
      setIsPremium(true);
      setHasEverPurchased(true);

      Alert.alert(
        'Premium activé !',
        'Tous les univers sont débloqués. Bonne aventure !',
        [{ text: 'Génial !', onPress: () => router.back() }],
      );
    } finally {
      setLoadingPack(null);
    }
  };

  const handleRestore = () => {
    // TODO: restore purchases via RevenueCat
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

  // Show promo stars count for small pack if first purchase
  const smallPackStars = isFirstPurchase ? FIRST_PURCHASE_BONUS_STARS : STARS_PACK_SMALL.stars;

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
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>ÉTOILES</Text>
          </View>
          <Text style={styles.title}>Choisis ton pack</Text>
          <Text style={styles.subtitle}>
            Plus d'étoiles pour débloquer des univers et créer des histoires.
          </Text>
        </Animated.View>

        <View style={styles.packs}>
          <StarPackCard
            stars={smallPackStars}
            priceEur={STARS_PACK_SMALL.priceEur}
            index={0}
            onPress={() => handleStarPack('small')}
            loading={loadingPack === 'small'}
            promoLabel={isFirstPurchase ? 'OFFRE DE BIENVENUE  x2 !' : undefined}
            highlight={isFirstPurchase}
          />
          <StarPackCard
            stars={STARS_PACK_MEDIUM.stars}
            priceEur={STARS_PACK_MEDIUM.priceEur}
            index={1}
            onPress={() => handleStarPack('medium')}
            loading={loadingPack === 'medium'}
          />
          <StarPackCard
            stars={STARS_PACK_LARGE.stars}
            priceEur={STARS_PACK_LARGE.priceEur}
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
          <Text style={styles.parentNoticeTitle}>Information</Text>
          <Text style={styles.parentNoticeText}>
            Tu peux restaurer tes achats sur un autre appareil via le bouton ci-dessous.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <AnimatedPressable onPress={handleRestore} style={styles.footerLink}>
          <Text style={styles.footerLinkText}>Restaurer mes achats</Text>
        </AnimatedPressable>
        <AnimatedPressable onPress={handleClose} style={styles.footerLink}>
          <Text style={styles.footerLinkText}>Fermer</Text>
        </AnimatedPressable>
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
  headerBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  headerBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.bold,
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
  starPackCardHighlight: {
    borderColor: '#FFB300',
    borderWidth: 2.5,
    ...shadows.lg,
    shadowColor: '#FFB300',
  },
  starPackInner: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  starPackGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  promoBadge: {
    backgroundColor: '#FF6D00',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  promoBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  starPackHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  starPackStars: {
    fontSize: 36,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
  },
  starPackLabel: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },
  starPackPrice: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  starPackCta: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  premiumSectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
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
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  premiumTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
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
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  premiumCta: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  cardLoader: {
    marginTop: spacing.sm,
  },
  parentNotice: {
    backgroundColor: 'rgba(255, 138, 101, 0.12)',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.xxl,
  },
  parentNoticeTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
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
    fontWeight: typography.weight.medium,
  },
});
