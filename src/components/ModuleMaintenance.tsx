import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  User,
  MapPin,
  Calendar
} from 'lucide-react';

export const ModuleMaintenance = ({ theme, isMobile }: any) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [updateData, setUpdateData] = useState({ 
    noiDungChiTiet: '', 
    chiPhi: 0, 
    nguoiThucHien: '', 
    ketQua: 'SUCCESS',
    newStatus: 'DONE'
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('LichBaoTri').select('*, TrangThietBi(tenThietBi, maTaiSan, KhoaPhong(tenKhoaPhong))').order('ngayDuKien', { ascending: true });
    setTickets(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleUpdate = async () => {
    try {
      await supabase.from('LichBaoTri').update({ 
          trangThai: updateData.newStatus, 
          noiDung: updateData.noiDungChiTiet 
      }).eq('id', selectedTicket.id);
      
      if (updateData.newStatus === 'DONE') {
          await supabase.from('SuaChuaChiTiet').insert([{
            trangThietBiId: selectedTicket.trangThietBiId, 
            noiDungChiTiet: updateData.noiDungChiTiet,
            chiPhi: updateData.chiPhi, 
            nguoiThucHien: updateData.nguoiThucHien, 
            ketQua: updateData.ketQua
          }]);
          await supabase.from('TrangThietBi').update({ trangThai: 'ACTIVE' }).eq('id', selectedTicket.trangThietBiId);
      } else if (updateData.newStatus === 'PROCESSING') {
          await supabase.from('TrangThietBi').update({ trangThai: 'BROKEN' }).eq('id', selectedTicket.trangThietBiId);
      }

      alert("Cập nhật thành công!"); setSelectedTicket(null); fetchTickets();
    } catch (e: any) { alert(e.message); }
  };

  const filteredTickets = tickets.filter(t => filterStatus === 'ALL' || t.trangThai === filterStatus);

  return (
    <div style={{...s.container, background: theme.bg, color: theme.text}}>
      <div style={s.header}>
        <div style={{flex: 1}}>
            <h1 style={{margin: 0, fontWeight: 800, fontSize: isMobile ? '1.5rem' : '2rem', color: theme.text}}>🔧 Điều phối kỹ thuật</h1>
            <p style={{color: theme.textMuted, marginTop: '0.5rem'}}>Quản lý và cập nhật tiến độ bảo trì thiết bị y tế</p>
        </div>
        
        <div style={{display:'flex', gap: 10, marginTop: isMobile ? '1rem' : 0}}>
            <FilterBtn label="Tất cả" active={filterStatus==='ALL'} onClick={()=>setFilterStatus('ALL')} theme={theme} />
            <FilterBtn label="Đang chờ" active={filterStatus==='PENDING'} onClick={()=>setFilterStatus('PENDING')} theme={theme} />
            <FilterBtn label="Đang sửa" active={filterStatus==='PROCESSING'} onClick={()=>setFilterStatus('PROCESSING')} theme={theme} />
            <FilterBtn label="Hoàn thành" active={filterStatus==='DONE'} onClick={()=>setFilterStatus('DONE')} theme={theme} />
        </div>
      </div>

      <div style={s.grid(isMobile)}>
        {filteredTickets.map(t => (
          <div key={t.id} className="glass-card" style={{padding: '1.5rem', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
                <div style={s.statusBadge(t.trangThai, theme)}>
                    {t.trangThai === 'DONE' ? <CheckCircle2 size={14}/> : <Clock size={14}/>}
                    {t.trangThai === 'PENDING' ? 'Đang chờ' : (t.trangThai === 'PROCESSING' ? 'Đang sửa' : 'Hoàn thành')}
                </div>
                <div style={{fontSize: '0.8rem', color: theme.textMuted, display:'flex', alignItems:'center', gap: 5}}>
                    <Calendar size={12}/> {new Date(t.ngayDuKien).toLocaleDateString('vi-VN')}
                </div>
            </div>
            
            <h3 style={{margin: '0 0 0.5rem 0', fontWeight: 700, color: theme.text}}>{t.TrangThietBi?.tenThietBi}</h3>
            <div style={{color: theme.primary, fontWeight: 800, fontSize: '0.85rem', marginBottom: '1rem'}}>{t.TrangThietBi?.maTaiSan}</div>
            
            <div style={{display:'flex', flexDirection:'column', gap: '0.5rem', fontSize: '0.85rem', color: theme.textMuted}}>
                <div style={{display:'flex', alignItems:'center', gap: 8}}><MapPin size={14}/> {t.TrangThietBi?.KhoaPhong?.tenKhoaPhong}</div>
                <div style={{display:'flex', alignItems:'center', gap: 8, color: theme.text}}><AlertCircle size={14}/> {t.noiDung || 'Bảo trì định kỳ'}</div>
            </div>

            {t.trangThai !== 'DONE' && (
                <button onClick={() => {
                    setUpdateData({ 
                        noiDungChiTiet: t.noiDung || '', 
                        chiPhi: 0, 
                        nguoiThucHien: '', 
                        ketQua: 'SUCCESS',
                        newStatus: t.trangThai === 'PENDING' ? 'PROCESSING' : 'DONE'
                    });
                    setSelectedTicket(t);
                }} className="cta-button" style={{width:'100%', marginTop: '1.5rem', background: theme.primary, color: '#fff', padding: '0.75rem', borderRadius: '0.75rem', border: 'none', fontWeight: 700, cursor:'pointer'}}>
                    Cập nhật tiến độ <ChevronRight size={16}/>
                </button>
            )}
          </div>
        ))}
      </div>

      {selectedTicket && (
        <div style={s.overlay}><div style={{...s.modal, background: theme.card, border: `1px solid ${theme.border}`}}>
            <h3 style={{marginTop: 0, fontWeight: 800, color: theme.text}}>📝 Cập nhật xử lý</h3>
            <div style={{display:'flex', flexDirection:'column', gap: '1.25rem', marginTop: '1.5rem'}}>
                <div>
                    <label style={{...s.label, color: theme.textMuted}}>Trạng thái mới</label>
                    <select style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={updateData.newStatus} onChange={e=>setUpdateData({...updateData, newStatus: e.target.value})}>
                        <option value="PROCESSING">Đang sửa chữa (Processing)</option>
                        <option value="DONE">Đã hoàn thành (Done)</option>
                    </select>
                </div>

                <textarea style={{...s.input, background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`}} rows={3} placeholder="Nội dung công việc..." value={updateData.noiDungChiTiet} onChange={e=>setUpdateData({...updateData, noiDungChiTiet: e.target.value})} />
                
                <input style={{...s.input, background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`}} placeholder="Người thực hiện" value={updateData.nguoiThucHien} onChange={e=>setUpdateData({...updateData, nguoiThucHien: e.target.value})} />
                
                {updateData.newStatus === 'DONE' && (
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: '1rem'}}>
                        <input type="number" style={{...s.input, background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`}} placeholder="Chi phí (VNĐ)" value={updateData.chiPhi} onChange={e=>setUpdateData({...updateData, chiPhi: Number(e.target.value)})} />
                        <select style={{...s.input, background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`}} value={updateData.ketQua} onChange={e=>setUpdateData({...updateData, ketQua: e.target.value})}>
                            <option value="SUCCESS">Thành công</option><option value="FAILED">Chờ linh kiện</option>
                        </select>
                    </div>
                )}
            </div>
            <div style={{marginTop: '2rem', display:'flex', justifyContent:'flex-end', gap: '1rem'}}>
                <button onClick={()=>setSelectedTicket(null)} style={{...s.cancelBtn, color: theme.textMuted}}>Hủy</button>
                <button onClick={handleUpdate} style={{...s.addBtn, background: theme.secondary}}>Lưu cập nhật</button>
            </div>
        </div></div>
      )}
    </div>
  );
};

const FilterBtn = ({ label, active, onClick, theme }: any) => (
    <button onClick={onClick} style={{
        padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700,
        background: active ? theme.primary : 'transparent', color: active ? '#fff' : theme.textMuted
    }}>{label}</button>
);

const s: any = {
  container: { padding: '1.5rem', minHeight: '100vh' },
  header: { marginBottom: '2.5rem', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap' },
  grid: (isMobile: boolean) => ({ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }),
  statusBadge: (st: string, t: any) => ({ display:'flex', alignItems:'center', gap: 5, background: st === 'DONE' ? t.secondary+'15' : t.warning+'15', color: st === 'DONE' ? t.secondary : t.warning, padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }),
  overlay: { position:'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 4000, padding: '2rem' },
  modal: { padding: '2.5rem', borderRadius: '1.5rem', width: '100%', maxWidth: '500px' },
  input: { padding: '1rem', borderRadius: '0.75rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  cancelBtn: { background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 },
  addBtn: { border: 'none', padding: '0.8rem 1.5rem', borderRadius: '0.75rem', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  label: { fontSize: '0.85rem', fontWeight: 700, display:'block', marginBottom: 5 }
};