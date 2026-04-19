/**
 * CREDITS ECONOMY - Single source of truth
 *
 * 1. COSTS
 *    - Debloquer une histoire : 3 credits
 *    - Telecharger le livre en PDF : 1 credit
 *
 * 2. REWARDS
 *    - Regarder une video ("magie") : 1 credit
 *
 * 3. INITIAL
 *    - 6 credits au demarrage (cadeau bienvenue)
 *
 * 4. PACKS (IAP)
 *    - Pack Aventure      : 20 credits  = 2.99 $
 *    - Pack Super-Aventure : 50 credits  = 5.99 $
 *    - Pack Gold-Aventure  : 120 credits = 11.99 $
 *    - Unlimited Aventure  : credits illimites = 24.99 $
 */

// --- COSTS ---
export const STORY_UNLOCK_COST = 3;
export const PDF_EXPORT_COST = 1;

// --- REWARDS ---
export const REWARD_WATCH_AD = 1;

// --- INITIAL ---
export const INITIAL_STARS = 6;

// --- PACKS (IAP) ---
export interface CreditPack {
  credits: number;
  priceDollar: number;
  productId: string;
  label: string;
  emoji: string;
}

export const PACK_AVENTURE: CreditPack = {
  credits: 20,
  priceDollar: 2.99,
  productId: 'credits_pack_20',
  label: 'Pack Aventure',
  emoji: '🗺️',
};

export const PACK_SUPER_AVENTURE: CreditPack = {
  credits: 50,
  priceDollar: 5.99,
  productId: 'credits_pack_50',
  label: 'Pack Super-Aventure',
  emoji: '⚡',
};

export const PACK_GOLD_AVENTURE: CreditPack = {
  credits: 120,
  priceDollar: 11.99,
  productId: 'credits_pack_120',
  label: 'Pack Gold-Aventure',
  emoji: '👑',
};

export const PACK_UNLIMITED: {
  priceDollar: number;
  productId: string;
  label: string;
  emoji: string;
} = {
  priceDollar: 24.99,
  productId: 'premium_unlimited',
  label: 'Unlimited Aventure',
  emoji: '♾️',
};

export const CREDIT_PACKS: CreditPack[] = [
  PACK_AVENTURE,
  PACK_SUPER_AVENTURE,
  PACK_GOLD_AVENTURE,
];
