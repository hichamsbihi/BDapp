import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, ScreenContainer } from '@/shared';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { useAppStore } from '@/store';

interface FeatureItemProps {
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ title, description }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureCheck}>
      <Text style={styles.checkmark}>V</Text>
    </View>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

/**
 * Paywall screen - mock premium subscription screen
 * Parent verification would be implemented in production
 */
export const PaywallScreen: React.FC = () => {
  const setIsPremium = useAppStore((state) => state.setIsPremium);

  const handleSubscribe = () => {
    // Mock subscription - in production, this would handle payment
    setIsPremium(true);
    router.back();
  };

  const handleRestore = () => {
    // Mock restore - in production, this would verify previous purchases
    console.log('Restore purchases triggered');
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PREMIUM</Text>
          </View>
          <Text style={styles.title}>Deviens un Super Conteur !</Text>
          <Text style={styles.subtitle}>
            Debloque toutes les fonctionnalites pour creer des histoires sans
            limites
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem
            title="Histoires illimitees"
            description="Cree autant d'histoires que tu veux"
          />
          <FeatureItem
            title="Tous les univers"
            description="Acces a tous les mondes magiques"
          />
          <FeatureItem
            title="Images haute qualite"
            description="Des illustrations encore plus belles"
          />
          <FeatureItem
            title="Partage facile"
            description="Partage tes BD avec ta famille"
          />
          <FeatureItem
            title="Sans publicite"
            description="Une experience sans interruption"
          />
        </View>

        {/* Pricing */}
        <View style={styles.pricing}>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Abonnement mensuel</Text>
            <Text style={styles.price}>4,99 EUR</Text>
            <Text style={styles.priceNote}>par mois</Text>
          </View>
        </View>

        {/* Parent notice */}
        <View style={styles.parentNotice}>
          <Text style={styles.parentNoticeTitle}>Pour les parents</Text>
          <Text style={styles.parentNoticeText}>
            Cette application est destinee aux enfants. L'achat doit etre
            effectue par un parent ou tuteur legal. Vous pouvez annuler a tout
            moment.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="S'abonner maintenant"
          onPress={handleSubscribe}
          size="large"
        />
        <View style={styles.footerLinks}>
          <Text style={styles.footerLink} onPress={handleRestore}>
            Restaurer mes achats
          </Text>
          <Text style={styles.footerDivider}>•</Text>
          <Text style={styles.footerLink} onPress={handleClose}>
            Plus tard
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  features: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.inkMuted,
  },
  pricing: {
    marginBottom: 24,
  },
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.ink,
    ...shadows.comic,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.inkMuted,
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.ink,
  },
  priceNote: {
    fontSize: 14,
    color: colors.inkMuted,
  },
  parentNotice: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  parentNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  parentNoticeText: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerLink: {
    fontSize: 14,
    color: colors.accent,
  },
  footerDivider: {
    fontSize: 14,
    color: colors.border,
    marginHorizontal: 12,
  },
});
