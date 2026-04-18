/**
 * Magic Words Configuration
 * 
 * Central source for all dynamic, poetic phrases in the app.
 * Simple, evocative, wonder-inducing.
 * 
 * Philosophy:
 * - Each phrase should spark imagination
 * - Avoid generic "loading" language
 * - Create anticipation without false promises
 * - Vary expressions to keep the experience fresh
 */

// Phrases shown during image generation - the magical creation moment
export const CREATION_PHRASES = {
  // Waiting state - the magic is happening
  waiting: [
    'Regarde ce qui apparaît...',
    'Une surprise se prépare...',
    'Un nouveau dessin arrive...',
    'La magie opère...',
    'Quelque chose de beau se crée...',
    'Les couleurs dansent...',
    'Ton histoire prend forme...',
    'Un monde apparaît...',
  ],
  
  // Progress states - what's happening behind the scenes
  progress: [
    'Les couleurs se mélangent...',
    'Les personnages prennent vie...',
    'Les détails apparaissent...',
    'Le décor se dessine...',
    'La lumière s\'installe...',
  ],
  
  // Almost done - building anticipation
  almostDone: [
    'Presque fini...',
    'Encore un instant...',
    'C\'est bientôt prêt...',
    'Plus que quelques touches...',
  ],
} as const;

// Phrases for the "see this scene" CTA button
export const SCENE_REVEAL_PHRASES = [
  'Découvre la suite',
  'Voir la scène',
  'Révéler l\'image',
  'Faire apparaître',
  'Ouvrir le dessin',
  'Découvrir',
] as const;

// Transition phrases between scenes (pivot moments)
// Large variety to keep each story fresh and engaging
export const PIVOT_PHRASES = {
  // Question-style pivots - invites the reader to wonder
  questions: [
    'Que va-t-il se passer ?',
    'Quelle sera la suite ?',
    'Et maintenant ?',
    'Que faire ?',
    'Où aller maintenant ?',
    'Quel chemin choisir ?',
    'Que décides-tu ?',
    'Quelle aventure t\'attend ?',
    'Que va découvrir notre héros ?',
    'Comment continuer ?',
  ],
  
  // Statement-style pivots - narrative flow
  statements: [
    'Et soudain...',
    'Puis...',
    'Alors...',
    'À ce moment-là...',
    'C\'est alors que...',
    'Et voilà que...',
    'Tout à coup...',
    'Sans hésiter...',
    'Le temps passe...',
    'Un instant plus tard...',
    'Le voyage continue...',
    'L\'aventure se poursuit...',
    'Une nouvelle page s\'ouvre...',
    'Le chemin se divise...',
    'Face à ce choix...',
    'Devant ce mystère...',
  ],
  
  // Mystery pivots - for dramatic, suspenseful moments
  mystery: [
    'Quelque chose d\'inattendu...',
    'Une surprise attend...',
    'Le mystère s\'épaissit...',
    'Un secret se cache...',
    'L\'inconnu approche...',
    'Une ombre se dessine...',
    'Un bruit étrange...',
    'Quelque chose bouge...',
    'Le vent murmure...',
    'Un indice apparaît...',
  ],
  
  // Wonder pivots - magical, dreamy moments
  wonder: [
    'La magie opère...',
    'Un miracle se produit...',
    'Les étoiles brillent...',
    'Un rêve prend vie...',
    'L\'impossible devient possible...',
    'Un monde nouveau s\'ouvre...',
    'La lumière guide le chemin...',
    'Un enchantement commence...',
    'Le destin se révèle...',
    'Une porte magique s\'ouvre...',
  ],
  
  // Action pivots - for exciting, dynamic moments
  action: [
    'Vite !',
    'En avant !',
    'C\'est le moment !',
    'Il faut agir !',
    'Sans attendre...',
    'Le courage se réveille...',
    'L\'heure est venue...',
    'Plus une seconde à perdre !',
    'Le défi commence...',
    'Prêt pour l\'aventure ?',
  ],
  
  // Emotion pivots - for touching, heartfelt moments
  emotion: [
    'Le cœur bat fort...',
    'Un sourire apparaît...',
    'Les yeux brillent...',
    'Une joie immense...',
    'L\'espoir renaît...',
    'L\'amitié grandit...',
    'Un lien se crée...',
    'La confiance s\'installe...',
    'Un moment précieux...',
    'Le bonheur est là...',
  ],
} as const;

// Phrases for the continue/next button
export const CONTINUE_PHRASES = [
  'Continuer l\'histoire',
  'Voir la suite',
  'Tourner la page',
  'Découvrir la suite',
  'Avancer',
] as const;

// Phrases for story completion
export const COMPLETION_PHRASES = {
  title: [
    'Fin de l\'histoire',
    'Et voilà !',
    'L\'histoire est terminée',
    'Bravo !',
  ],
  message: [
    'Tu as créé une histoire merveilleuse.',
    'Quelle belle aventure !',
    'Tu es un vrai conteur.',
    'Cette histoire est unique, comme toi.',
  ],
} as const;

// Types for better TypeScript support
export type CreationPhaseKey = keyof typeof CREATION_PHRASES;
export type PivotStyleKey = keyof typeof PIVOT_PHRASES;

/**
 * Utility functions for phrase selection
 */

// Get a random phrase from an array, avoiding repetition with the previous one
let lastPhraseIndex: Record<string, number> = {};

export const getRandomPhrase = (
  phrases: readonly string[],
  category: string = 'default'
): string => {
  const lastIndex = lastPhraseIndex[category] ?? -1;
  let newIndex: number;
  
  // Avoid repeating the same phrase twice in a row
  do {
    newIndex = Math.floor(Math.random() * phrases.length);
  } while (newIndex === lastIndex && phrases.length > 1);
  
  lastPhraseIndex[category] = newIndex;
  return phrases[newIndex];
};

// Get a creation phrase based on progress (0-100)
export const getCreationPhraseByProgress = (progress: number): string => {
  if (progress >= 90) {
    return getRandomPhrase(CREATION_PHRASES.almostDone, 'creation_almost');
  } else if (progress >= 40) {
    return getRandomPhrase(CREATION_PHRASES.progress, 'creation_progress');
  }
  return getRandomPhrase(CREATION_PHRASES.waiting, 'creation_waiting');
};

// Get a pivot phrase for a specific page number (adds variety)
export const getPivotPhraseForPage = (
  pageNumber: number,
  style?: PivotStyleKey
): string => {
  // If no style specified, pick a random category for maximum variety
  if (!style) {
    const allStyles = Object.keys(PIVOT_PHRASES) as PivotStyleKey[];
    const randomStyle = allStyles[Math.floor(Math.random() * allStyles.length)];
    const phrases = PIVOT_PHRASES[randomStyle];
    return getRandomPhrase(phrases, `pivot_${pageNumber}_${randomStyle}`);
  }
  
  const phrases = PIVOT_PHRASES[style];
  return getRandomPhrase(phrases, `pivot_${pageNumber}_${style}`);
};

// Get a random pivot phrase from all categories combined
export const getRandomPivotPhrase = (): string => {
  const allPhrases = [
    ...PIVOT_PHRASES.questions,
    ...PIVOT_PHRASES.statements,
    ...PIVOT_PHRASES.mystery,
    ...PIVOT_PHRASES.wonder,
    ...PIVOT_PHRASES.action,
    ...PIVOT_PHRASES.emotion,
  ];
  return getRandomPhrase(allPhrases, 'pivot_random');
};

// Get a scene reveal CTA phrase
export const getSceneRevealPhrase = (): string => {
  return getRandomPhrase(SCENE_REVEAL_PHRASES, 'scene_reveal');
};

// Get a continue button phrase
export const getContinuePhrase = (): string => {
  return getRandomPhrase(CONTINUE_PHRASES, 'continue');
};

// Reset phrase memory (useful when starting a new story)
export const resetPhraseMemory = (): void => {
  lastPhraseIndex = {};
};
