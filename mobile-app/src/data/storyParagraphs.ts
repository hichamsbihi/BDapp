/**
 * Mock story paragraphs for each universe and page
 * In production, these would be AI-generated
 */

export const STORY_PARAGRAPHS: Record<string, string[]> = {
  // Fantasy universe paragraphs
  'universe-fantasy': [
    'Tu trouves un petit dragon bleu qui pleure pres d\'un vieux chene.',
    'Le dragon te raconte qu\'il a perdu sa famille dans la foret enchantee.',
    'Ensemble, vous partez a la recherche de sa famille en suivant les traces de feu.',
    'Vous rencontrez une fee qui vous indique le chemin vers la montagne magique.',
    'Au sommet de la montagne, le dragon retrouve enfin sa famille et te remercie !',
  ],
  // Space universe paragraphs
  'universe-space': [
    'Ta fusee vient d\'atterrir sur Mars et tu vois quelque chose bouger derriere un rocher.',
    'C\'est un petit alien vert qui te fait signe ! Il a l\'air amical.',
    'L\'alien t\'emmene visiter sa cite souterraine remplie de lumieres.',
    'Tu decouvres des cristaux magiques qui peuvent alimenter ta fusee.',
    'Grace a ton nouvel ami, tu rentres chez toi avec des souvenirs incroyables !',
  ],
  // Ocean universe paragraphs
  'universe-ocean': [
    'En plongeant pres du recif, tu trouves une vieille carte au tresor dans une bouteille.',
    'Un dauphin s\'approche et te propose de t\'aider a trouver le tresor.',
    'Vous nagez ensemble vers une grotte mysterieuse au fond de l\'ocean.',
    'Dans la grotte, vous decouvrez un coffre rempli de perles brillantes.',
    'Le dauphin te ramene a la surface et vous devenez les meilleurs amis !',
  ],
};

/**
 * Get paragraph text for a specific universe and page number
 */
export const getParagraphForPage = (universeId: string, pageNumber: number): string => {
  const paragraphs = STORY_PARAGRAPHS[universeId] || STORY_PARAGRAPHS['universe-fantasy'];
  const index = Math.min(pageNumber - 1, paragraphs.length - 1);
  return paragraphs[index];
};

/**
 * Personalize paragraph text with hero name
 */
export const personalizeParagraph = (text: string, heroName?: string): string => {
  if (!heroName) return text;
  // Replace "tu" with hero name in some cases for more personalization
  return text;
};
