-- ============================================================
-- SuperStory — Seed Data
-- Avatars, Universes, Stories, and Story Parts
-- ============================================================

-- ─── AVATARS (10) ────────────────────────────────────────
insert into avatars (id, character_name, gender, frame_slug, display_order) values
  ('826577cc-d793-4738-9461-2b906bcf0caf', 'Milo Arachnide',  'boy',  'boy-webrunner', 1),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Luna Sylvestre',  'girl', 'girl-forest',   2),
  ('a3b4c5d6-1111-4aaa-b222-000000000003', 'Kai Tempête',     'boy',  'boy-webrunner', 3),
  ('a3b4c5d6-1111-4aaa-b222-000000000004', 'Aria Flamme',     'girl', 'girl-forest',   4),
  ('a3b4c5d6-1111-4aaa-b222-000000000005', 'Zack Galaxie',    'boy',  'boy-webrunner', 5),
  ('a3b4c5d6-1111-4aaa-b222-000000000006', 'Jade Mystère',    'girl', 'girl-forest',   6),
  ('a3b4c5d6-1111-4aaa-b222-000000000007', 'Ryo Samouraï',    'boy',  'boy-webrunner', 7),
  ('a3b4c5d6-1111-4aaa-b222-000000000008', 'Stella Cosmos',   'girl', 'girl-forest',   8),
  ('a3b4c5d6-1111-4aaa-b222-000000000009', 'Max Turbo',       'boy',  'boy-webrunner', 9),
  ('a3b4c5d6-1111-4aaa-b222-000000000010', 'Nina Étoile',     'girl', 'girl-forest',  10)
on conflict (id) do nothing;

-- ─── UNIVERSES (16) ──────────────────────────────────────
insert into universes (id, name, description, image_url, background_image_url, color, language, emoji, gender, display_order) values
  -- Boy universes (10)
  ('uni-01-shattered', 'The Shattered Dominion', 'A post-collapse steampunk world where ancient automatons roam ruined citadels and aether crystals are running out.', 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80', 'https://images.unsplash.com/photo-1536183922588-166604504d5e?w=1200&q=80', '#8B5E3C', 'en', '⚙️', 'boy', 1),
  ('uni-01b-neon', 'Neon Underground', 'A cyberpunk labyrinth of hacked networks and neon-lit tunnels beneath a megacity.', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', 'https://images.unsplash.com/photo-1515705576963-95cad62945b6?w=1200&q=80', '#7C4DFF', 'en', '💜', 'boy', 2),
  ('uni-02-forest', 'La Forêt Enchantée', 'Une forêt millénaire où chaque arbre murmure des secrets, habitée par des créatures lumineuses.', 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80', 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=1200&q=80', '#2E7D32', 'fr', '🌳', 'boy', 3),
  ('uni-02b-moonlight', 'Le Lac de Lune', E'Un lac mystique où l''eau reflète un ciel d''étoiles inconnues et des créatures de lumière dansent à la surface.', 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&q=80', 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=1200&q=80', '#283593', 'fr', '🌙', 'boy', 4),
  ('uni-03-ocean', E'Les Abysses d''Azur', E'Un royaume sous-marin de cités de corail et de courants magiques, menacé par une obscurité montante.', 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800&q=80', 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1200&q=80', '#0277BD', 'fr', '🌊', 'boy', 5),
  ('uni-03b-storm', E'L''Archipel des Tempêtes', 'Des îles volantes battues par des orages perpétuels, où la foudre est une ressource précieuse.', 'https://images.unsplash.com/photo-1429552077091-836152271555?w=800&q=80', 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=1200&q=80', '#01579B', 'fr', '⛈️', 'boy', 6),
  ('uni-05-space', 'Station Orion', 'A space station at the edge of known space, where alien diplomacy and cosmic mysteries collide.', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&q=80', '#1A237E', 'en', '🚀', 'boy', 7),
  ('uni-05b-asteroid', 'The Asteroid Belt', 'A lawless mining frontier among drifting rocks, where fortune and danger orbit each other.', 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&q=80', 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&q=80', '#4A148C', 'en', '☄️', 'boy', 8),
  ('uni-07-samurai', 'Le Royaume des Cerisiers', E'Un Japon féodal fantastique où les esprits ancestraux guident les guerriers à travers des épreuves d''honneur.', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80', 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1200&q=80', '#C62828', 'fr', '⛩️', 'boy', 9),
  ('uni-09-racing', 'Circuit Infini', 'A neon-lit futuristic city where hover-racers compete in deadly circuits for glory and freedom.', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&q=80', '#00E676', 'en', '🏎️', 'boy', 10),
  -- Girl universes (6)
  ('uni-04-volcano', 'Le Cratère Ardent', E'Un monde volcanique où les dragons forgent des alliances et la lave cache d''anciens trésors.', 'https://images.unsplash.com/photo-1462275646964-a0e3c11f18a6?w=800&q=80', 'https://images.unsplash.com/photo-1500534623283-312aade40907?w=1200&q=80', '#D84315', 'fr', '🌋', 'girl', 11),
  ('uni-06-detective', 'Les Ruelles de Minuit', 'Une ville brumeuse des années 1920 où chaque ombre cache un indice et chaque passant un secret.', 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&q=80', 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=1200&q=80', '#37474F', 'fr', '🔍', 'girl', 12),
  ('uni-07b-shadow', 'Le Temple des Ombres', 'Un monastère perdu dans les montagnes brumeuses, gardé par des ninjas spectraux et des énigmes mortelles.', 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80', 'https://images.unsplash.com/photo-1513569536235-bf4c0834e7e0?w=1200&q=80', '#212121', 'fr', '🥷', 'girl', 13),
  ('uni-08-fairy', 'Le Jardin des Fées', 'Un monde miniature caché dans un jardin secret, peuplé de fées artisanes et de fleurs pensantes.', 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=800&q=80', 'https://images.unsplash.com/photo-1518882327030-2c6bca22cba8?w=1200&q=80', '#AB47BC', 'fr', '🧚', 'girl', 14),
  ('uni-10-circus', 'Le Cirque des Songes', E'Un cirque itinérant magique où chaque numéro ouvre une porte vers un rêve — ou un cauchemar.', 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800&q=80', 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&q=80', '#FF6F00', 'fr', '🎪', 'girl', 15),
  ('uni-10b-stars', 'La Scène Céleste', 'Un théâtre flottant parmi les constellations, où les spectacles réécrivent la réalité.', 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=800&q=80', 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&q=80', '#F50057', 'fr', '🌟', 'girl', 16)
on conflict (id) do nothing;

-- ─── STORIES (1 per universe = 16) ───────────────────────
-- credits_required: 0 for every 3rd, 3 for the rest
insert into stories (id, universe_id, title, synopsis, theme, image_url, credits_required, total_parts, status) values
  ('story-uni-01-shattered',  'uni-01-shattered',  'The Shattered Dominion — Chapter One',  'An adventure awaits in The Shattered Dominion: A post-collapse steampunk world where ancient aut...', 'sci-fi',  'https://picsum.photos/seed/story-uni-01-shattered/512/512',  0, 3, 'complete'),
  ('story-uni-01b-neon',      'uni-01b-neon',      'Neon Underground — Chapter One',        'An adventure awaits in Neon Underground: A cyberpunk labyrinth of hacked networks and neon-lit ...', 'sci-fi',  'https://picsum.photos/seed/story-uni-01b-neon/512/512',      3, 3, 'complete'),
  ('story-uni-02-forest',     'uni-02-forest',     'La Forêt Enchantée — Chapter One',      'An adventure awaits in La Forêt Enchantée: Une forêt millénaire où chaque arbre murmure des sec...', 'fantasy', 'https://picsum.photos/seed/story-uni-02-forest/512/512',     3, 3, 'complete'),
  ('story-uni-02b-moonlight', 'uni-02b-moonlight', 'Le Lac de Lune — Chapter One',          'An adventure awaits in Le Lac de Lune: Un lac mystique où l''eau reflète un ciel d''étoiles inco...', 'fantasy', 'https://picsum.photos/seed/story-uni-02b-moonlight/512/512', 0, 3, 'complete'),
  ('story-uni-03-ocean',      'uni-03-ocean',      'Les Abysses d''Azur — Chapter One',     'An adventure awaits in Les Abysses d''Azur: Un royaume sous-marin de cités de corail et de cour...', 'fantasy', 'https://picsum.photos/seed/story-uni-03-ocean/512/512',      3, 3, 'complete'),
  ('story-uni-03b-storm',     'uni-03b-storm',     'L''Archipel des Tempêtes — Chapter One', 'An adventure awaits in L''Archipel des Tempêtes: Des îles volantes battues par des orages perpé...', 'fantasy', 'https://picsum.photos/seed/story-uni-03b-storm/512/512',     3, 3, 'complete'),
  ('story-uni-05-space',      'uni-05-space',      'Station Orion — Chapter One',           'An adventure awaits in Station Orion: A space station at the edge of known space, where alien d...', 'sci-fi',  'https://picsum.photos/seed/story-uni-05-space/512/512',      0, 3, 'complete'),
  ('story-uni-05b-asteroid',  'uni-05b-asteroid',  'The Asteroid Belt — Chapter One',       'An adventure awaits in The Asteroid Belt: A lawless mining frontier among drifting rocks, where ...', 'sci-fi',  'https://picsum.photos/seed/story-uni-05b-asteroid/512/512',  3, 3, 'complete'),
  ('story-uni-07-samurai',    'uni-07-samurai',    'Le Royaume des Cerisiers — Chapter One', 'An adventure awaits in Le Royaume des Cerisiers: Un Japon féodal fantastique où les esprits anc...', 'fantasy', 'https://picsum.photos/seed/story-uni-07-samurai/512/512',    3, 3, 'complete'),
  ('story-uni-09-racing',     'uni-09-racing',     'Circuit Infini — Chapter One',          'An adventure awaits in Circuit Infini: A neon-lit futuristic city where hover-racers compete in...', 'sci-fi',  'https://picsum.photos/seed/story-uni-09-racing/512/512',     0, 3, 'complete'),
  ('story-uni-04-volcano',    'uni-04-volcano',    'Le Cratère Ardent — Chapter One',       'An adventure awaits in Le Cratère Ardent: Un monde volcanique où les dragons forgent des allian...', 'fantasy', 'https://picsum.photos/seed/story-uni-04-volcano/512/512',    3, 3, 'complete'),
  ('story-uni-06-detective',  'uni-06-detective',  'Les Ruelles de Minuit — Chapter One',   'An adventure awaits in Les Ruelles de Minuit: Une ville brumeuse des années 1920 où chaque ombr...', 'fantasy', 'https://picsum.photos/seed/story-uni-06-detective/512/512',  3, 3, 'complete'),
  ('story-uni-07b-shadow',    'uni-07b-shadow',    'Le Temple des Ombres — Chapter One',    'An adventure awaits in Le Temple des Ombres: Un monastère perdu dans les montagnes brumeuses, g...', 'fantasy', 'https://picsum.photos/seed/story-uni-07b-shadow/512/512',    0, 3, 'complete'),
  ('story-uni-08-fairy',      'uni-08-fairy',      'Le Jardin des Fées — Chapter One',      'An adventure awaits in Le Jardin des Fées: Un monde miniature caché dans un jardin secret, peup...', 'fantasy', 'https://picsum.photos/seed/story-uni-08-fairy/512/512',      3, 3, 'complete'),
  ('story-uni-10-circus',     'uni-10-circus',     'Le Cirque des Songes — Chapter One',    'An adventure awaits in Le Cirque des Songes: Un cirque itinérant magique où chaque numéro ouvre...', 'fantasy', 'https://picsum.photos/seed/story-uni-10-circus/512/512',     3, 3, 'complete'),
  ('story-uni-10b-stars',     'uni-10b-stars',     'La Scène Céleste — Chapter One',        'An adventure awaits in La Scène Céleste: Un théâtre flottant parmi les constellations, où les s...', 'fantasy', 'https://picsum.photos/seed/story-uni-10b-stars/512/512',     0, 3, 'complete')
on conflict (id) do nothing;

-- ─── STORY PARTS (3 per story = 48) ─────────────────────
-- Using a DO block to avoid repeating the long narrative texts for each universe.
-- Each story gets: opening (part 1), middle (part 2), ending (part 3).

do $$
declare
  s record;
  u record;
  p1_id text;
  p2_id text;
  p3_id text;
  opening_text text := 'The adventure begins in %s. Something extraordinary is about to happen — a signal, a whisper, a tremor in the fabric of this world. You feel it before you see it. The air shifts. Colors brighten. Every sense tells you: this is the moment everything changes. Behind you, the familiar world fades. Ahead, the unknown beckons with a promise that feels both terrifying and irresistible. You check what you have: courage, curiosity, and the unshakable feeling that you were meant to be here, right now, at this exact crossroads.';
  middle_text text := 'The path narrows. What seemed simple reveals layers of complexity. An obstacle stands between you and your goal — not just physical, but a choice that will define who you are in this world. The stakes have risen. Time presses. Two paths forward, each with its own risks and rewards. There is no safe option — only the one that feels right.';
  ending_text text := 'Against all odds, you made it. The heart of %s reveals its deepest secret — not a treasure in the traditional sense, but something far more valuable: a truth that changes how you see the world. The journey reshaped you. You carry something new: knowledge, a bond, a spark that wasn''t there before. This was only the beginning.';
begin
  for s in select id, universe_id, title from stories loop
    select name into u from universes where id = s.universe_id;

    p1_id := s.id || '-p1';
    p2_id := s.id || '-p2';
    p3_id := s.id || '-p3';

    insert into story_parts (id, story_id, universe_id, part_number, is_opening, is_ending, title, narrative_text, mood, choices, image_url, status)
    values (
      p1_id, s.id, s.universe_id, 1, true, false,
      s.title,
      format(opening_text, u.name),
      'tense and mysterious',
      jsonb_build_array(
        jsonb_build_object('id', p1_id || '-ca', 'label', 'Plonger dans l''inconnu', 'description', 'Pas le temps d''hésiter — fonce avant que le moment ne passe.', 'leadsToPartId', p2_id),
        jsonb_build_object('id', p1_id || '-cb', 'label', 'Observer d''abord', 'description', 'Mieux vaut comprendre avant d''agir.', 'leadsToPartId', p2_id)
      ),
      'https://picsum.photos/seed/' || s.id || '-opening/512/512',
      'generated'
    ) on conflict (id) do nothing;

    insert into story_parts (id, story_id, universe_id, part_number, is_opening, is_ending, title, narrative_text, mood, choices, image_url, status)
    values (
      p2_id, s.id, s.universe_id, 2, false, false,
      'The Turning Point',
      middle_text,
      'desperate and urgent',
      jsonb_build_array(
        jsonb_build_object('id', p2_id || '-ca', 'label', 'Prendre le risque', 'description', 'Les grandes récompenses demandent du courage.', 'leadsToPartId', p3_id),
        jsonb_build_object('id', p2_id || '-cb', 'label', 'Trouver un autre chemin', 'description', 'La ruse peut être plus puissante que la force.', 'leadsToPartId', p3_id)
      ),
      'https://picsum.photos/seed/' || s.id || '-middle/512/512',
      'generated'
    ) on conflict (id) do nothing;

    insert into story_parts (id, story_id, universe_id, part_number, is_opening, is_ending, title, narrative_text, mood, choices, image_url, status)
    values (
      p3_id, s.id, s.universe_id, 3, false, true,
      'What Was Found',
      format(ending_text, u.name),
      'revelatory and quietly hopeful',
      '[]'::jsonb,
      'https://picsum.photos/seed/' || s.id || '-ending/512/512',
      'generated'
    ) on conflict (id) do nothing;
  end loop;
end;
$$;
