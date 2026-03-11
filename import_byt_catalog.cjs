const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('C:/Users/Admin/hams-app/.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);

async function importCatalog() {
    try {
        const workbook = XLSX.readFile('C:/Users/Admin/hams-app/files/dm_ttb.xlsx');
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        const deviceNames = [...new Set(data.map(item => item["TEN_TB"]))].filter(Boolean);
        
        const payload = deviceNames.map(name => ({
            tenThietBi: name,
            maThietBi: 'BYT-' + Math.random().toString(36).substr(2, 4).toUpperCase()
        }));

        // Sử dụng tên bảng chuẩn xác trong PostgREST
        const { error } = await supabase.from('DanhMucThietBi').upsert(payload, { onConflict: 'tenThietBi' });
        
        if (error) {
            console.error("Lỗi Supabase:", error);
            return;
        }
        console.log(`Đã nạp thành công 84 tên máy chuẩn BYT.`);
    } catch (e) {
        console.error("Lỗi:", e.message);
    }
}

importCatalog();
