import { AvatarCharacter, GeneratedStory, StoryPart, UniverseConfig } from '@/types';

const PLACEHOLDER_IMG = (seed: string) =>
  `https://picsum.photos/seed/${seed}/512/512`;

const SUPABASE_ASSETS = 'https://wddatxgqhdiosuhcztex.supabase.co/storage/v1/object/public/assets/avatars';

// ─── Avatar definitions (10 avatars) ────────────────────

interface AvatarSeed {
  id: string;
  characterName: string;
  gender: 'boy' | 'girl';
  frameSlug: string;
}

const AVATAR_SEEDS: AvatarSeed[] = [
  { id: '826577cc-d793-4738-9461-2b906bcf0caf', characterName: 'Milo Arachnide', gender: 'boy', frameSlug: 'boy-webrunner' },
  { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', characterName: 'Luna Sylvestre', gender: 'girl', frameSlug: 'girl-forest' },
  { id: 'a3b4c5d6-1111-4aaa-b222-000000000003', characterName: 'Kai Tempête', gender: 'boy', frameSlug: 'boy-webrunner' },
  { id: 'a3b4c5d6-1111-4aaa-b222-000000000004', characterName: 'Aria Flamme', gender: 'girl', frameSlug: 'girl-forest' },
  { id: 'a3b4c5d6-1111-4aaa-b222-000000000005', characterName: 'Zack Galaxie', gender: 'boy', frameSlug: 'boy-webrunner' },
  { id: 'a3b4c5d6-1111-4aaa-b222-000000000006', characterName: 'Jade Mystère', gender: 'girl', frameSlug: 'girl-forest' },
  { id: 'a3b4c5d6-1111-4aaa-b222-000000000007', characterName: 'Ryo Samouraï', gender: 'boy', frameSlug: 'boy-webrunner' },
  { id: 'a3b4c5d6-1111-4aaa-b222-000000000008', characterName: 'Stella Cosmos', gender: 'girl', frameSlug: 'girl-forest' },
  { id: 'a3b4c5d6-1111-4aaa-b222-000000000009', characterName: 'Max Turbo', gender: 'boy', frameSlug: 'boy-webrunner' },
  { id: 'a3b4c5d6-1111-4aaa-b222-000000000010', characterName: 'Nina Étoile', gender: 'girl', frameSlug: 'girl-forest' },
];

// ─── Universe definitions (linked to avatars, one-to-many) ──

interface UniverseSeed {
  id: string;
  gender: 'boy' | 'girl';
  name: string;
  desc: string;
  img: string;
  bgImg: string;
  color: string;
  lang: string;
  emoji: string;
}

const UNIVERSE_SEEDS: UniverseSeed[] = [
  // Boy universes
  { id: 'uni-01-shattered', gender: 'boy', name: 'The Shattered Dominion', desc: 'A post-collapse steampunk world where ancient automatons roam ruined citadels and aether crystals are running out.', img: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1536183922588-166604504d5e?w=1200&q=80', color: '#8B5E3C', lang: 'en', emoji: '⚙️' },
  { id: 'uni-01b-neon', gender: 'boy', name: 'Neon Underground', desc: 'A cyberpunk labyrinth of hacked networks and neon-lit tunnels beneath a megacity.', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1515705576963-95cad62945b6?w=1200&q=80', color: '#7C4DFF', lang: 'en', emoji: '💜' },
  { id: 'uni-02-forest', gender: 'boy', name: 'La Forêt Enchantée', desc: 'Une forêt millénaire où chaque arbre murmure des secrets, habitée par des créatures lumineuses.', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=1200&q=80', color: '#2E7D32', lang: 'fr', emoji: '🌳' },
  { id: 'uni-02b-moonlight', gender: 'boy', name: 'Le Lac de Lune', desc: "Un lac mystique où l'eau reflète un ciel d'étoiles inconnues et des créatures de lumière dansent à la surface.", img: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=1200&q=80', color: '#283593', lang: 'fr', emoji: '🌙' },
  { id: 'uni-03-ocean', gender: 'boy', name: "Les Abysses d'Azur", desc: 'Un royaume sous-marin de cités de corail et de courants magiques, menacé par une obscurité montante.', img: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1200&q=80', color: '#0277BD', lang: 'fr', emoji: '🌊' },
  { id: 'uni-03b-storm', gender: 'boy', name: "L'Archipel des Tempêtes", desc: "Des îles volantes battues par des orages perpétuels, où la foudre est une ressource précieuse.", img: 'https://images.unsplash.com/photo-1429552077091-836152271555?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=1200&q=80', color: '#01579B', lang: 'fr', emoji: '⛈️' },
  { id: 'uni-05-space', gender: 'boy', name: 'Station Orion', desc: 'A space station at the edge of known space, where alien diplomacy and cosmic mysteries collide.', img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&q=80', color: '#1A237E', lang: 'en', emoji: '🚀' },
  { id: 'uni-05b-asteroid', gender: 'boy', name: 'The Asteroid Belt', desc: 'A lawless mining frontier among drifting rocks, where fortune and danger orbit each other.', img: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&q=80', color: '#4A148C', lang: 'en', emoji: '☄️' },
  { id: 'uni-07-samurai', gender: 'boy', name: 'Le Royaume des Cerisiers', desc: "Un Japon féodal fantastique où les esprits ancestraux guident les guerriers à travers des épreuves d'honneur.", img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1200&q=80', color: '#C62828', lang: 'fr', emoji: '⛩️' },
  { id: 'uni-09-racing', gender: 'boy', name: 'Circuit Infini', desc: 'A neon-lit futuristic city where hover-racers compete in deadly circuits for glory and freedom.', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&q=80', color: '#00E676', lang: 'en', emoji: '🏎️' },

  // Girl universes
  { id: 'uni-04-volcano', gender: 'girl', name: 'Le Cratère Ardent', desc: "Un monde volcanique où les dragons forgent des alliances et la lave cache d'anciens trésors.", img: 'https://images.unsplash.com/photo-1462275646964-a0e3c11f18a6?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1500534623283-312aade40907?w=1200&q=80', color: '#D84315', lang: 'fr', emoji: '🌋' },
  { id: 'uni-06-detective', gender: 'girl', name: 'Les Ruelles de Minuit', desc: "Une ville brumeuse des années 1920 où chaque ombre cache un indice et chaque passant un secret.", img: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=1200&q=80', color: '#37474F', lang: 'fr', emoji: '🔍' },
  { id: 'uni-07b-shadow', gender: 'girl', name: 'Le Temple des Ombres', desc: "Un monastère perdu dans les montagnes brumeuses, gardé par des ninjas spectraux et des énigmes mortelles.", img: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1513569536235-bf4c0834e7e0?w=1200&q=80', color: '#212121', lang: 'fr', emoji: '🥷' },
  { id: 'uni-08-fairy', gender: 'girl', name: 'Le Jardin des Fées', desc: "Un monde miniature caché dans un jardin secret, peuplé de fées artisanes et de fleurs pensantes.", img: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1518882327030-2c6bca22cba8?w=1200&q=80', color: '#AB47BC', lang: 'fr', emoji: '🧚' },
  { id: 'uni-10-circus', gender: 'girl', name: 'Le Cirque des Songes', desc: "Un cirque itinérant magique où chaque numéro ouvre une porte vers un rêve — ou un cauchemar.", img: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&q=80', color: '#FF6F00', lang: 'fr', emoji: '🎪' },
  { id: 'uni-10b-stars', gender: 'girl', name: 'La Scène Céleste', desc: "Un théâtre flottant parmi les constellations, où les spectacles réécrivent la réalité.", img: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=800&q=80', bgImg: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&q=80', color: '#F50057', lang: 'fr', emoji: '🌟' },
];

// ─── Story seed per universe ────────────────────────────

interface StorySeed {
  id: string;
  universeId: string;
  title: string;
  synopsis: string;
  theme: string;
  imageUrl: string;
  locked: boolean;
}

const STORY_SEEDS: StorySeed[] = UNIVERSE_SEEDS.map((u, i) => ({
  id: `story-${u.id}`,
  universeId: u.id,
  title: `${u.name} — Chapter One`,
  synopsis: `An adventure awaits in ${u.name}: ${u.desc.slice(0, 80)}...`,
  theme: u.lang === 'fr' ? 'fantasy' : 'sci-fi',
  imageUrl: PLACEHOLDER_IMG(`story-${u.id}`),
  locked: i % 3 !== 0,
}));

// ─── Part text templates ────────────────────────────────

const PART_TEMPLATES = {
  opening: {
    text: (uName: string) =>
      `The adventure begins in ${uName}. Something extraordinary is about to happen — a signal, a whisper, a tremor in the fabric of this world. You feel it before you see it. The air shifts. Colors brighten. Every sense tells you: this is the moment everything changes. Behind you, the familiar world fades. Ahead, the unknown beckons with a promise that feels both terrifying and irresistible. You check what you have: courage, curiosity, and the unshakable feeling that you were meant to be here, right now, at this exact crossroads.`,
    mood: 'tense and mysterious',
    choiceA: { label: "Plonger dans l'inconnu", desc: "Pas le temps d'hésiter — fonce avant que le moment ne passe." },
    choiceB: { label: "Observer d'abord", desc: "Mieux vaut comprendre avant d'agir." },
  },
  middle: {
    text: `The path narrows. What seemed simple reveals layers of complexity. An obstacle stands between you and your goal — not just physical, but a choice that will define who you are in this world. The stakes have risen. Time presses. Two paths forward, each with its own risks and rewards. There is no safe option — only the one that feels right.`,
    mood: 'desperate and urgent',
    choiceA: { label: 'Prendre le risque', desc: 'Les grandes récompenses demandent du courage.' },
    choiceB: { label: 'Trouver un autre chemin', desc: 'La ruse peut être plus puissante que la force.' },
  },
  ending: {
    text: (uName: string) =>
      `Against all odds, you made it. The heart of ${uName} reveals its deepest secret — not a treasure in the traditional sense, but something far more valuable: a truth that changes how you see the world. The journey reshaped you. You carry something new: knowledge, a bond, a spark that wasn't there before. This was only the beginning.`,
    mood: 'revelatory and quietly hopeful',
  },
};

// ─── Generators ─────────────────────────────────────────

function buildAvatar(s: AvatarSeed, order: number): AvatarCharacter {
  return {
    id: s.id,
    characterName: s.characterName,
    frames: {
      normal: `${SUPABASE_ASSETS}/${s.frameSlug}-normal.png`,
      happy: `${SUPABASE_ASSETS}/${s.frameSlug}-happy.png`,
    },
    gender: s.gender,
    displayOrder: order,
  };
}

function buildUniverse(s: UniverseSeed): UniverseConfig {
  return {
    id: s.id,
    name: s.name,
    description: s.desc,
    imageUrl: s.img,
    backgroundImageUrl: s.bgImg,
    color: s.color,
    language: s.lang,
    emoji: s.emoji,
    isLocked: false,
    gender: s.gender,
  };
}

function buildStory(s: StorySeed): GeneratedStory {
  const partIds = [`${s.id}-p1`, `${s.id}-p2`, `${s.id}-p3`];
  return {
    id: s.id,
    universeId: s.universeId,
    title: s.title,
    synopsis: s.synopsis,
    theme: s.theme,
    imageUrl: s.imageUrl,
    isLocked: s.locked,
    totalParts: 3,
    partIds,
    status: 'complete',
    createdAt: '2026-04-17T10:00:00.000Z',
    completedAt: '2026-04-17T10:45:00.000Z',
  };
}

function buildParts(s: StorySeed, uName: string): StoryPart[] {
  const p1 = `${s.id}-p1`;
  const p2 = `${s.id}-p2`;
  const p3 = `${s.id}-p3`;
  const base = { storyId: s.id, universeId: s.universeId, imagePrompt: '', imagePath: '', status: 'generated' as const };

  return [
    {
      ...base, id: p1, partNumber: 1, isOpening: true, isEnding: false,
      title: s.title,
      narrativeText: PART_TEMPLATES.opening.text(uName),
      mood: PART_TEMPLATES.opening.mood,
      imageUrl: PLACEHOLDER_IMG(`${s.id}-opening`),
      choices: [
        { id: `${p1}-ca`, label: PART_TEMPLATES.opening.choiceA.label, description: PART_TEMPLATES.opening.choiceA.desc, leadsToPartId: p2 },
        { id: `${p1}-cb`, label: PART_TEMPLATES.opening.choiceB.label, description: PART_TEMPLATES.opening.choiceB.desc, leadsToPartId: p2 },
      ],
      generatedAt: '2026-04-17T10:10:00.000Z',
    },
    {
      ...base, id: p2, partNumber: 2, isOpening: false, isEnding: false,
      title: 'The Turning Point',
      narrativeText: PART_TEMPLATES.middle.text,
      mood: PART_TEMPLATES.middle.mood,
      imageUrl: PLACEHOLDER_IMG(`${s.id}-middle`),
      choices: [
        { id: `${p2}-ca`, label: PART_TEMPLATES.middle.choiceA.label, description: PART_TEMPLATES.middle.choiceA.desc, leadsToPartId: p3 },
        { id: `${p2}-cb`, label: PART_TEMPLATES.middle.choiceB.label, description: PART_TEMPLATES.middle.choiceB.desc, leadsToPartId: p3 },
      ],
      generatedAt: '2026-04-17T10:25:00.000Z',
    },
    {
      ...base, id: p3, partNumber: 3, isOpening: false, isEnding: true,
      title: 'What Was Found',
      narrativeText: PART_TEMPLATES.ending.text(uName),
      mood: PART_TEMPLATES.ending.mood,
      imageUrl: PLACEHOLDER_IMG(`${s.id}-ending`),
      choices: [],
      generatedAt: '2026-04-17T10:42:00.000Z',
    },
  ];
}

// ─── Generated mock data ────────────────────────────────

export const MOCK_AVATARS: AvatarCharacter[] = AVATAR_SEEDS.map((s, i) => buildAvatar(s, i + 1));
export const MOCK_UNIVERSES: UniverseConfig[] = UNIVERSE_SEEDS.map(buildUniverse);
export const MOCK_STORIES: GeneratedStory[] = STORY_SEEDS.map(buildStory);
export const MOCK_PARTS: StoryPart[] = STORY_SEEDS.flatMap((s) => {
  const u = UNIVERSE_SEEDS.find((u) => u.id === s.universeId)!;
  return buildParts(s, u.name);
});

// ─── Access helpers ─────────────────────────────────────

export const getMockAvatars = (gender?: 'boy' | 'girl'): AvatarCharacter[] => {
  if (!gender) return MOCK_AVATARS;
  return MOCK_AVATARS.filter((a) => a.gender === gender || a.gender === 'all');
};

export const getMockAvatarByName = (characterName: string): AvatarCharacter | null =>
  MOCK_AVATARS.find((a) => a.characterName === characterName) ?? null;

export const getMockAvatarById = (avatarId: string): { id: string; characterName: string; imageUrl: string } | null => {
  const avatar = MOCK_AVATARS.find((a) => a.id === avatarId);
  if (!avatar) return null;
  return { id: avatar.id, characterName: avatar.characterName, imageUrl: avatar.frames.normal };
};

export const getMockUniverses = (gender?: 'boy' | 'girl'): UniverseConfig[] => {
  if (!gender) return MOCK_UNIVERSES;
  return MOCK_UNIVERSES.filter((u) => u.gender === gender);
};

export const getMockStoriesForUniverse = (universeId: string): GeneratedStory[] =>
  MOCK_STORIES.filter((s) => s.universeId === universeId);

export const getMockPartsForStory = (storyId: string): StoryPart[] =>
  MOCK_PARTS.filter((p) => p.storyId === storyId);

export const getMockPartById = (partId: string): StoryPart | null =>
  MOCK_PARTS.find((p) => p.id === partId) ?? null;
