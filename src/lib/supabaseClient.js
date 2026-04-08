// --- HAMS LOCAL & SUPABASE HYBRID ENGINE ---
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Kiểm tra có dùng Supabase thật không
export const isOnline = !!(supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://'));

// --- BỘ GIẢ LẬP LOCAL STORAGE (MOCK SUPABASE) ---
const localDB = {
  from: (table) => ({
    select: (query) => {
      const data = JSON.parse(localStorage.getItem(`hams_${table}`) || '[]');
      // Giả lập một số logic filter đơn giản nếu cần
      return Promise.resolve({ data, error: null, count: data.length });
    },
    upsert: (insertData, options) => {
      let current = JSON.parse(localStorage.getItem(`hams_${table}`) || '[]');
      const newData = Array.isArray(insertData) ? insertData : [insertData];
      
      newData.forEach(newItem => {
        const idx = current.findIndex(item => item.maTaiSan === newItem.maTaiSan || item.id === newItem.id);
        if (idx > -1) current[idx] = { ...current[idx], ...newItem };
        else current.push({ id: crypto.randomUUID(), ...newItem, createdAt: new Date().toISOString() });
      });
      
      localStorage.setItem(`hams_${table}`, JSON.stringify(current));
      return Promise.resolve({ data: current, error: null });
    },
    insert: (insertData) => localDB.from(table).upsert(insertData),
    update: (updateData) => ({
      in: (field, ids) => {
        let current = JSON.parse(localStorage.getItem(`hams_${table}`) || '[]');
        current = current.map(item => ids.includes(item[field]) ? { ...item, ...updateData } : item);
        localStorage.setItem(`hams_${table}`, JSON.stringify(current));
        return Promise.resolve({ error: null });
      }
    }),
    delete: () => ({
      eq: (field, val) => {
        let current = JSON.parse(localStorage.getItem(`hams_${table}`) || '[]');
        current = current.filter(item => item[field] !== val);
        localStorage.setItem(`hams_${table}`, JSON.stringify(current));
        return Promise.resolve({ error: null });
      }
    })
  })
};

export const isConfigured = true; // Luôn cho phép chạy local
export const supabase = isOnline ? createClient(supabaseUrl, supabaseKey) : localDB;

console.log(isOnline ? '🚀 HAMS đang chạy chế độ ONLINE (Supabase)' : '🏠 HAMS đang chạy chế độ LOCAL (Trình duyệt)');
