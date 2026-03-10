/**
 * STARS ECONOMY - Single source of truth
 *
 * Design decisions (billing / economy):
 *
 * 1. COSTS (depense d'etoiles)
 *    - Debloquer un univers : UNIVERSE_UNLOCK_COST (3 etoiles)
 *      -> L'utilisateur peut "Regarder une magie" (pub) depuis le modal
 *        "Pas assez d'etoiles" ou depuis le modal Stars (badge).
 *    - Telecharger le livre en PDF : PDF_EXPORT_COST (2 etoiles)
 *      -> Idem : proposition "Regarder une magie" si pas assez d'etoiles,
 *        ou depuis le modal Stars.
 *
 * 2. REWARDS (gain d'etoiles)
 *    - Compteur 12h (depuis le modal Stars) : COUNTDOWN_REWARD (1 etoile)
 *      -> Un nouveau bonus toutes les 12h, claim depuis le modal.
 *    - Regarder une video (pub) : REWARD_WATCH_AD (1 etoile)
 *      -> Disponible depuis : modal Stars, modal "Pas assez d'etoiles"
 *        (debloquer univers / telecharger PDF), et directement dans le
 *        flux de deblocage univers et export PDF.
 *    - Finir une histoire : REWARD_STORY_COMPLETE (2 etoiles)
 *    - Bonus quotidien (1x par jour) : REWARD_DAILY_BONUS (1 etoile)
 *
 * 3. PACKS (achat in-app, a definir plus tard)
 *    - Placeholder : STARS_PACK_SMALL, MEDIUM, LARGE (quantites et prix
 *      a definir avec le billing).
 *
 * 4. Où proposer "Regarder une pub"
 *    - Clic sur le badge Stars -> modal avec : compteur 12h, bouton
 *      "Regarder une magie", lien vers packs.
 *    - Quand l'utilisateur veut debloquer un univers et n'a pas assez
 *      d'etoiles -> NotEnoughStarsModal avec "Regarder une magie".
 *    - Quand l'utilisateur veut telecharger le PDF et n'a pas assez
 *      d'etoiles -> NotEnoughStarsModal avec "Regarder une magie".
 */

// --- COSTS ---
/** Etoiles pour debloquer un univers */
export const UNIVERSE_UNLOCK_COST = 3;
/** Etoiles pour telecharger le livre en PDF */
export const PDF_EXPORT_COST = 2;

// --- REWARDS ---
/** Etoiles donnees quand l'utilisateur regarde une pub ("magie") */
export const REWARD_WATCH_AD = 1;
/** Etoiles quand l'utilisateur termine une histoire */
export const REWARD_STORY_COMPLETE = 2;
/** Etoiles du bonus quotidien (1x par jour) */
export const REWARD_DAILY_BONUS = 1;
/** Etoiles reclamees via le compteur 12h (modal Stars) */
export const COUNTDOWN_REWARD = 1;

// --- COUNTDOWN (modal Stars) ---
/** Duree en heures entre deux gains possibles via le compteur */
export const COUNTDOWN_HOURS = 12;

// --- INITIAL ---
export const INITIAL_STARS = 3;

// --- PACKS (placeholder, prix a definir avec IAP) ---
export const STARS_PACK_SMALL = { stars: 10, productId: 'stars_pack_small' };
export const STARS_PACK_MEDIUM = { stars: 25, productId: 'stars_pack_medium' };
export const STARS_PACK_LARGE = { stars: 60, productId: 'stars_pack_large' };
