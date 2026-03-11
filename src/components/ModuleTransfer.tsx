import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export const ModuleTransfer = ({ isAdmin, session, onRefresh }: any) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('DieuChuyenTaiSan')
      .select(`
        *,
        TrangThietBi(tenThietBi, maTaiSan),
        TuKhoa:tuKhoaPhongId(tenKhoaPhong),
        DenKhoa:denKhoaPhongId(tenKhoaPhong),
        NguoiYeuCau:nguoiYeuCauId(fullName)
      `)
      .order('ngayYeuCau', { ascending: false });

    if (!isAdmin) {
        query = query.or(`tuKhoaPhongId.eq.${session.khoaPhongId},denKhoaPhongId.eq.${session.khoaPhongId}`);
    }

    const { data } = await query;
    setRequests(data || []);
    setLoading(false);
  }, [isAdmin, session]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (req: any) => {
    try {
      // 1. Cập nhật trạng thái phiếu sang DA_DUYET
      await supabase.from('DieuChuyenTaiSan').update({ 
        trangThai: 'DA_DUYET',
        nguoiPheDuyetId: session.id 
      }).eq('id', req.id);

      // 2. Cập nhật khoa phòng mới cho thiết bị
      await supabase.from('TrangThietBi').update({ 
        khoaPhongId: req.denKhoaPhongId 
      }).eq('id', req.trangThietBiId);

      alert("Phê duyệt điều chuyển thành công!");
      fetchRequests();
      if (onRefresh) onRefresh();
    } catch (e: any) { alert(e.message); }
  };

  const handleReject = async (id: string) => {
    if(!confirm("Từ chối yêu cầu này?")) return;
    await supabase.from('DieuChuyenTaiSan').update({ trangThai: 'TU_CHOI' }).eq('id', id);
    fetchRequests();
  };

  return (
    <div style={css.container}>
      <div style={css.header}>
        <h1 style={{margin: 0}}>🚚 Quản lý Điều chuyển Tài sản</h1>
        <p style={{color: '#64748b', marginTop: 5}}>Theo dõi luồng luân chuyển thiết bị giữa các khoa phòng</p>
      </div>

      <div style={css.list}>
        {requests.map(r => (
          <div key={r.id} style={css.card}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 15}}>
                <span style={css.statusBadge(r.trangThai)}>{r.trangThai}</span>
                <span style={{fontSize: 12, color: '#64748b'}}>{new Date(r.ngayYeuCau).toLocaleDateString('vi-VN')}</span>
            </div>
            
            <h3 style={{margin: '0 0 10px 0', color: '#fff'}}>{r.TrangThietBi?.tenThietBi}</h3>
            <div style={{color: '#3b82f6', fontWeight: 'bold', fontSize: 13, marginBottom: 15}}>{r.TrangThietBi?.maTaiSan}</div>

            <div style={css.transferFlow}>
                <div style={css.flowBox}>
                    <label>TỪ KHOA</label>
                    <div>{r.TuKhoa?.tenKhoaPhong}</div>
                </div>
                <div style={{fontSize: 20}}>➡️</div>
                <div style={css.flowBox}>
                    <label style={{color: '#00d4a8'}}>ĐẾN KHOA</label>
                    <div style={{color: '#00d4a8'}}>{r.DenKhoa?.tenKhoaPhong}</div>
                </div>
            </div>

            <div style={{marginTop: 15, fontSize: 13, color: '#94a3b8', background: '#06090f', padding: 10, borderRadius: 8}}>
                📝 Lý do: {r.lyReason || 'Điều động phục vụ chuyên môn'}
                <div style={{marginTop: 5, fontSize: 11, color: '#64748b'}}>Người yêu cầu: {r.NguoiYeuCau?.fullName}</div>
            </div>

            {isAdmin && r.trangThai === 'CHO_DUYET' && (
                <div style={{display: 'flex', gap: 10, marginTop: 20}}>
                    <button onClick={() => handleApprove(r)} style={css.approveBtn}>Phê duyệt</button>
                    <button onClick={() => handleReject(r.id)} style={css.rejectBtn}>Từ chối</button>
                </div>
            )}
          </div>
        ))}
        {requests.length === 0 && <p style={{textAlign: 'center', color: '#64748b', width: '100%'}}>Chưa có yêu cầu điều chuyển nào.</p>}
      </div>
    </div>
  );
};

const css: any = {
  container: { padding: '20px' },
  header: { marginBottom: 30 },
  list: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 },
  card: { background: '#111d2e', padding: 25, borderRadius: 20, border: '1px solid #1a2840' },
  statusBadge: (s: string) => ({
    background: s === 'DA_DUYET' ? '#22c55e20' : s === 'TU_CHOI' ? '#ef444420' : '#f59e0b20',
    color: s === 'DA_DUYET' ? '#22c55e' : s === 'TU_CHOI' ? '#ef4444' : '#f59e0b',
    padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 'bold'
  }),
  transferFlow: { display: 'flex', alignItems: 'center', gap: 15, background: '#06090f', padding: '15px', borderRadius: 12 },
  flowBox: { flex: 1, label: { fontSize: 10, color: '#64748b', display: 'block', marginBottom: 5 }, fontSize: 13, fontWeight: 'bold' },
  approveBtn: { flex: 1, background: '#00d4a8', color: '#000', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' },
  rejectBtn: { background: 'none', color: '#ef4444', border: '1px solid #ef4444', padding: '10px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }
};