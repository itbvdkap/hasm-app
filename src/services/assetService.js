import { supabase } from '../lib/supabase'

export const assetService = {
  // Lấy toàn bộ danh sách tài sản kèm thông tin liên quan
  getAllAssets: async () => {
    const { data, error } = await supabase
      .from('TrangThietBi')
      .select(`
        *,
        KhoaPhong ( tenKhoaPhong ),
        HangSanXuat ( tenHangSanXuat )
      `)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error("Lỗi lấy danh sách tài sản:", error.message);
      throw error;
    }
    return data;
  },

  // Cập nhật trạng thái thiết bị (ví dụ: báo hỏng)
  updateStatus: async (assetId, newStatus) => {
    const { data, error } = await supabase
      .from('TrangThietBi')
      .update({ trangThai: newStatus })
      .eq('id', assetId);
    
    if (error) throw error;
    return data;
  }
}