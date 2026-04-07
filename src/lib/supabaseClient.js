// --- HAMS SUPABASE CLIENT CONFIG ---
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isConfigured = supabaseUrl !== '' && supabaseKey !== '';

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : (null as any);

if (!isConfigured) {
  console.warn('⚠️ HAMS PRO: Missing Supabase Config. Please check Vercel Env Vars.');
}
