// --- HAMS SUPABASE CLIENT CONFIG ---
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Biến kiểm tra cấu hình
export const isConfigured = !!(supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://'));

// Khởi tạo Supabase an toàn
let supabaseInstance = null;

if (isConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.error('Lỗi khởi tạo Supabase:', e);
  }
} else {
  console.warn('⚠️ HAMS PRO: Thiếu cấu hình Supabase hợp lệ.');
}

export const supabase = supabaseInstance;
