import { createClient } from '@supabase/supabase-js';

const sanitizeUrl = (url: string | undefined) => {
  if (!url) return '';
  let sanitized = url.trim();
  if (!sanitized.startsWith('http')) {
    sanitized = `https://${sanitized}`;
  }
  // Remove trailing slashes and the /rest/v1 suffix if present
  return sanitized.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
};

// PRIORIDADE: Variáveis de ambiente. FALLBACK: Chaves fornecidas pelo usuário para o link compartilhado.
const supabaseUrl = sanitizeUrl(import.meta.env.VITE_SUPABASE_URL || 'https://zvmejucvpymbzvvjrxsw.supabase.co');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_uweQDQ3jXctUKBNxLIgmXg_fV1gm7zW').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.includes('supabase.co') &&
  !supabaseUrl.includes('rest/v1')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as any;
