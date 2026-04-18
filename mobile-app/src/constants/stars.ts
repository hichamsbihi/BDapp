/**
 * STARS ECONOMY - Single source of truth
 *
 * 1. COSTS
 *    - Debloquer une histoire : 3 etoiles
 *    - Telecharger le livre en PDF : 1 etoile
 *
 * 2. REWARDS
 *    - Compteur 12h (modal Stars) : 1 etoile
 *    - Regarder une video ("magie") : 1 etoile
 *    - PAS de reward a la fin d'une histoire (progression = motivation)
 *
 * 3. INITIAL
 *    - 6 etoiles au demarrage (cadeau bienvenue)
 *
 * 4. PACKS (IAP)
 *    - 10 etoiles = 2.99 EUR (premiere achat promo: 20 etoiles pour le prix de 10)
 *    - 25 etoiles = 5.99 EUR
 *    - 60 etoiles = 9.99 EUR
 *    - Premium lifetime = 14.99 EUR (tout debloquer, plus besoin d'etoiles)
 */

// --- COSTS ---
/** @deprecated Use STORY_UNLOCK_COST instead */
export const UNIVERSE_UNLOCK_COST = 3;
/** Etoiles pour debloquer une histoire */
export const STORY_UNLOCK_COST = 3;
/** Etoiles pour telecharger le livre en PDF */
export const PDF_EXPORT_COST = 1;

// --- REWARDS ---
/** Etoiles donnees quand l'utilisateur regarde une pub ("magie") */
export const REWARD_WATCH_AD = 1;
/** Etoiles reclamees via le compteur 12h (modal Stars) */
export const COUNTDOWN_REWARD = 1;

// --- COUNTDOWN (modal Stars) ---
/** Duree en heures entre deux gains possibles via le compteur */
export const COUNTDOWN_HOURS = 12;

// --- INITIAL ---
/** Cadeau de bienvenue au premier lancement */
export const INITIAL_STARS = 6;

// --- FIRST PURCHASE PROMO ---
/** First-time buyers get double stars on the small pack */
export const FIRST_PURCHASE_BONUS_STARS = 20;

// --- PACKS (IAP) ---
export const STARS_PACK_SMALL = {
  stars: 10,
  priceEur: 2.99,
  productId: 'stars_pack_10',
};
export const STARS_PACK_MEDIUM = {
  stars: 25,
  priceEur: 5.99,
  productId: 'stars_pack_25',
};
export const STARS_PACK_LARGE = {
  stars: 60,
  priceEur: 9.99,
  productId: 'stars_pack_60',
};

/** Premium: unlimited universes, no stars needed (lifetime). */
export const PREMIUM_LIFETIME = {
  priceEur: 14.99,
  productId: 'premium_lifetime',
};
