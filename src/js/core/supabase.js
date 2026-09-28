import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : {
      rpc: async () => ({ error: { message: 'Supabase no configurado' } }),
      from: () => ({
        insert: async () => ({ error: { message: 'Supabase no configurado' } }),
        select: async () => ({ error: { message: 'Supabase no configurado' } })
      })
    };
