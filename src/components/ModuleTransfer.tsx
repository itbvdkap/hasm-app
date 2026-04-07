import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  FileText, 
  User,
  X
} from 'lucide-react';

export const ModuleTransfer = ({ isAdmin, session, onRefresh, theme, isMobile }: any) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReq, setNewNewReq] = useState({ trangThietBiId: '', denKhoaPhongId: '', lyDo: '' });
  const [assets, setAssets] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [assetSearch, setAssetSearch] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
        let query = supabase.from('DieuChuyenTaiSan').select(`
            *,
            TrangThietBi(tenThietBi, maTaiSan),
            TuKhoa:tuKhoaPhongId(tenKhoaPhong),
            DenKhoa:denKhoaPhongId(tenKhoaPhong),
            NguoiYeuCau:nguoiYeuCauId(fullName)
        `);

        if (!isAdmin && session?.khoaPhongId) {
            query = query.or(`tuKhoaPhongId.eq.${session.khoaPhongId},denKhoaPhongId.eq.${session.khoaPhongId}`);
        }

        const { data, error } = await query.order('ngayYeuCau', { ascending: false });
        if (error) throw error;
        setRequests(data || []);
    } catch (e: any) {
        console.error('Lỗi tải danh sách điều chuyển:', e.message);
    } finally {
        setLoading(false);
    }
  }, [isAdmin, session]);

  useEffect(() => { 
    fetchRequests(); 
    // Pre-fetch depts and assets for creation
    supabase.from('KhoaPhong').select('id, tenKhoaPhong').then(({data}) => setDepts(data || []));
    supabase.from('TrangThietBi').select('id, tenThietBi, maTaiSan, khoaPhongId').eq('trangThai', 'ACTIVE').then(({data}) => setAssets(data || []));
  }, [fetchRequests]);

  const handleCreateRequest = async () => {
    try {
      if(!newReq.trangThietBiId || !newReq.denKhoaPhongId) return alert("Vui lòng chọn thiết bị và khoa đích!");
      
      const asset = assets.find(a => a.id === newReq.trangThietBiId);
      if(!asset) return;

      const payload = {
        trangThietBiId: newReq.trangThietBiId,
        tuKhoaPhongId: asset.khoaPhongId,
        denKhoaPhongId: newReq.denKhoaPhongId,
        nguoiYeuCauId: session.id,
        lyDo: newReq.lyDo,
        trangThai: 'CHO_DUYET',
        ngayYeuCau: new Date().toISOString()
      };

      const { error } = await supabase.from('DieuChuyenTaiSan').insert([payload]);
      if(error) throw error;

      alert("Gửi yêu cầu điều chuyển thành công!");
      setShowAddModal(false);
      setNewNewReq({ trangThietBiId: '', denKhoaPhongId: '', lyDo: '' });
      fetchRequests();
    } catch (e: any) { alert(e.message); }
  };

  const handleApprove = async (req: any) => {
    if(!window.confirm("Phê duyệt điều chuyển thiết bị này?")) return;
    try {
      const { error: err1 } = await supabase.from('DieuChuyenTaiSan').update({ 
        trangThai: 'DA_DUYET',
        nguoiPheDuyetId: session.id 
      }).eq('id', req.id);
      if(err1) throw err1;

      const { error: err2 } = await supabase.from('TrangThietBi').update({ 
        khoaPhongId: req.denKhoaPhongId 
      }).eq('id', req.trangThietBiId);
      if(err2) throw err2;

      alert("Đã duyệt điều chuyển!");
      fetchRequests();
      if (onRefresh) onRefresh();
    } catch (e: any) { alert(e.message); }
  };

  const handleReject = async (id: string) => {
    if(!window.confirm("Từ chối yêu cầu này?")) return;
    try {
        const { error } = await supabase.from('DieuChuyenTaiSan').update({ trangThai: 'TU_CHOI' }).eq('id', id);
        if(error) throw error;
        fetchRequests();
    } catch(e: any) { alert(e.message); }
  };

  const filteredAssets = assets.filter(a => 
    (a.tenThietBi || '').toLowerCase().includes(assetSearch.toLowerCase()) || 
    (a.maTaiSan || '').toLowerCase().includes(assetSearch.toLowerCase())
  );

  return (
    <div style={{...s.container, background: theme.bg, color: theme.text}}>
      <div style={s.header}>
        <div style={{flex: 1}}>
            <h1 style={{margin: 0, fontWeight: 800, fontSize: isMobile ? '1.5rem' : '2.2rem'}}>🚚 Điều chuyển Tài sản</h1>
            <p style={{color: theme.textMuted, marginTop: '0.5rem'}}>Quản lý luân chuyển thiết bị liên khoa và phê duyệt lệnh</p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{...s.addBtn, background: theme.primary}}>
            <Plus size={20} /> {!isMobile && 'Tạo yêu cầu mới'}
        </button>
      </div>

      <div style={s.grid(isMobile)}>
        {requests.map(r => (
          <div key={r.id} className="glass-card" style={{padding: '2rem', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '24px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
                <div style={s.statusBadge(r.trangThai, theme)}>
                    {r.trangThai === 'DA_DUYET' ? <CheckCircle2 size={14}/> : (r.trangThai === 'TU_CHOI' ? <XCircle size={14}/> : <Clock size={14}/>)}
                    {r.trangThai}
                </div>
                <div style={{fontSize: '0.8rem', color: theme.textMuted, display:'flex', alignItems:'center', gap: 5}}>
                    <Clock size={12}/> {new Date(r.ngayYeuCau).toLocaleDateString('vi-VN')}
                </div>
            </div>
            
            <h3 style={{margin: '0 0 0.5rem 0', fontWeight: 700, color: theme.text}}>{r.TrangThietBi?.tenThietBi}</h3>
            <div style={{color: theme.primary, fontWeight: 800, fontSize: '0.85rem', marginBottom: '1.5rem'}}>{r.TrangThietBi?.maTaiSan}</div>

            <div style={{...s.transferFlow, background: theme.bg, borderColor: theme.border}}>
                <div style={s.flowBox}>
                    <label style={{color: theme.textMuted}}>TỪ KHOA</label>
                    <div style={{color: theme.text}}>{r.TuKhoa?.tenKhoaPhong || '---'}</div>
                </div>
                <ArrowRight size={20} color={theme.primary} />
                <div style={s.flowBox}>
                    <label style={{color: theme.secondary}}>ĐẾN KHOA</label>
                    <div style={{color: theme.secondary}}>{r.DenKhoa?.tenKhoaPhong || '---'}</div>
                </div>
            </div>

            <div style={{marginTop: '1.5rem', fontSize: '0.85rem', color: theme.textMuted, background: theme.bg, padding: '1.25rem', borderRadius: '12px', border: `1px solid ${theme.border}`}}>
                <div style={{display:'flex', gap: 8, marginBottom: 8}}>
                    <FileText size={14} color={theme.primary}/>
                    <span style={{color: theme.text}}><b>Lý do:</b> {r.lyDo || 'Điều động phục vụ chuyên môn'}</span>
                </div>
                <div style={{display:'flex', gap: 8, fontSize: '0.75rem'}}>
                    <User size={14} color={theme.textMuted}/>
                    <span>Người yêu cầu: {r.NguoiYeuCau?.fullName || 'Hệ thống'}</span>
                </div>
            </div>

            {isAdmin && r.trangThai === 'CHO_DUYET' && (
                <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
                    <button onClick={() => handleApprove(r)} style={{...s.approveBtn, background: theme.secondary}}>Duyệt lệnh</button>
                    <button onClick={() => handleReject(r.id)} style={{...s.rejectBtn, borderColor: theme.danger, color: theme.danger}}>Từ chối</button>
                </div>
            )}
          </div>
        ))}
        {requests.length === 0 && !loading && <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '5rem', color: theme.textMuted}}>Chưa có yêu cầu điều chuyển nào.</div>}
        {loading && <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '5rem', color: theme.textMuted}}>Đang tải...</div>}
      </div>

      {/* CREATE MODAL */}
      {showAddModal && (
          <div style={s.overlay}>
              <div style={{...s.modal, background: theme.card}}>
                  <div style={{padding: '1.5rem', borderBottom: `1px solid ${theme.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <h3 style={{margin:0, color: theme.text}}>📦 Tạo lệnh điều chuyển</h3>
                      <button onClick={()=>setShowAddModal(false)} style={s.closeBtn}><X size={20}/></button>
                  </div>
                  <div style={{padding: '2rem'}}>
                      <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
                          <div>
                              <label style={s.label}>1. Chọn thiết bị cần chuyển</label>
                              <div style={{...s.searchBox, background: theme.bg, borderColor: theme.border, marginBottom: 10}}>
                                  <Search size={16} color={theme.textMuted}/>
                                  <input placeholder="Tìm theo tên hoặc mã..." style={{...s.searchInput, color: theme.text}} value={assetSearch} onChange={e=>setAssetSearch(e.target.value)} />
                              </div>
                              <select 
                                style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} 
                                value={newReq.trangThietBiId} 
                                onChange={e=>setNewNewReq({...newReq, trangThietBiId: e.target.value})}
                              >
                                  <option value="">-- Chọn máy trong danh sách --</option>
                                  {filteredAssets.slice(0, 50).map(a => (
                                      <option key={a.id} value={a.id}>[{a.maTaiSan}] {a.tenThietBi}</option>
                                  ))}
                              </select>
                          </div>

                          <div>
                              <label style={s.label}>2. Khoa/Phòng nhận</label>
                              <select 
                                style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} 
                                value={newReq.denKhoaPhongId} 
                                onChange={e=>setNewNewReq({...newReq, denKhoaPhongId: e.target.value})}
                              >
                                  <option value="">-- Chọn khoa đích --</option>
                                  {depts.map(d => (
                                      <option key={d.id} value={d.id}>{d.tenKhoaPhong}</option>
                                  ))}
                              </select>
                          </div>

                          <div>
                              <label style={s.label}>3. Lý do điều chuyển</label>
                              <textarea 
                                style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} 
                                rows={3} 
                                placeholder="Ghi rõ lý do bàn giao..." 
                                value={newReq.lyDo}
                                onChange={e=>setNewNewReq({...newReq, lyDo: e.target.value})}
                              />
                          </div>
                      </div>

                      <div style={{marginTop: '2.5rem', display:'flex', justifyContent:'flex-end', gap: '1rem'}}>
                          <button onClick={()=>setShowAddModal(false)} style={s.cancelBtn}>Hủy bỏ</button>
                          <button onClick={handleCreateRequest} style={{...s.saveBtn, background: theme.primary, padding:'0.8rem 2.5rem'}}>Gửi yêu cầu</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const s: any = {
  container: { padding: '2rem', minHeight: '100vh' },
  header: { marginBottom: '3.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap: 20 },
  grid: (isMob: boolean) => ({ display: 'grid', gridTemplateColumns: isMob ? '1fr' : 'repeat(auto-fill, minmax(450px, 1fr))', gap: '2.5rem' }),
  statusBadge: (st: string, t: any) => ({
    display:'flex', alignItems:'center', gap: 6,
    background: st === 'DA_DUYET' ? t.secondary+'15' : st === 'TU_CHOI' ? t.danger+'15' : t.warning+'15',
    color: st === 'DA_DUYET' ? t.secondary : st === 'TU_CHOI' ? t.danger : t.warning,
    padding: '6px 14px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase'
  }),
  transferFlow: { display: 'flex', alignItems: 'center', gap: '2rem', padding: '1.75rem', borderRadius: '20px', border: '1.5px solid' },
  flowBox: { flex: 1, display:'flex', flexDirection:'column', gap: 6, fontSize: '1rem', fontWeight: 700 },
  addBtn: { border: 'none', color: '#fff', padding: '0.8rem 1.5rem', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: '0.3s' },
  approveBtn: { flex: 1, border: 'none', color: '#fff', padding: '0.9rem', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', transition:'0.3s' },
  rejectBtn: { background: 'none', border: '1.5px solid', padding: '0.9rem 1.5rem', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', transition:'0.3s' },
  
  overlay: { position:'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 5000, padding: '2rem' },
  modal: { borderRadius: '32px', width: '100%', maxWidth: '600px', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', overflow:'hidden' },
  label: { fontSize: '0.85rem', fontWeight: 700, color: '#94A3B8', display:'block', marginBottom: 8 },
  input: { padding: '1rem', borderRadius: '14px', border: '1px solid', fontSize: '1rem', outline: 'none', width: '100%', boxSizing:'border-box' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 1rem', border: '1px solid', borderRadius: '12px' },
  searchInput: { border: 'none', outline: 'none', flex: 1, padding: '0.75rem 0', background: 'none' },
  cancelBtn: { padding: '1rem 2rem', border:'none', background:'none', color:'#94A3B8', fontWeight: 700, cursor:'pointer' },
  saveBtn: { border:'none', borderRadius: '14px', color:'#fff', fontWeight: 700, cursor:'pointer' },
  closeBtn: { background:'none', border:'none', cursor:'pointer', color:'#94A3B8' }
};