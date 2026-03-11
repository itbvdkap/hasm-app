import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export const ModuleMaintenance = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [updateData, setUpdateData] = useState({
    noiDungChiTiet: '',
    chiPhi: 0,
    nguoiThucHien: '',
    ketQua: 'SUCCESS'
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('LichBaoTri')
      .select('*, TrangThietBi(tenThietBi, maTaiSan, KhoaPhong(tenKhoaPhong))')
      .order('ngayDuKien', { ascending: true });
    setTickets(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleUpdate = async () => {
    try {
      // 1. Cập nhật trạng thái lịch bảo trì
      await supabase.from('LichBaoTri').update({ 
        trangThai: 'DONE',
        noiDung: updateData.noiDungChiTiet
      }).eq('id', selectedTicket.id);

      // 2. Thêm vào lịch sử sửa chữa chi tiết
      await supabase.from('SuaChuaChiTiet').insert([{
        trangThietBiId: selectedTicket.trangThietBiId,
        noiDungChiTiet: updateData.noiDungChiTiet,
        chiPhi: updateData.chiPhi,
        nguoiThucHien: updateData.nguoiThucHien,
        ketQua: updateData.ketQua
      }]);

      // 3. Cập nhật trạng thái thiết bị sang ACTIVE
      await supabase.from('TrangThietBi').update({ trangThai: 'ACTIVE' }).eq('id', selectedTicket.trangThietBiId);

      alert("Đã cập nhật tiến độ bảo trì thành công!");
      setSelectedTicket(null);
      fetchTickets();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div style={css.container}>
      <div style={css.header}>
        <h1 style={{margin: 0}}>🔧 Điều phối Bảo trì & Sửa chữa</h1>
        <p style={{color: '#64748b', marginTop: 5}}>Quản lý danh sách các phiếu yêu cầu kỹ thuật</p>
      </div>

      <div style={css.grid}>
        {tickets.map(t => (
          <div key={t.id} style={css.card}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 15}}>
                <span style={css.dateTag}>{new Date(t.ngayDuKien).toLocaleDateString('vi-VN')}</span>
                <span style={css.statusBadge(t.trangThai)}>{t.trangThai}</span>
            </div>
            <h3 style={{margin: '0 0 5px 0', color: '#fff'}}>{t.TrangThietBi?.tenThietBi}</h3>
            <div style={{fontSize: 12, color: '#3b82f6', fontWeight: 'bold', marginBottom: 10}}>{t.TrangThietBi?.maTaiSan}</div>
            <div style={{fontSize: 13, color: '#94a3b8'}}>📍 {t.TrangThietBi?.KhoaPhong?.tenKhoaPhong}</div>
            <div style={{fontSize: 13, color: '#e2e8f0', marginTop: 10, background: '#06090f', padding: 10, borderRadius: 8}}>
                💬 {t.noiDung || 'Bảo trì định kỳ'}
            </div>
            
            {t.trangThai === 'PENDING' && (
                <button onClick={() => setSelectedTicket(t)} style={css.actionBtn}>Cập nhật tiến độ</button>
            )}
          </div>
        ))}
      </div>

      {selectedTicket && (
        <div style={css.modalOverlay}>
          <div style={css.modalContent}>
            <h3>📝 Cập nhật kết quả xử lý</h3>
            <p style={{fontSize: 13, color: '#94a3b8'}}>{selectedTicket.TrangThietBi?.tenThietBi}</p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: 15, marginTop: 20}}>
                <div>
                    <label style={css.label}>Nội dung đã thực hiện</label>
                    <textarea style={css.input} rows={3} onChange={e => setUpdateData({...updateData, noiDungChiTiet: e.target.value})} />
                </div>
                <div>
                    <label style={css.label}>Người thực hiện / Đơn vị</label>
                    <input style={css.input} onChange={e => setUpdateData({...updateData, nguoiThucHien: e.target.value})} />
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15}}>
                    <div>
                        <label style={css.label}>Chi phí phát sinh (đ)</label>
                        <input type="number" style={css.input} onChange={e => setUpdateData({...updateData, chiPhi: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label style={css.label}>Kết quả</label>
                        <select style={css.input} onChange={e => setUpdateData({...updateData, ketQua: e.target.value})}>
                            <option value="SUCCESS">Thành công / Hoạt động tốt</option>
                            <option value="PARTIAL">Hoạt động tạm thời</option>
                            <option value="FAILED">Thất bại / Chờ linh kiện</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{marginTop: 30, textAlign: 'right'}}>
                <button onClick={() => setSelectedTicket(null)} style={{background: 'none', border: 'none', color: '#64748b', marginRight: 20}}>Huỷ</button>
                <button onClick={handleUpdate} style={css.saveBtn}>Xác nhận hoàn thành</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const css: any = {
  container: { padding: '20px' },
  header: { marginBottom: 30 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 },
  card: { background: '#111d2e', padding: 25, borderRadius: 20, border: '1px solid #1a2840' },
  dateTag: { background: '#3b82f620', color: '#3b82f6', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 'bold' },
  statusBadge: (s: string) => ({
    background: s === 'DONE' ? '#22c55e20' : '#f59e0b20',
    color: s === 'DONE' ? '#22c55e' : '#f59e0b',
    padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 'bold'
  }),
  actionBtn: { width: '100%', marginTop: 20, background: '#00d4a8', color: '#000', border: 'none', padding: '12px', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: '#0d1520', padding: 35, borderRadius: 24, width: 500, border: '1px solid #1a2840' },
  label: { fontSize: 12, color: '#64748b', marginBottom: 5, display: 'block' },
  input: { width: '100%', padding: '12px', background: '#111d2e', border: '1px solid #1a2840', color: '#fff', borderRadius: 10, outline: 'none', boxSizing: 'border-box' },
  saveBtn: { background: '#00d4a8', color: '#000', border: 'none', padding: '12px 25px', borderRadius: 10, fontWeight: 'bold' }
};