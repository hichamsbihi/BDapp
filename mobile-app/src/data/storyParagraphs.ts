import { NarrativeChoice } from '@/types';

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
 * Narrative choices for each universe and page
 * Two choices per page, representing story branches
 */
export const NARRATIVE_CHOICES: Record<string, NarrativeChoice[][]> = {
  'universe-fantasy': [
    // After page 1
    [
      { id: 'fantasy-1a', text: 'Tu t\'approches doucement du dragon pour le rassurer.' },
      { id: 'fantasy-1b', text: 'Tu cherches autour de toi un indice sur ce qui l\'a effraye.' },
    ],
    // After page 2
    [
      { id: 'fantasy-2a', text: 'Tu proposes au dragon de partir immediatement vers la foret.' },
      { id: 'fantasy-2b', text: 'Tu suggeres d\'abord de trouver une carte pour ne pas se perdre.' },
    ],
    // After page 3
    [
      { id: 'fantasy-3a', text: 'Vous suivez les traces de feu vers les montagnes.' },
      { id: 'fantasy-3b', text: 'Vous demandez son chemin a un hibou sage perche sur une branche.' },
    ],
    // After page 4
    [
      { id: 'fantasy-4a', text: 'Tu decides de voler sur le dos du dragon jusqu\'au sommet.' },
      { id: 'fantasy-4b', text: 'Tu preferes grimper a pied pour admirer le paysage.' },
    ],
  ],
  'universe-space': [
    [
      { id: 'space-1a', text: 'Tu sors de ta fusee pour aller voir de plus pres.' },
      { id: 'space-1b', text: 'Tu allumes la lumiere de ta fusee pour eclairer la zone.' },
    ],
    [
      { id: 'space-2a', text: 'Tu suis l\'alien dans sa cite souterraine.' },
      { id: 'space-2b', text: 'Tu l\'invites d\'abord a visiter ta fusee.' },
    ],
    [
      { id: 'space-3a', text: 'Tu explores les tunnels lumineux avec curiosite.' },
      { id: 'space-3b', text: 'Tu demandes a voir leur technologie secrete.' },
    ],
    [
      { id: 'space-4a', text: 'Tu acceptes les cristaux en cadeau.' },
      { id: 'space-4b', text: 'Tu proposes un echange contre quelque chose de la Terre.' },
    ],
  ],
  'universe-ocean': [
    [
      { id: 'ocean-1a', text: 'Tu deroules la carte pour voir ou mene le chemin.' },
      { id: 'ocean-1b', text: 'Tu gardes la carte et cherches d\'abord un compagnon.' },
    ],
    [
      { id: 'ocean-2a', text: 'Tu montes sur le dos du dauphin pour aller plus vite.' },
      { id: 'ocean-2b', text: 'Tu preferes nager a cote de lui pour mieux observer.' },
    ],
    [
      { id: 'ocean-3a', text: 'Tu entres dans la grotte malgre l\'obscurite.' },
      { id: 'ocean-3b', text: 'Tu cherches une source de lumiere avant d\'entrer.' },
    ],
    [
      { id: 'ocean-4a', text: 'Tu prends quelques perles pour les montrer a ta famille.' },
      { id: 'ocean-4b', text: 'Tu laisses le tresor intact, c\'est l\'aventure qui compte.' },
    ],
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
 * Get narrative choices for a specific universe and page
 * Returns two choices for the child to pick from
 */
export const getChoicesForPage = (universeId: string, pageNumber: number): NarrativeChoice[] => {
  const choices = NARRATIVE_CHOICES[universeId] || NARRATIVE_CHOICES['universe-fantasy'];
  const index = Math.min(pageNumber - 1, choices.length - 1);
  return choices[index] || [];
};

/**
 * Personalize paragraph text with hero name
 */
export const personalizeParagraph = (text: string, heroName?: string): string => {
  if (!heroName) return text;
  // Replace "tu" with hero name in some cases for more personalization
  return text;
};
