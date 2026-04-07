import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  ClipboardList,
  X
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
    newStatus: 'DONE',
    linhKienThayThe: ''
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('LichBaoTri').select('*, TrangThietBi(tenThietBi, maTaiSan, KhoaPhong(tenKhoaPhong))').order('ngayDuKien', { ascending: true });
    setTickets(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const stats = useMemo(() => {
    return {
        pending: tickets.filter(t => t.trangThai === 'PENDING').length,
        processing: tickets.filter(t => t.trangThai === 'PROCESSING').length,
        urgent: tickets.filter(t => (t.mucDoUuTien === 'URGENT' || t.mucDoUuTien === 'HIGH') && t.trangThai !== 'DONE').length
    };
  }, [tickets]);

  const handleUpdate = async () => {
    try {
      if(!updateData.noiDungChiTiet || !updateData.nguoiThucHien) return alert("Vui lòng nhập đủ thông tin xử lý!");

      const { error: tErr } = await supabase.from('LichBaoTri').update({ 
          trangThai: updateData.newStatus, 
          noiDung: updateData.noiDungChiTiet 
      }).eq('id', selectedTicket.id);
      if(tErr) throw tErr;
      
      if (updateData.newStatus === 'DONE') {
          await supabase.from('SuaChuaChiTiet').insert([{
            trangThietBiId: selectedTicket.trangThietBiId, 
            noiDungChiTiet: `[${updateData.linhKienThayThe || 'Không thay linh kiện'}] ` + updateData.noiDungChiTiet,
            chiPhi: updateData.chiPhi, 
            nguoiThucHien: updateData.nguoiThucHien, 
            ketQua: updateData.ketQua
          }]);
          await supabase.from('TrangThietBi').update({ trangThai: 'ACTIVE' }).eq('id', selectedTicket.trangThietBiId);
      } else if (updateData.newStatus === 'PROCESSING') {
          await supabase.from('TrangThietBi').update({ trangThai: 'BROKEN' }).eq('id', selectedTicket.trangThietBiId);
      }

      alert("Đã cập nhật tiến độ kỹ thuật!"); setSelectedTicket(null); fetchTickets();
    } catch (e: any) { alert(e.message); }
  };

  const filteredTickets = tickets.filter(t => filterStatus === 'ALL' || t.trangThai === filterStatus);

  return (
    <div style={{...s.container, background: theme.bg, color: theme.text}}>
      {/* 1. STATS DASHBOARD */}
      <div style={s.statsHeader}>
          <StatCard label="Chờ xử lý" val={stats.pending} icon={<Clock size={20}/>} color={theme.primary} theme={theme} />
          <StatCard label="Đang thực hiện" val={stats.processing} icon={<Wrench size={20}/>} color={theme.secondary} theme={theme} />
          <StatCard label="Ưu tiên cao" val={stats.urgent} icon={<AlertTriangle size={20}/>} color={theme.danger} theme={theme} isPulse />
      </div>

      <div style={s.header}>
        <div style={{flex: 1}}>
            <h1 style={{margin: 0, fontWeight: 800, fontSize: isMobile ? '1.5rem' : '2.2rem'}}>🔧 Điều phối Kỹ thuật</h1>
            <p style={{color: theme.textMuted, marginTop: '0.5rem'}}>Trung tâm điều hành bảo trì và sửa chữa thiết bị tập trung</p>
        </div>
        
        <div style={s.filterRow}>
            {['ALL', 'PENDING', 'PROCESSING', 'DONE'].map(st => (
                <button key={st} onClick={()=>setFilterStatus(st)} style={s.filterBtn(filterStatus===st, theme)}>
                    {st === 'ALL' ? 'Tất cả' : st === 'PENDING' ? 'Chờ duyệt' : st === 'PROCESSING' ? 'Đang sửa' : 'Hoàn thành'}
                </button>
            ))}
        </div>
      </div>

      {/* 2. TICKETS GRID */}
      <div style={s.grid(isMobile)}>
        {filteredTickets.map(t => {
          const isUrgent = t.mucDoUuTien === 'URGENT' || t.mucDoUuTien === 'HIGH';
          return (
            <div key={t.id} className="glass-card" style={{...s.ticketCard, background: theme.card, border: `1px solid ${isUrgent ? theme.danger + '40' : theme.border}`}}>
              {isUrgent && <div style={s.urgentRibbon}>{t.mucDoUuTien}</div>}
              
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem'}}>
                  <span style={s.statusBadge(t.trangThai, theme)}>
                      {t.trangThai === 'DONE' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                      {t.trangThai}
                  </span>
                  <div style={{fontSize: '0.75rem', color: theme.textMuted, display:'flex', alignItems:'center', gap: 5}}>
                      <Calendar size={12}/> {new Date(t.ngayDuKien).toLocaleDateString('vi-VN')}
                  </div>
              </div>
              
              <h3 style={{margin: '0 0 0.5rem 0', fontWeight: 800, color: theme.text}}>{t.TrangThietBi?.tenThietBi}</h3>
              <div style={{color: theme.primary, fontWeight: 800, fontSize: '0.85rem', letterSpacing: 0.5}}>{t.TrangThietBi?.maTaiSan}</div>
              
              <div style={s.infoList}>
                  <div style={s.infoItem}><MapPin size={14} color={theme.textMuted}/> {t.TrangThietBi?.KhoaPhong?.tenKhoaPhong}</div>
                  <div style={{...s.infoItem, color: theme.text, background: theme.bg, padding: '8px 12px', borderRadius: '8px', marginTop: 10}}>
                      <ClipboardList size={14} color={theme.primary}/> <b>Nội dung:</b> {t.noiDung || 'Bảo trì định kỳ'}
                  </div>
              </div>

              {t.trangThai !== 'DONE' && (
                  <button onClick={() => {
                      setUpdateData({ 
                          noiDungChiTiet: t.noiDung || '', chiPhi: 0, nguoiThucHien: '', 
                          ketQua: 'SUCCESS', linhKienThayThe: '',
                          newStatus: t.trangThai === 'PENDING' ? 'PROCESSING' : 'DONE'
                      });
                      setSelectedTicket(t);
                  }} style={{...s.actionBtn, background: theme.primary}}>
                      Cập nhật xử lý <ChevronRight size={16}/>
                  </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. UPDATE MODAL */}
      {selectedTicket && (
        <div style={s.overlay}><div style={{...s.modal, background: theme.card}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '2rem'}}>
                <h3 style={{margin: 0, fontWeight: 800}}>📝 Ghi nhật ký sửa chữa</h3>
                <button onClick={()=>setSelectedTicket(null)} style={s.closeBtn}><X size={20}/></button>
            </div>

            <div style={s.formGrid}>
                <div style={s.fGroup}>
                    <label style={s.label}>Trạng thái tiếp theo</label>
                    <select style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={updateData.newStatus} onChange={e=>setUpdateData({...updateData, newStatus: e.target.value})}>
                        <option value="PROCESSING">Đang thực hiện (Processing)</option>
                        <option value="DONE">Hoàn thành (Done)</option>
                    </select>
                </div>

                <div style={s.fGroup}>
                    <label style={s.label}>Người thực hiện *</label>
                    <input style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} placeholder="Tên kỹ thuật viên..." value={updateData.nguoiThucHien} onChange={e=>setUpdateData({...updateData, nguoiThucHien: e.target.value})} />
                </div>

                <div style={{...s.fGroup, gridColumn: 'span 2'}}>
                    <label style={s.label}>Linh kiện thay thế (nếu có)</label>
                    <input style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} placeholder="Ví dụ: Tụ nguồn 220V, Màn hình LCD..." value={updateData.linhKienThayThe} onChange={e=>setUpdateData({...updateData, linhKienThayThe: e.target.value})} />
                </div>

                <div style={{...s.fGroup, gridColumn: 'span 2'}}>
                    <label style={s.label}>Chi tiết nội dung sửa chữa *</label>
                    <textarea style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} rows={3} placeholder="Mô tả các bước đã xử lý..." value={updateData.noiDungChiTiet} onChange={e=>setUpdateData({...updateData, noiDungChiTiet: e.target.value})} />
                </div>
                
                {updateData.newStatus === 'DONE' && (
                    <>
                        <div style={s.fGroup}><label style={s.label}>Chi phí (VNĐ)</label><input type="number" style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={updateData.chiPhi} onChange={e=>setUpdateData({...updateData, chiPhi: Number(e.target.value)})} /></div>
                        <div style={s.fGroup}><label style={s.label}>Kết quả</label><select style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={updateData.ketQua} onChange={e=>setUpdateData({...updateData, ketQua: e.target.value})}><option value="SUCCESS">Thành công</option><option value="FAILED">Thất bại/Chờ linh kiện</option></select></div>
                    </>
                )}
            </div>

            <div style={{marginTop: '2.5rem', display:'flex', justifyContent:'flex-end', gap: '1rem'}}>
                <button onClick={()=>setSelectedTicket(null)} style={s.cancelBtn}>Hủy bỏ</button>
                <button onClick={handleUpdate} style={{...s.saveBtn, background: theme.secondary}}>Xác nhận lưu</button>
            </div>
        </div></div>
      )}
    </div>
  );
};

const StatCard = ({ label, val, icon, color, theme, isPulse }: any) => (
    <div style={{...s.statBox(color), animation: isPulse ? 'pulse 2s infinite' : 'none'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{fontSize: '0.75rem', fontWeight: 800, opacity: 0.8}}>{label.toUpperCase()}</span>
            {icon}
        </div>
        <b style={{fontSize: '1.8rem', marginTop: 5}}>{val}</b>
    </div>
);

const FilterBtn = ({ label, active, onClick, theme }: any) => (
    <button onClick={onClick} style={s.filterBtn(active, theme)}>{label}</button>
);

const s: any = {
  container: { padding: '2rem', minHeight: '100vh' },
  statsHeader: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' },
  statBox: (color: string) => ({ padding: '1.5rem', borderRadius: '24px', background: `${color}15`, color: color, border: `1px solid ${color}30`, display:'flex', flexDirection:'column' }),
  header: { marginBottom: '2.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap: 20 },
  filterRow: { display:'flex', background:'rgba(0,0,0,0.05)', padding: 5, borderRadius: '12px', gap: 5 },
  filterBtn: (active: boolean, t: any) => ({ padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, background: active ? t.card : 'transparent', color: active ? t.primary : t.textMuted, transition:'0.3s', boxShadow: active ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }),
  grid: (isMob: boolean) => ({ display: 'grid', gridTemplateColumns: isMob ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }),
  ticketCard: { padding: '2rem', borderRadius: '24px', position: 'relative', overflow:'hidden', transition:'0.3s' },
  urgentRibbon: { position:'absolute', top: 12, right: -30, background: '#ef4444', color:'#fff', padding: '4px 40px', transform: 'rotate(45deg)', fontSize: '0.65rem', fontWeight: 900, boxShadow: '0 2px 10px rgba(239, 68, 68, 0.3)' },
  statusBadge: (st: string, t: any) => ({ display:'flex', alignItems:'center', gap: 6, background: st === 'DONE' ? t.secondary+'15' : t.warning+'15', color: st === 'DONE' ? t.secondary : t.warning, padding: '5px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }),
  infoList: { display:'flex', flexDirection:'column', gap: 10, marginTop: '1.5rem' },
  infoItem: { display:'flex', alignItems:'center', gap: 10, fontSize: '0.85rem', color: '#64748B' },
  actionBtn: { width:'100%', marginTop: '2rem', border:'none', padding: '1rem', borderRadius: '14px', color:'#fff', fontWeight: 700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap: 8 },
  overlay: { position:'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 5000, padding: '2rem' },
  modal: { padding: '2.5rem', borderRadius: '28px', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  fGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: '0.85rem', fontWeight: 700, color: '#94A3B8' },
  input: { padding: '1rem', borderRadius: '12px', border: '1px solid', fontSize: '0.95rem', outline: 'none' },
  cancelBtn: { padding: '1rem 2rem', border:'none', background:'none', color:'#94A3B8', fontWeight: 700, cursor:'pointer' },
  saveBtn: { padding: '1rem 2.5rem', border:'none', borderRadius: '14px', color:'#fff', fontWeight: 700, cursor:'pointer' },
  closeBtn: { background:'none', border:'none', cursor:'pointer', color:'#94A3B8' }
};