import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Plus, 
  Mic, 
  MapPin, 
  Monitor, 
  ChevronRight, 
  Filter, 
  Settings2,
  CheckCircle2,
  FileDown,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';

export const ModuleAssetList = ({ assets = [], onSelect, onRefresh, isAdmin, theme, isMobile }: any) => {
  // --- 1. QUẢN LÝ CỘT HIỂN THỊ (DYNAMIC COLUMNS) ---
  const ALL_COLUMNS = [
    { id: 'maTaiSan', label: 'Mã tài sản', fixed: true },
    { id: 'tenThietBi', label: 'Tên thiết bị', fixed: true },
    { id: 'khoaPhong', label: 'Khoa phòng' },
    { id: 'modelThietBi', label: 'Model' },
    { id: 'serialNumber', label: 'Số Serial' },
    { id: 'hangSanXuat', label: 'Hãng sản xuất' },
    { id: 'namSanXuat', label: 'Năm SX' },
    { id: 'nguyenGia', label: 'Nguyên giá' },
    { id: 'trangThai', label: 'Tình trạng' },
    { id: 'soLuuHanh', label: 'Số lưu hành' }
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('hams_asset_cols_v2');
    return saved ? JSON.parse(saved) : ['maTaiSan', 'tenThietBi', 'khoaPhong', 'trangThai', 'modelThietBi'];
  });

  const [showColPicker, setShowColPicker] = useState(false);
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');

  useEffect(() => {
    localStorage.setItem('hams_asset_cols_v2', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // --- 2. STATES BỘ LỌC ---
  const [filter, setFilter] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [depts, setDepts] = useState<any[]>([]);
  const [deviceNames, setDeviceNames] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    supabase.from('KhoaPhong').select('id, tenKhoaPhong').then(({data}) => setDepts(data || []));
    supabase.from('DanhMucThietBi').select('id, tenThietBi').then(({data}) => setDeviceNames(data || []));
    supabase.from('HangSanXuat').select('id, tenHangSanXuat').then(({data}) => setManufacturers(data || []));
  }, [showModal]);

  const filtered = assets.filter((a: any) => {
    const mSearch = (a.tenThietBi||'').toLowerCase().includes(search.toLowerCase()) || (a.maTaiSan||'').toLowerCase().includes(search.toLowerCase());
    const mStatus = filter === 'ALL' || a.trangThai === filter;
    const mDept = selectedDept === 'ALL' || a.khoaPhongId === selectedDept;
    return mSearch && mStatus && mDept;
  });

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Trình duyệt không hỗ trợ tìm kiếm giọng nói.");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const handleExport = () => {
    const data = filtered.map((a: any, i: number) => {
        const row: any = { "STT": i + 1 };
        visibleColumns.forEach(col => {
            const label = ALL_COLUMNS.find(c => c.id === col)?.label || col;
            if (col === 'khoaPhong') row[label] = a.KhoaPhong?.tenKhoaPhong;
            else if (col === 'hangSanXuat') row[label] = a.HangSanXuat?.tenHangSanXuat;
            else if (col === 'nguyenGia') row[label] = Number(a.nguyenGia).toLocaleString();
            else row[label] = a[col];
        });
        return row;
    });
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets"); XLSX.writeFile(wb, "HAMS_Inventory.xlsx");
  };

  return (
    <div style={{ paddingBottom: isMobile ? '4rem' : 0 }}>
      {/* 1. TOP TOOLBAR PRO */}
      <div style={s.toolbar(isMobile)}>
        <div style={s.searchContainer(theme)}>
            <Search size={18} color={theme.textMuted} />
            <input 
              placeholder={isListening ? "Đang nghe..." : "Tìm máy, mã tài sản..."} 
              style={{...s.searchInput, color: theme.text}} 
              value={search}
              onChange={e => setSearch(e.target.value)} 
            />
            <Mic 
              size={18} 
              color={isListening ? theme.danger : theme.primary} 
              style={{cursor:'pointer', animation: isListening ? 'pulse 1.5s infinite' : 'none'}} 
              onClick={handleVoiceSearch}
            />
        </div>

        <div style={{display:'flex', gap: '0.75rem', alignItems:'center'}}>
            {/* VIEW SWITCHER PILL */}
            {!isMobile && (
              <div style={s.pillSwitcher(theme)}>
                <button onClick={()=>setViewMode('LIST')} style={s.pillBtn(viewMode==='LIST', theme)}><ListIcon size={16}/></button>
                <button onClick={()=>setViewMode('GRID')} style={s.pillBtn(viewMode==='GRID', theme)}><LayoutGrid size={16}/></button>
              </div>
            )}

            {/* COLUMN TOGGLE MENU */}
            <div style={{position:'relative'}}>
                <button onClick={() => setShowColPicker(!showColPicker)} style={s.configBtn(theme)}>
                    <Settings2 size={18} /> {!isMobile && 'Cấu hình cột'}
                </button>
                {showColPicker && (
                    <div style={{...s.colPicker(theme), background: theme.card}}>
                        <div style={s.colPickerHeader}>Hiển thị thông tin</div>
                        {ALL_COLUMNS.map(c => (
                            <label key={c.id} style={{...s.colLabel, color: theme.text}}>
                                <input type="checkbox" checked={visibleColumns.includes(c.id)} 
                                    disabled={c.fixed}
                                    onChange={e => {
                                        if (e.target.checked) setVisibleColumns([...visibleColumns, c.id]);
                                        else if(!c.fixed) setVisibleColumns(visibleColumns.filter(v => v !== c.id));
                                    }} 
                                /> {c.label}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <button onClick={handleExport} style={s.exportBtn(theme)} title="Xuất báo cáo"><FileDown size={18}/></button>
            {isAdmin && (
                <button onClick={()=>{setFormData({}); setShowModal(true);}} style={{...s.addBtn, background: theme.primary}}>
                    <Plus size={20} /> {!isMobile && 'Thêm máy'}
                </button>
            )}
        </div>
      </div>

      {/* 2. FILTER CHIPS */}
      <div style={s.chipContainer}>
        <Chip label="Tất cả" active={filter==='ALL'} onClick={()=>setFilter('ALL')} theme={theme} />
        <Chip label="Hoạt động" active={filter==='ACTIVE'} onClick={()=>setFilter('ACTIVE')} theme={theme} color={theme.secondary} />
        <Chip label="Sự cố" active={filter==='BROKEN'} onClick={()=>setFilter('BROKEN')} theme={theme} color={theme.danger} />
        <div style={{width: 1, height: 20, background: theme.border, margin: '0 10px'}} />
        <select style={{...s.deptSelect(theme), color: theme.text}} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
            <option value="ALL">Tất cả khoa phòng</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.tenKhoaPhong}</option>)}
        </select>
      </div>

      {/* 3. ASSET DISPLAY AREA */}
      {viewMode === 'LIST' ? (
        <div className="glass-card" style={{...s.tableWrapper(theme), background: theme.card}}>
          <table style={s.table}>
              <thead>
                  <tr style={{...s.thRow, borderBottom: `1px solid ${theme.border}`}}>
                      {ALL_COLUMNS.filter(c => visibleColumns.includes(c.id)).map(c => <th key={c.id} style={s.th}>{c.label}</th>)}
                      <th style={{...s.th, textAlign:'right'}}>THAO TÁC</th>
                  </tr>
              </thead>
              <tbody>
                  {filtered.map((a: any) => (
                      <tr key={a.id} style={{...s.tr, borderBottom: `1px solid ${theme.border}`}} onClick={() => onSelect(a)}>
                          {visibleColumns.includes('maTaiSan') && <td style={{...s.td, color: theme.primary, fontWeight: 800}}>{a.maTaiSan}</td>}
                          {visibleColumns.includes('tenThietBi') && <td style={{...s.td, fontWeight: 700, color: theme.text}}>{a.tenThietBi}</td>}
                          {visibleColumns.includes('khoaPhong') && <td style={{...s.td, color: theme.text}}>{a.KhoaPhong?.tenKhoaPhong || '---'}</td>}
                          {visibleColumns.includes('modelThietBi') && <td style={{...s.td, color: theme.text}}>{a.modelThietBi}</td>}
                          {visibleColumns.includes('serialNumber') && <td style={{...s.td, color: theme.text}}>{a.serialNumber}</td>}
                          {visibleColumns.includes('hangSanXuat') && <td style={{...s.td, color: theme.text}}>{a.HangSanXuat?.tenHangSanXuat || '---'}</td>}
                          {visibleColumns.includes('namSanXuat') && <td style={{...s.td, color: theme.text}}>{a.namSanXuat}</td>}
                          {visibleColumns.includes('nguyenGia') && <td style={{...s.td, fontWeight: 700, color: theme.text}}>{Number(a.nguyenGia).toLocaleString()} đ</td>}
                          {visibleColumns.includes('trangThai') && <td style={s.td}><span style={s.badge(a.trangThai, theme)}>{a.trangThai}</span></td>}
                          {visibleColumns.includes('soLuuHanh') && <td style={{...s.td, color: theme.text}}>{a.soLuuHanh}</td>}
                          <td style={{...s.td, textAlign:'right'}}><ChevronRight size={18} color="#CBD5E1" /></td>
                      </tr>
                  ))}
              </tbody>
          </table>
          {filtered.length === 0 && <div style={{padding: 50, textAlign:'center', color: theme.textMuted}}>Không có thiết bị nào khớp với bộ lọc</div>}
        </div>
      ) : (
        <div style={s.gridWrapper}>
          {filtered.map((a: any) => (
            <div key={a.id} className="glass-card" style={{...s.gridCard(theme), background: theme.card}} onClick={() => onSelect(a)}>
              <div style={s.gridCardIcon(a.trangThai, theme)}><Monitor size={32}/></div>
              <div style={{fontWeight: 800, fontSize: '1.1rem', color: theme.text, marginTop: '1rem'}}>{a.tenThietBi}</div>
              <div style={{color: theme.primary, fontWeight: 800, fontSize: '0.85rem'}}>{a.maTaiSan}</div>
              <div style={{marginTop: '1rem', display:'flex', flexDirection:'column', gap: 6, fontSize:'0.85rem', color: theme.textMuted}}>
                <div style={{display:'flex', alignItems:'center', gap: 6}}><MapPin size={14}/> {a.KhoaPhong?.tenKhoaPhong}</div>
                <div style={{display:'flex', alignItems:'center', gap: 6}}><CheckCircle2 size={14}/> {a.trangThai}</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{gridColumn:'1/-1', padding: 50, textAlign:'center', color: theme.textMuted}}>Không có thiết bị nào khớp với bộ lọc</div>}
        </div>
      )}

      {/* 4. MODAL ADD/EDIT ASSET */}
      {showModal && (
        <div style={s.overlay}>
            <div style={{...s.modal, background: theme.card}}>
                <div style={{...s.modalHeader, borderBottom: `1px solid ${theme.border}`}}>
                    <h3 style={{margin: 0, fontWeight: 800, fontSize: '1.2rem', color: theme.text}}>
                        {formData.id ? 'Cập nhật thiết bị' : 'Thêm thiết bị mới'}
                    </h3>
                    <button onClick={()=>setShowModal(false)} style={s.closeBtn}><Search size={20} style={{transform:'rotate(45deg)', color: theme.textMuted}}/></button>
                </div>
                
                <div style={s.modalBody}>
                    <div style={s.formGrid}>
                        <div style={s.fGroup}>
                            <label style={s.label}>Mã tài sản <span style={{color:'red'}}>*</span></label>
                            <input style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.maTaiSan || ''} onChange={e=>setFormData({...formData, maTaiSan: e.target.value})} placeholder="VD: TS-001" />
                        </div>
                        <div style={s.fGroup}>
                            <label style={s.label}>Tên thiết bị <span style={{color:'red'}}>*</span></label>
                            <input style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.tenThietBi || ''} onChange={e=>setFormData({...formData, tenThietBi: e.target.value})} placeholder="VD: Máy siêu âm 4D" />
                        </div>

                        <div style={s.fGroup}>
                            <label style={s.label}>Khoa phòng</label>
                            <select style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.khoaPhongId || ''} onChange={e=>setFormData({...formData, khoaPhongId: e.target.value})}>
                                <option value="">-- Chọn khoa phòng --</option>
                                {depts.map(d => <option key={d.id} value={d.id}>{d.tenKhoaPhong}</option>)}
                            </select>
                        </div>
                        <div style={s.fGroup}>
                            <label style={s.label}>Hãng sản xuất</label>
                            <select style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.hangSanXuatId || ''} onChange={e=>setFormData({...formData, hangSanXuatId: e.target.value})}>
                                <option value="">-- Chọn hãng sản xuất --</option>
                                {manufacturers.map(m => <option key={m.id} value={m.id}>{m.tenHangSanXuat}</option>)}
                            </select>
                        </div>
                        
                        <div style={s.fGroup}>
                            <label style={s.label}>Model</label>
                            <input style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.modelThietBi || ''} onChange={e=>setFormData({...formData, modelThietBi: e.target.value})} />
                        </div>
                        <div style={s.fGroup}>
                            <label style={s.label}>Serial Number</label>
                            <input style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.serialNumber || ''} onChange={e=>setFormData({...formData, serialNumber: e.target.value})} />
                        </div>

                        <div style={s.fGroup}>
                            <label style={s.label}>Năm sản xuất</label>
                            <input type="number" style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.namSanXuat || ''} onChange={e=>setFormData({...formData, namSanXuat: e.target.value})} />
                        </div>
                        <div style={s.fGroup}>
                            <label style={s.label}>Nguyên giá</label>
                            <input type="number" style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.nguyenGia || ''} onChange={e=>setFormData({...formData, nguyenGia: e.target.value})} />
                        </div>
                    </div>

                    <div style={{marginTop: '2rem', display:'flex', justifyContent:'flex-end', gap: '1rem'}}>
                        <button onClick={()=>setShowModal(false)} style={s.cancelBtn}>Hủy bỏ</button>
                        <button onClick={async () => {
                            try {
                                if(!formData.maTaiSan || !formData.tenThietBi) return alert("Vui lòng nhập đủ thông tin bắt buộc!");
                                
                                const payload = {
                                    maTaiSan: formData.maTaiSan,
                                    tenThietBi: formData.tenThietBi,
                                    khoaPhongId: formData.khoaPhongId || null,
                                    hangSanXuatId: formData.hangSanXuatId || null,
                                    modelThietBi: formData.modelThietBi,
                                    serialNumber: formData.serialNumber,
                                    namSanXuat: formData.namSanXuat,
                                    nguyenGia: formData.nguyenGia,
                                    trangThai: formData.trangThai || 'ACTIVE'
                                };

                                if(formData.id) {
                                    const { error } = await supabase.from('TrangThietBi').update(payload).eq('id', formData.id);
                                    if(error) throw error;
                                    alert("Cập nhật thành công!");
                                } else {
                                    const { error } = await supabase.from('TrangThietBi').insert([payload]);
                                    if(error) throw error;
                                    alert("Thêm mới thành công!");
                                }
                                setShowModal(false);
                                onRefresh();
                            } catch(e: any) {
                                alert("Có lỗi xảy ra: " + e.message);
                            }
                        }} style={{...s.saveBtn, background: theme.primary}}>Lưu lại</button>
                    </div>
                </div>
            </div>
        </div>
      )}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const Chip = ({ label, active, onClick, theme, color }: any) => (
    <button onClick={onClick} style={{
        padding: '0.5rem 1.25rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
        background: active ? (color || theme.primary) : theme.card,
        color: active ? '#fff' : theme.textMuted,
        boxShadow: active ? `0 4px 12px ${color || theme.primary}40` : 'none',
        transition: '0.3s', whiteSpace: 'nowrap', border: active ? 'none' : `1px solid ${theme.border}`
    }}>{label}</button>
);

const s: any = {
  toolbar: (isMob: boolean) => ({ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '2rem', flexWrap: isMob ? 'wrap' : 'nowrap', alignItems:'center' }),
  searchContainer: (t: any) => ({ flex: 1, display:'flex', alignItems:'center', gap: 10, padding: '0 1.25rem', background: t.card, borderRadius: '12px', boxShadow: t.shadow, border: `1px solid ${t.border}` }),
  searchInput: { border:'none', outline:'none', flex: 1, padding: '0.8rem 0', fontSize: '0.95rem', background: 'none' },
  addBtn: { border:'none', padding: '0.8rem 1.5rem', borderRadius: '12px', color:'#fff', fontWeight: 700, cursor:'pointer', display:'flex', alignItems:'center', gap: 8 },
  configBtn: (t: any) => ({ background: t.card, border: `1px solid ${t.border}`, color: t.textMuted, padding: '0.8rem 1.25rem', borderRadius: '12px', cursor:'pointer', display:'flex', alignItems:'center', gap: 8, fontSize: '0.85rem', fontWeight: 600 }),
  exportBtn: (t: any) => ({ background: t.card, border: `1px solid ${t.border}`, color: t.textMuted, width: 45, height: 45, borderRadius: '12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }),
  
  pillSwitcher: (t: any) => ({ display: 'flex', background: t.bg, padding: '4px', borderRadius: '10px', border: `1px solid ${t.border}` }),
  pillBtn: (active: boolean, t: any) => ({ border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: active ? t.card : 'transparent', color: active ? t.primary : t.textMuted, boxShadow: active ? t.shadow : 'none', transition: '0.3s' }),

  colPicker: (t: any) => ({ position: 'absolute', top: '110%', right: 0, width: '220px', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', padding: '1.5rem', zIndex: 100, border: `1px solid ${t.border}` }),
  colPickerHeader: { fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' },
  colLabel: { display:'flex', alignItems:'center', gap: 10, padding: '8px 0', fontSize: '0.9rem', cursor:'pointer', fontWeight: 500 },

  chipContainer: { display:'flex', alignItems:'center', gap: 10, marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem' },
  deptSelect: (t: any) => ({ border: 'none', background: 'none', fontSize: '0.85rem', outline: 'none', fontWeight: 600, cursor: 'pointer' }),
  
  tableWrapper: (t: any) => ({ borderRadius: '20px', overflowX: 'auto', border: `1px solid ${t.border}` }),
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '1000px' },
  th: { padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' },
  tr: { cursor: 'pointer', transition: '0.2s', ':hover': { opacity: 0.8 } },
  td: { padding: '1.25rem 1.5rem', fontSize: '0.9rem' },
  badge: (st: string, t: any) => ({ background: st === 'ACTIVE' ? `${t.secondary}15` : `${t.danger}15`, color: st === 'ACTIVE' ? t.secondary : t.danger, padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }),

  gridWrapper: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' },
  gridCard: (t: any) => ({ padding: '2rem', borderRadius: '24px', border: `1px solid ${t.border}`, cursor: 'pointer', transition: '0.3s' }),
  gridCardIcon: (st: string, t: any) => ({ width: 60, height: 60, borderRadius: '18px', background: st === 'ACTIVE' ? `${t.secondary}10` : `${t.danger}10`, color: st === 'ACTIVE' ? t.secondary : t.danger, display:'flex', justifyContent:'center', alignItems:'center' }),

  overlay: { position:'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 2000, padding: '1.5rem' },
  modal: { width: '100%', maxWidth: '700px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' },
  modalHeader: { padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  modalBody: { padding: '2rem' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  fGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: '0.85rem', fontWeight: 700, color: '#64748B' },
  input: { padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  cancelBtn: { padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', background: '#F1F5F9', color: '#64748B', fontWeight: 700, cursor: 'pointer' },
  saveBtn: { padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }
};