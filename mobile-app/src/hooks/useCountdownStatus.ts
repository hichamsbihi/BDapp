import { useMemo } from 'react';
import { useAppStore } from '@/store';
import { COUNTDOWN_HOURS } from '@/constants/stars';

/**
 * Returns whether the user can claim the 12h countdown reward and when the next claim is available.
 * Used by the Stars modal to show countdown and "Claim" button.
 */
export function useCountdownStatus(): {
  canClaim: boolean;
  nextClaimAt: Date | null;
  lastClaimAt: Date | null;
} {
  const lastCountdownClaimDate = useAppStore((s) => s.lastCountdownClaimDate);

  return useMemo(() => {
    if (!lastCountdownClaimDate) {
      return { canClaim: true, nextClaimAt: null, lastClaimAt: null };
    }
    const last = new Date(lastCountdownClaimDate);
    const next = new Date(last.getTime() + COUNTDOWN_HOURS * 60 * 60 * 1000);
    const now = new Date();
    const canClaim = now >= next;
    return {
      canClaim,
      nextClaimAt: canClaim ? null : next,
      lastClaimAt: last,
    };
  }, [lastCountdownClaimDate]);
}
