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
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentUser } from '@/services/authService';
import { useAppStore } from '@/store';
import { ScreenContainer } from '@/shared';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import { CREDIT_PACKS, PACK_UNLIMITED, type CreditPack } from '@/constants/stars';
import { colors, radius, spacing, typography, shadows } from '@/theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = spacing.xl;
const CARD_MAX = Math.min(SCREEN_WIDTH - CARD_PADDING * 2, 340);

type PackId = string;

interface PackCardProps {
  pack: CreditPack;
  index: number;
  onPress: () => void;
  loading?: boolean;
}

function PackCard({ pack, index, onPress, loading }: PackCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify().damping(14)}>
      <Animated.View style={[styles.packCard, animatedStyle]}>
        <AnimatedPressable
          scaleValue={1}
          onPressIn={() => { scale.value = withSpring(0.98, { damping: 15 }); }}
          onPressOut={() => { scale.value = withSpring(1); }}
          onPress={onPress}
          disabled={loading}
          style={styles.packInner}
        >
          <LinearGradient
            colors={['#FFFBF5', '#FFF5E8', '#FFF9F0'] as const}
            style={styles.packGradient}
          >
            <Text style={styles.packEmoji}>{pack.emoji}</Text>
            <View style={styles.packHeader}>
              <Text style={styles.packCredits} allowFontScaling={false}>{pack.credits}</Text>
              <Text style={styles.packCreditsLabel}>crédits</Text>
            </View>
            <Text style={styles.packName}>{pack.label}</Text>
            <Text style={styles.packPrice}>{pack.priceDollar.toFixed(2)} $</Text>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.cardLoader} />
            ) : (
              <Text style={styles.packCta}>Choisir</Text>
            )}
          </LinearGradient>
        </AnimatedPressable>
      </Animated.View>
    </Animated.View>
  );
}

interface UnlimitedCardProps {
  onPress: () => void;
  loading?: boolean;
}

function UnlimitedCard({ onPress, loading }: UnlimitedCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(CREDIT_PACKS.length * 80 + 40).springify().damping(14)}>
      <Animated.View style={animatedStyle}>
        <AnimatedPressable
          scaleValue={1}
          onPressIn={() => { scale.value = withSpring(0.98, { damping: 15 }); }}
          onPressOut={() => { scale.value = withSpring(1); }}
          onPress={onPress}
          disabled={loading}
          style={styles.unlimitedCard}
        >
          <LinearGradient
            colors={['#FFE082', '#FFD54F', '#FFB300'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.unlimitedGradient}
          >
            <View style={styles.unlimitedBadge}>
              <Text style={styles.unlimitedBadgeText}>À VIE</Text>
            </View>
            <Text style={styles.unlimitedEmoji}>{PACK_UNLIMITED.emoji}</Text>
            <Text style={styles.unlimitedTitle}>{PACK_UNLIMITED.label}</Text>
            <Text style={styles.unlimitedSubtitle}>Crédits illimités — plus jamais besoin d'en racheter</Text>
            <Text style={styles.unlimitedPrice}>{PACK_UNLIMITED.priceDollar.toFixed(2)} $</Text>
            {loading ? (
              <ActivityIndicator size="small" color={colors.text.primary} style={styles.cardLoader} />
            ) : (
              <Text style={styles.unlimitedCta}>Débloquer tout</Text>
            )}
          </LinearGradient>
        </AnimatedPressable>
      </Animated.View>
    </Animated.View>
  );
}

export function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const setIsPremium = useAppStore((s) => s.setIsPremium);
  const [authChecked, setAuthChecked] = useState(false);
  const [loadingPack, setLoadingPack] = useState<PackId | null>(null);

  const hasEverPurchased = useAppStore((s) => s.hasEverPurchased);
  const setHasEverPurchased = useAppStore((s) => s.setHasEverPurchased);

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

  const handleBuyPack = async (pack: CreditPack) => {
    if (!__DEV__) {
      Alert.alert(
        'Bientôt disponible 🚀',
        'Le paiement sera disponible très prochainement. Reste connecté !',
        [{ text: 'OK' }],
      );
      return;
    }
    setLoadingPack(pack.productId);
    try {
      await new Promise((r) => setTimeout(r, 800));
      useAppStore.getState().addCredits(pack.credits);
      setHasEverPurchased(true);

      Alert.alert(
        'Bravo !',
        `Tu as reçu ${pack.credits} crédits !`,
        [{ text: 'Super !', onPress: () => router.back() }],
      );
    } finally {
      setLoadingPack(null);
    }
  };

  const handleUnlimited = async () => {
    if (!__DEV__) {
      Alert.alert(
        'Bientôt disponible 🚀',
        'Le paiement sera disponible très prochainement. Reste connecté !',
        [{ text: 'OK' }],
      );
      return;
    }
    setLoadingPack(PACK_UNLIMITED.productId);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setIsPremium(true);
      setHasEverPurchased(true);

      Alert.alert(
        'Unlimited activé !',
        'Tous les crédits sont illimités. Bonne aventure !',
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
            <Text style={styles.headerBadgeText}>CRÉDITS</Text>
          </View>
          <Text style={styles.title}>Choisis ton pack</Text>
          <Text style={styles.subtitle}>
            Plus de crédits pour débloquer des histoires et vivre des aventures.
          </Text>
        </Animated.View>

        <View style={styles.packs}>
          {CREDIT_PACKS.map((pack, index) => (
            <PackCard
              key={pack.productId}
              pack={pack}
              index={index}
              onPress={() => handleBuyPack(pack)}
              loading={loadingPack === pack.productId}
            />
          ))}
        </View>

        <Text style={styles.unlimitedSectionTitle}>Ou tout débloquer</Text>
        <UnlimitedCard
          onPress={handleUnlimited}
          loading={loadingPack === PACK_UNLIMITED.productId}
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

  // ── Pack card ──
  packCard: {
    maxWidth: CARD_MAX,
    alignSelf: 'center',
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 193, 7, 0.35)',
    ...shadows.md,
  },
  packInner: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  packGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  packEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  packCredits: {
    fontSize: 36,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
  },
  packCreditsLabel: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },
  packName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  packPrice: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  packCta: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },

  // ── Unlimited card ──
  unlimitedSectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  unlimitedCard: {
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
  unlimitedGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  unlimitedBadge: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  unlimitedBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  unlimitedEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  unlimitedTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  unlimitedSubtitle: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  unlimitedPrice: {
    fontSize: 28,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  unlimitedCta: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  cardLoader: {
    marginTop: spacing.sm,
  },

  // ── Footer ──
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
