/**
 * Diagnostic Supabase: connecte a la base et affiche ce qui va / ce qui ne va pas.
 * Lancer depuis mobile-app: node scripts/check-supabase.mjs
 * Necessite: .env avec EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY (ou SUPABASE_URL / SUPABASE_ANON_KEY)
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = resolve(root, '.env');
if (existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function ok(msg) {
  console.log('[OK]', msg);
}
function fail(msg, detail = '') {
  console.log('[PAS OK]', msg, detail ? `- ${detail}` : '');
}
function section(title) {
  console.log('\n---', title, '---');
}

if (!url || !anonKey) {
  console.error('Manque SUPABASE_URL ou SUPABASE_ANON_KEY (ou EXPO_PUBLIC_*) dans .env');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function main() {
  console.log('Connexion a', url.replace(/https?:\/\//, '').split('.')[0] + '...');
  section('1. Connexion et table profiles');
  const { count: profilesCount, error: profilesError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  if (profilesError) {
    fail('Table profiles', profilesError.message);
  } else {
    ok('Table profiles accessible. Lignes: ' + (profilesCount ?? 0));
  }

  section('2. Tables content (avatars, universes)');
  const { count: avatarsCount, error: avatarsError } = await supabase
    .from('avatars')
    .select('*', { count: 'exact', head: true });
  if (avatarsError) {
    fail('Table avatars', avatarsError.message);
  } else {
    ok('Table avatars. Lignes: ' + (avatarsCount ?? 0));
  }

  const { count: universesCount, error: universesError } = await supabase
    .from('universes')
    .select('*', { count: 'exact', head: true });
  if (universesError) {
    fail('Table universes', universesError.message);
  } else {
    ok('Table universes. Lignes: ' + (universesCount ?? 0));
  }

  section('3. Tables story (story_paragraphs, narrative_choices, story_starts)');
  const tables = ['story_paragraphs', 'narrative_choices', 'story_starts'];
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) fail('Table ' + table, error.message);
    else ok(table + ': ' + (count ?? 0) + ' lignes');
  }

  section('4. Tables user (user_story_progress, user_choices, stars_transactions)');
  const userTables = ['user_story_progress', 'user_choices', 'stars_transactions'];
  for (const table of userTables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) fail('Table ' + table, error.message);
    else ok(table + ': ' + (count ?? 0) + ' lignes');
  }

  section('5. Auth (anon peut lire profiles)');
  const { data: sampleProfiles, error: sampleError } = await supabase
    .from('profiles')
    .select('id, email, stars_balance')
    .limit(3);
  if (sampleError) {
    fail('Lecture profiles (RLS ou droits)', sampleError.message);
  } else {
    ok('Lecture profiles reussie. Echantillon: ' + (sampleProfiles?.length ?? 0) + ' lignes');
  }

  section('6. Resume');
  const hasProfiles = !profilesError;
  const hasAvatars = !avatarsError;
  const hasUniverses = !universesError;
  if (hasProfiles && hasAvatars && hasUniverses) {
    ok('Schema principal pret (profiles, avatars, universes).');
  } else {
    if (!hasAvatars) fail('Creer la table avatars ou lancer les migrations content.');
    if (!hasUniverses) fail('Creer la table universes ou lancer les migrations content.');
    if (!hasProfiles) fail('Lancer la migration 001_profiles_auth.sql.');
  }
  console.log('');
}

main().catch((e) => {
  console.error('Erreur:', e.message);
  process.exit(1);
});
