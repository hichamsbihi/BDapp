/**
 * Supabase connection and auth test helpers.
 * Use these to verify database and auth from the app or a script.
 */

import { supabase } from './supabaseClient';

/**
 * STEP 4 — Connection test: fetch rows from `profiles` to verify DB connection.
 * Handles errors and returns a result object.
 */
export async function testConnection(): Promise<{
  ok: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, count: count ?? 0 };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

/**
 * STEP 5 — Authentication test: sign in with email and password.
 * Returns user and session on success.
 */
export async function testAuthSignIn(
  email: string,
  password: string
): Promise<{
  ok: boolean;
  user?: { id: string; email?: string };
  session?: object;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return {
      ok: true,
      user: data.user
        ? { id: data.user.id, email: data.user.email ?? undefined }
        : undefined,
      session: data.session ? { expiresAt: data.session.expires_at } : undefined,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
