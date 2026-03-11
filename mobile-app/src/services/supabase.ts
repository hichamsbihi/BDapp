/**
 * Re-export Supabase client from lib so existing imports continue to work.
 * Configuration lives in lib/supabaseClient.ts (env: SUPABASE_URL, SUPABASE_ANON_KEY).
 */
export { supabase } from '../../lib/supabaseClient';
