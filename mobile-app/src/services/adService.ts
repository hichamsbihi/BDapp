import { Platform } from 'react-native';
import {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useAppStore } from '@/store';

const AD_UNITS = {
  interstitial: {
    ios: 'ca-app-pub-7610537817566038/6513249718',
    android: '', // TODO: add Android ad unit ID
  },
  rewarded: {
    ios: '', // TODO: add iOS rewarded ad unit ID
    android: '', // TODO: add Android rewarded ad unit ID
  },
};

function getAdUnit(type: 'interstitial' | 'rewarded'): string {
  if (__DEV__) {
    return type === 'interstitial' ? TestIds.INTERSTITIAL : TestIds.REWARDED;
  }
  return Platform.OS === 'ios'
    ? AD_UNITS[type].ios
    : AD_UNITS[type].android;
}

// ── Interstitial (post-generation, skipped if user purchased) ──

let interstitialLoaded = false;

const interstitial = InterstitialAd.createForAdRequest(getAdUnit('interstitial'));

interstitial.addAdEventListener(AdEventType.LOADED, () => {
  interstitialLoaded = true;
});
interstitial.addAdEventListener(AdEventType.CLOSED, () => {
  interstitialLoaded = false;
  interstitial.load();
});
interstitial.addAdEventListener(AdEventType.ERROR, () => {
  interstitialLoaded = false;
});

export function preloadInterstitial(): void {
  const { adActivated } = useAppStore.getState();
  if (!adActivated) return;
  interstitial.load();
}

export async function showInterstitialIfEligible(): Promise<boolean> {
  const { adActivated, hasEverPurchased, isPremium } = useAppStore.getState();
  if (!adActivated || hasEverPurchased || isPremium) return false;

  if (!interstitialLoaded) {
    interstitial.load();
    return false;
  }

  try {
    await interstitial.show();
    return true;
  } catch {
    return false;
  }
}

// ── Rewarded (watch ad to earn 1 credit — always available) ──

let rewardedLoaded = false;

const rewarded = RewardedAd.createForAdRequest(getAdUnit('rewarded'));

rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
  rewardedLoaded = true;
});
rewarded.addAdEventListener(AdEventType.CLOSED, () => {
  rewardedLoaded = false;
  rewarded.load();
});
rewarded.addAdEventListener(AdEventType.ERROR, () => {
  rewardedLoaded = false;
});

export function preloadRewarded(): void {
  rewarded.load();
}

/**
 * Shows a rewarded ad. Returns true if the user watched the full ad
 * and earned the reward. Always available regardless of purchase status.
 */
export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!rewardedLoaded) {
      rewarded.load();
      resolve(false);
      return;
    }

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        unsubscribeEarned();
        resolve(true);
      },
    );

    const unsubscribeClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        unsubscribeClosed();
      },
    );

    rewarded.show().catch(() => {
      unsubscribeEarned();
      unsubscribeClosed();
      resolve(false);
    });
  });
}
