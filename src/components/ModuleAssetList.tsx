import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

export const ModuleAssetList = ({ assets, onSelect, onRefresh, isAdmin, theme, isMobile }: any) => {
  const [filter, setFilter] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [catalogs, setCatalogs] = useState({ depts: [], brands: [], deviceNames: [], origins: [] });
  
  const initialForm = { id: null, maTaiSan: '', tenThietBi: '', modelThietBi: '', trangThai: 'ACTIVE', khoaPhongId: '', hangSanXuatId: '', nguonGocId: '', nguyenGia: 0, ngayMua: new Date().toISOString().split('T')[0] };
  const [formData, setFormData] = useState<any>(initialForm);

  useEffect(() => {
    if (showModal && !isMobile) {
      supabase.from('KhoaPhong').select('id, tenKhoaPhong, maKhoaPhong').then(({data}) => setCatalogs(prev => ({...prev, depts: data || []})));
      supabase.from('HangSanXuat').select('id, tenHangSanXuat').then(({data}) => setCatalogs(prev => ({...prev, brands: data || []})));
      supabase.from('DanhMucThietBi').select('id, tenThietBi').then(({data}) => setCatalogs(prev => ({...prev, deviceNames: data || []})));
    }
  }, [showModal, isMobile]);

  const handleSave = async () => {
    setLoading(true); const payload = { ...formData }; if (!payload.id) delete payload.id;
    try {
      if (formData.id) await supabase.from('TrangThietBi').update(payload).eq('id', formData.id);
      else await supabase.from('TrangThietBi').insert([payload]);
      setShowModal(false); onRefresh();
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const filtered = assets.filter((a: any) => {
    const mSearch = (a.tenThietBi||'').toLowerCase().includes(search.toLowerCase()) || (a.maTaiSan||'').toLowerCase().includes(search.toLowerCase());
    const mStatus = filter === 'ALL' || a.trangThai === filter;
    const mDept = selectedDept === 'ALL' || a.khoaPhongId === selectedDept;
    return mSearch && mStatus && mDept;
  });

  return (
    <div style={{...css.container, background: theme.card, border: `1px solid ${theme.border}`}}>
      <div style={css.toolbar}>
        <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
            <div style={{...css.searchWrapper, background: theme.bg, border: `1px solid ${theme.border}`}}>
                🔍 <input placeholder="Tìm máy..." style={{...css.searchInput, color: theme.text}} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {!isMobile && (
                <>
                    <select style={{...css.selectFilter, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text}} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                        <option value="ALL">Khoa Phòng</option>
                        {catalogs.depts.map((d:any) => <option key={d.id} value={d.id}>{d.tenKhoaPhong}</option>)}
                    </select>
                    <select style={{...css.selectFilter, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text}} value={filter} onChange={e => setFilter(e.target.value)}>
                        <option value="ALL">Tình trạng</option>
                        <option value="ACTIVE">Hoạt động</option>
                        <option value="BROKEN">Hỏng</option>
                    </select>
                </>
            )}
        </div>

        {/* GIỚI HẠN THÊM MỚI TRÊN MOBILE */}
        {!isMobile && isAdmin && (
            <button onClick={() => { setFormData(initialForm); setShowModal(true); }} style={css.addBtn}>+ Thêm tài sản</button>
        )}
      </div>

      <div style={css.tableContainer}>
        <table style={{...css.table, minWidth: isMobile ? 500 : 800}}>
            <thead>
            <tr style={{...css.thRow, borderBottom: `1px solid ${theme.border}`}}>
                <th style={{paddingLeft: 15}}><input type="checkbox" /></th>
                <th>MÃ TÀI SẢN</th>
                <th>TÊN THIẾT BỊ</th>
                {!isMobile && <th>KHOA PHÒNG</th>}
                <th>TÌNH TRẠNG</th>
                {isAdmin && !isMobile && <th style={{textAlign: 'right'}}>SỬA</th>}
            </tr>
            </thead>
            <tbody>
            {filtered.map((a: any) => (
                <tr key={a.id} style={{...css.trBody, borderBottom: `1px solid ${theme.border}`}} onClick={() => onSelect(a)}>
                <td style={{paddingLeft: 15}} onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                <td style={{color: '#3b82f6', fontWeight: 'bold'}}>{a.maTaiSan}</td>
                <td style={{fontWeight: 500}}>{a.tenThietBi}</td>
                {!isMobile && <td style={{fontSize: 12}}>{a.KhoaPhong?.tenKhoaPhong}</td>}
                <td><span style={css.badge(a.trangThai)}>{a.trangThai}</span></td>
                {isAdmin && !isMobile && (
                    <td style={{textAlign: 'right'}} onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setFormData(a); setShowModal(true); }} style={css.editBtn}>✏️</button>
                    </td>
                )}
                </tr>
            ))}
            </tbody>
        </table>
      </div>
      
      {isMobile && <div style={{textAlign: 'center', marginTop: 15, fontSize: 12, color: theme.muted}}>Chạm vào dòng để xem chi tiết & báo hỏng</div>}

      {/* MODAL (CHỈ HIỆN TRÊN DESKTOP THEO GIỚI HẠN) */}
      {showModal && !isMobile && isAdmin && (
        <div style={css.modalOverlay}>
          <div style={{...css.modalContent, background: theme.sidebar, border: `1px solid ${theme.border}`}}>
            <h2 style={{color: '#00d4a8', marginTop: 0}}>📝 Quản lý thiết bị</h2>
            <div style={css.formGrid}>
                <div style={css.formGroup}>
                    <label style={{color: theme.muted}}>Tên máy</label>
                    <select style={{...css.input, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text}} value={formData.tenThietBi} onChange={e => setFormData({...formData, tenThietBi: e.target.value})}>
                        <option value="">-- Chọn máy --</option>
                        {catalogs.deviceNames.map((d: any) => <option key={d.id} value={d.tenThietBi}>{d.tenThietBi}</option>)}
                    </select>
                </div>
                <div style={css.formGroup}><label style={{color: theme.muted}}>Mã TS</label><input style={{...css.input, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text}} value={formData.maTaiSan} onChange={e => setFormData({...formData, maTaiSan: e.target.value})} /></div>
            </div>
            <div style={{marginTop: 30, textAlign: 'right'}}>
                <button onClick={() => setShowModal(false)} style={{background: 'none', border: 'none', color: theme.muted, marginRight: 20}}>Huỷ</button>
                <button onClick={handleSave} disabled={loading} style={css.addBtn}>Lưu ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const css: any = {
  container: { padding: '15px', borderRadius: '20px' },
  toolbar: { display: 'flex', flexWrap: 'wrap', gap: 15, marginBottom: 20 },
  searchWrapper: { display: 'flex', alignItems: 'center', padding: '0 15px', borderRadius: 12, minWidth: 180 },
  searchInput: { background: 'none', border: 'none', padding: '10px 0', outline: 'none', width: '100%', fontSize: 13 },
  selectFilter: { padding: '10px', borderRadius: 12, outline: 'none', fontSize: 12, cursor: 'pointer' },
  addBtn: { background: '#00d4a8', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 'bold' },
  tableContainer: { overflowX: 'auto', width: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { textAlign: 'left', color: '#64748b', fontSize: 10, height: 45, textTransform: 'uppercase' },
  trBody: { cursor: 'pointer', transition: '0.2s' },
  badge: (s: string) => ({ padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 'bold', background: s === 'ACTIVE' ? '#22c55e20' : '#ef444420', color: s === 'ACTIVE' ? '#22c55e' : '#ef4444' }),
  editBtn: { background: 'none', border: 'none', color: '#3b82f6', fontSize: 16 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 20 },
  modalContent: { padding: 30, borderRadius: 24, width: '100%', maxWidth: 600 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: 15 },
  formGroup: { display: 'flex', flexDirection: 'column' },
  input: { padding: '12px', borderRadius: 10, outline: 'none' }
};