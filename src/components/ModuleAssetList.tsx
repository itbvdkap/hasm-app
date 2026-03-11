import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

export const ModuleAssetList = ({ assets, onSelect, onRefresh, isAdmin, theme }: any) => {
  const [filter, setFilter] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quickAdd, setQuickAdd] = useState<any>({ show: false, title: '', table: '', field: '' });
  const [quickValue, setQuickAddValue] = useState('');
  const [catalogs, setCatalogs] = useState({ depts: [], brands: [], deviceNames: [], origins: [] });
  
  const initialForm = {
    id: null, maTaiSan: '', tenThietBi: '', modelThietBi: '', serialNumber: '',
    trangThai: 'ACTIVE', khoaPhongId: '', hangSanXuatId: '', nguonGocId: '',
    nguyenGia: 0, thoiGianKhauHao: 60, ngayMua: new Date().toISOString().split('T')[0],
    namSanXuat: new Date().getFullYear(), soLuuHanh: '', hopDongTu: '', hopDongDen: ''
  };
  const [formData, setFormData] = useState<any>(initialForm);

  const fetchCatalogs = async () => {
    const [depts, brands, names, origins] = await Promise.all([
      supabase.from('KhoaPhong').select('id, tenKhoaPhong, maKhoaPhong'),
      supabase.from('HangSanXuat').select('id, tenHangSanXuat'),
      supabase.from('DanhMucThietBi').select('id, tenThietBi'),
      supabase.from('NguonGocThietBi').select('id, tenNguonGoc')
    ]);
    setCatalogs({ depts: depts.data || [], brands: brands.data || [], deviceNames: names.data || [], origins: origins.data || [] });
  };

  useEffect(() => { fetchCatalogs(); }, [showModal]);

  const handleQuickSave = async () => {
    if (!quickValue) return;
    try {
        await supabase.from(quickAdd.table).insert([{ [quickAdd.field]: quickValue }]);
        setQuickAdd({ ...quickAdd, show: false }); setQuickAddValue(''); fetchCatalogs();
    } catch (e: any) { alert(e.message); }
  };

  const handleImportExcel = async (e: any) => {
    const file = e.target.files[0]; if (!file) return;
    const targetDeptCode = prompt("Mã Khoa (Vd: HSCC, CDHA):");
    const dept = catalogs.depts.find((d: any) => d.maKhoaPhong === targetDeptCode);
    if (!dept) return alert("Mã khoa không đúng!");
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: any[] = XLSX.utils.sheet_to_json(ws);
        const payload = raw.map(row => ({
            tenThietBi: row["TEN_TB"], modelThietBi: row["KY_HIEU"], maTaiSan: row["MA_MAY"],
            namSanXuat: parseInt(row["NAM_SX"]), ngayMua: row["NAM_SD"] ? `${row["NAM_SD"]}-01-01` : null,
            soLuuHanh: row["SO_LUU_HANH"], khoaPhongId: (dept as any).id, trangThai: 'ACTIVE', loaiTaiSan: 'MEDICAL'
        }));
        await supabase.from('TrangThietBi').insert(payload); alert("Xong!"); onRefresh();
      } catch (err: any) { alert(err.message); } finally { setImporting(false); }
    };
    reader.readAsBinaryString(file);
  };

  const handleExportExcel = () => {
    const data = assets.map((a: any, i: number) => ({ "STT": i+1, "TEN_TB": a.tenThietBi, "KY_HIEU": a.modelThietBi, "MA_MAY": a.maTaiSan }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TTB"); XLSX.writeFile(wb, "Bao_cao_BYT.xlsx");
  };

  const handlePrintBatch = () => {
    const selected = assets.filter((a: any) => selectedIds.includes(a.id));
    const win = window.open('', '_blank'); if (!win) return;
    let html = '';
    selected.forEach((a: any) => {
        html += `<div style="width:50mm;height:30mm;padding:5px;border:1px solid #000;display:flex;page-break-after:always;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${a.maTaiSan}" width="70" />
            <div style="font-family:Arial;font-size:7pt;margin-left:5px;"><b>${a.tenThietBi}</b><br/>${a.maTaiSan}</div>
        </div>`;
    });
    win.document.write(html); win.document.close(); setTimeout(()=>win.print(), 500);
  };

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
      {/* TOOLBAR RESPONSIVE */}
      <div style={css.toolbar}>
        <div style={css.filterGroup}>
            <div style={{...css.searchWrapper, background: theme.bg, border: `1px solid ${theme.border}`}}>
                🔍 <input placeholder="Tìm máy..." style={{...css.searchInput, color: theme.text}} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select style={{...css.selectFilter, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text}} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                <option value="ALL">Tất cả Khoa</option>
                {catalogs.depts.map((d:any) => <option key={d.id} value={d.id}>{d.tenKhoaPhong}</option>)}
            </select>
            <select style={{...css.selectFilter, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text}} value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="ALL">Tình trạng</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="MAINTENANCE">Bảo trì</option>
                <option value="BROKEN">Hỏng</option>
            </select>
        </div>

        <div style={css.actionGroup}>
            {selectedIds.length > 0 && <button onClick={handlePrintBatch} style={css.printBtn}>In {selectedIds.length} tem</button>}
            <button onClick={handleExportExcel} style={css.secondaryBtn}>Xuất Excel</button>
            {isAdmin && (
                <>
                    <label style={css.secondaryBtn}>Nhập Excel<input type="file" hidden onChange={handleImportExcel} accept=".xlsx" /></label>
                    <button onClick={() => { setFormData(initialForm); setShowModal(true); }} style={css.addBtn}>+ Thêm TS</button>
                </>
            )}
        </div>
      </div>

      {/* TABLE WITH HORIZONTAL SCROLL */}
      <div style={css.tableContainer}>
        <table style={css.table}>
            <thead>
            <tr style={{...css.thRow, borderBottom: `1px solid ${theme.border}`}}>
                <th style={{paddingLeft: 15}}><input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? filtered.map((a:any)=>a.id) : [])} /></th>
                <th>MÃ TS</th>
                <th>TÊN THIẾT BỊ</th>
                <th>KHOA PHÒNG</th>
                <th>TÌNH TRẠNG</th>
                {isAdmin && <th style={{textAlign: 'right'}}>SỬA</th>}
            </tr>
            </thead>
            <tbody>
            {filtered.map((a: any) => (
                <tr key={a.id} style={{...css.trBody, borderBottom: `1px solid ${theme.border}`}} onClick={() => onSelect(a)}>
                <td style={{paddingLeft: 15}} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.includes(a.id)} onChange={() => setSelectedIds(prev => prev.includes(a.id) ? prev.filter(id => id !== a.id) : [...prev, a.id])} />
                </td>
                <td style={{color: '#3b82f6', fontWeight: 'bold'}}>{a.maTaiSan}</td>
                <td style={{fontWeight: 500}}>{a.tenThietBi}</td>
                <td style={{fontSize: 12}}>{a.KhoaPhong?.tenKhoaPhong}</td>
                <td><span style={css.badge(a.trangThai)}>{a.trangThai}</span></td>
                {isAdmin && (
                    <td style={{textAlign: 'right'}} onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setFormData(a); setShowModal(true); }} style={css.editBtn}>✏️</button>
                    </td>
                )}
                </tr>
            ))}
            </tbody>
        </table>
      </div>

      {/* MODAL FULL FUNCTIONS (ADMIN ONLY) */}
      {showModal && isAdmin && (
        <div style={css.modalOverlay}>
          <div style={{...css.modalContent, background: theme.sidebar, border: `1px solid ${theme.border}`}}>
            <h2 style={{color: '#00d4a8', marginTop: 0}}>{formData.id ? '📝 Chỉnh sửa' : '➕ Thêm mới'}</h2>
            <div style={css.formGrid}>
                <div style={css.formGroup}>
                    <div style={css.labelRow}><label style={{color: theme.muted}}>Tên máy</label><span onClick={()=>setQuickAdd({show:true, title:'Tên máy', table:'DanhMucThietBi', field:'tenThietBi'})} style={css.addLink}>[+] Thêm</span></div>
                    <select style={{...css.input, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text}} value={formData.tenThietBi} onChange={e => setFormData({...formData, tenThietBi: e.target.value})}>
                        <option value="">-- Chọn máy --</option>
                        {catalogs.deviceNames.map((d: any) => <option key={d.id} value={d.tenThietBi}>{d.tenThietBi}</option>)}
                    </select>
                </div>
                <div style={css.formGroup}><label style={{color: theme.muted}}>Mã tài sản</label><input style={{...css.input, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text}} value={formData.maTaiSan} onChange={e => setFormData({...formData, maTaiSan: e.target.value})} /></div>
                <div style={css.formGroup}><label style={{color: theme.muted}}>Khoa phòng</label><select style={{...css.input, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text}} value={formData.khoaPhongId} onChange={e => setFormData({...formData, khoaPhongId: e.target.value})}>
                    <option value="">-- Chọn khoa --</option>{catalogs.depts.map((d: any) => <option key={d.id} value={d.id}>{d.tenKhoaPhong}</option>)}
                </select></div>
                <div style={css.formGroup}><label style={{color: theme.muted}}>Nguyên giá (đ)</label><input type="number" style={{...css.input, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text}} value={formData.nguyenGia} onChange={e => setFormData({...formData, nguyenGia: e.target.value})} /></div>
            </div>
            <div style={{marginTop: 30, textAlign: 'right'}}>
                <button onClick={() => setShowModal(false)} style={{background: 'none', border: 'none', color: theme.muted, marginRight: 20, cursor: 'pointer'}}>Huỷ</button>
                <button onClick={handleSave} disabled={loading} style={css.addBtn}>Lưu ngay</button>
            </div>
          </div>
        </div>
      )}

      {/* MINI MODAL QUICK ADD */}
      {quickAdd.show && (
        <div style={css.modalOverlay}>
            <div style={{...css.modalContent, maxWidth: 400, background: theme.sidebar, border: `1px solid ${theme.border}`}}>
                <h3 style={{color: '#3b82f6', marginTop: 0}}>➕ Thêm nhanh</h3>
                <input style={{...css.input, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text}} autoFocus placeholder="Nhập tên..." onChange={e => setQuickAddValue(e.target.value)} />
                <div style={{marginTop: 20, textAlign: 'right'}}><button onClick={() => setQuickAdd({show: false})} style={{background: 'none', border: 'none', color: theme.muted, marginRight: 15, cursor: 'pointer'}}>Huỷ</button><button onClick={handleQuickSave} style={css.addBtn}>Lưu</button></div>
            </div>
        </div>
      )}
    </div>
  );
};

const css: any = {
  container: { padding: '20px', borderRadius: '20px' },
  toolbar: { display: 'flex', flexWrap: 'wrap', gap: 15, marginBottom: 20 },
  filterGroup: { display: 'flex', flexWrap: 'wrap', gap: 10, flex: 1 },
  actionGroup: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  searchWrapper: { display: 'flex', alignItems: 'center', padding: '0 15px', borderRadius: 12, minWidth: 200 },
  searchInput: { background: 'none', border: 'none', padding: '10px 0', outline: 'none', width: '100%', fontSize: 13 },
  selectFilter: { padding: '10px', borderRadius: 12, outline: 'none', fontSize: 13, cursor: 'pointer', minWidth: 150 },
  addBtn: { background: '#00d4a8', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' },
  printBtn: { background: '#a855f7', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' },
  secondaryBtn: { background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f640', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' },
  tableContainer: { overflowX: 'auto', width: '100%' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 800 },
  thRow: { textAlign: 'left', color: '#64748b', fontSize: 11, height: 50, textTransform: 'uppercase' },
  trBody: { cursor: 'pointer', transition: '0.2s' },
  badge: (s: string) => ({ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 'bold', background: s === 'ACTIVE' ? '#22c55e20' : '#ef444420', color: s === 'ACTIVE' ? '#22c55e' : '#ef4444' }),
  editBtn: { background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', fontSize: 16 },
  addLink: { fontSize: 10, color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold' },
  labelRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 5 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 20 },
  modalContent: { padding: 35, borderRadius: 24, width: '100%', maxWidth: 750 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 },
  formGroup: { display: 'flex', flexDirection: 'column' },
  input: { padding: '12px', borderRadius: 10, outline: 'none', fontSize: 14 }
};