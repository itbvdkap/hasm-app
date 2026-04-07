import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Kiểm tra xem cấu hình có hợp lệ không trước khi khởi tạo
export const isConfigured = supabaseUrl !== '' && supabaseKey !== '';

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : (null as any);

if (!isConfigured) {
  console.warn('⚠️ HAMS PRO: Thiếu cấu hình Supabase. Vui lòng thiết lập biến môi trường trên Vercel.');
}
