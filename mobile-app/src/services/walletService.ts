import { supabase } from './supabase';
import { getCurrentUser } from './authService';
import type { Wallet } from '@/types';

export async function getWallet(): Promise<Wallet | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single();
  if (error || !data) return null;
  return data as Wallet;
}

export async function spendCredits(amount: number): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data: wallet } = await supabase
    .from('wallets')
    .select('credits, unlimited')
    .eq('user_id', user.id)
    .single();

  if (!wallet) return false;
  if (wallet.unlimited) return true;
  if (wallet.credits < amount) return false;

  const { error } = await supabase
    .from('wallets')
    .update({ credits: wallet.credits - amount, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (error) return false;

  await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'consumption',
    amount: -amount,
    metadata: {},
  });

  return true;
}

export async function addCredits(amount: number, type: 'grant' | 'purchase' = 'grant', productId?: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data: wallet } = await supabase
    .from('wallets')
    .select('credits')
    .eq('user_id', user.id)
    .single();

  if (!wallet) return false;

  const { error } = await supabase
    .from('wallets')
    .update({ credits: wallet.credits + amount, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (error) return false;

  await supabase.from('transactions').insert({
    user_id: user.id,
    type,
    amount,
    product_id: productId ?? null,
    metadata: {},
  });

  return true;
}

export async function syncCreditsToServer(credits: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await supabase
    .from('wallets')
    .update({ credits: Math.max(0, credits), updated_at: new Date().toISOString() })
    .eq('user_id', user.id);
}

export async function getUnlockedStoryIds(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await supabase
    .from('user_unlocked_stories')
    .select('story_id')
    .eq('user_id', user.id);
  return (data ?? []).map((r) => r.story_id);
}

export async function unlockStoryOnServer(storyId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await supabase
    .from('user_unlocked_stories')
    .upsert({ user_id: user.id, story_id: storyId }, { onConflict: 'user_id,story_id' });
}
