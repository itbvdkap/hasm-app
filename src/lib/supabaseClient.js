// --- HAMS SUPABASE CLIENT CONFIG ---
import { createClient } from '@supabase/supabase-js'

// Tự động làm sạch URL và Key (loại bỏ khoảng trắng, xuống dòng dư thừa)
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseUrl = rawUrl.trim().replace(/\/$/, ''); // Xóa dấu gạch chéo ở cuối nếu có
const supabaseKey = rawKey.trim();

// Biến kiểm tra cấu hình hợp lệ
export const isConfigured = !!(supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://'));

// Khởi tạo Supabase an toàn
let supabaseInstance = null;

if (isConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.error('Lỗi khởi tạo Supabase:', e);
  }
}

export { supabaseUrl }; // Xuất URL để debug
export const supabase = supabaseInstance;
