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
  List as ListIcon,
  AlertTriangle,
  Printer,
  X
} from 'lucide-react';

export const ModuleAssetList = ({ assets = [], onSelect, onRefresh, isAdmin, theme, isMobile }: any) => {
  // --- 1. CONFIG COLUMNS ---
  const ALL_COLUMNS = [
    { id: 'maTaiSan', label: 'Mã tài sản', fixed: true },
    { id: 'tenThietBi', label: 'Tên thiết bị', fixed: true },
    { id: 'khoaPhong', label: 'Khoa phòng' },
    { id: 'modelThietBi', label: 'Model' },
    { id: 'serialNumber', label: 'Số Serial' },
    { id: 'hangSanXuat', label: 'Hãng sản xuất' },
    { id: 'namSanXuat', label: 'Năm SX' },
    { id: 'nguyenGia', label: 'Nguyên giá' },
    { id: 'trangThai', label: 'Tình trạng' }
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('hams_asset_cols_v4');
    return saved ? JSON.parse(saved) : ['maTaiSan', 'tenThietBi', 'khoaPhong', 'trangThai'];
  });

  // --- 2. STATES ---
  const [showColPicker, setShowColPicker] = useState(false);
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [depts, setDepts] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({ trangThai: 'ACTIVE' });
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    localStorage.setItem('hams_asset_cols_v4', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    if (showModal) {
        supabase.from('KhoaPhong').select('id, tenKhoaPhong').then(({data}) => setDepts(data || []));
        supabase.from('HangSanXuat').select('id, tenHangSanXuat').then(({data}) => setManufacturers(data || []));
    }
  }, [showModal]);

  // --- 3. LOGIC ---
  const filtered = assets.filter((a: any) => {
    const mSearch = (a.tenThietBi||'').toLowerCase().includes(search.toLowerCase()) || (a.maTaiSan||'').toLowerCase().includes(search.toLowerCase());
    const mStatus = filter === 'ALL' || a.trangThai === filter;
    const mDept = selectedDept === 'ALL' || a.khoaPhongId === selectedDept;
    return mSearch && mStatus && mDept;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map((a: any) => String(a.id)));
  };

  const toggleSelectOne = (id: any) => {
    const sId = String(id);
    setSelectedIds(prev => prev.includes(sId) ? prev.filter(i => i !== sId) : [...prev, sId]);
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Trình duyệt không hỗ trợ giọng nói.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN'; recognition.start(); setIsListening(true);
    recognition.onresult = (e: any) => { setSearch(e.results[0][0].transcript); setIsListening(false); };
    recognition.onerror = () => setIsListening(false);
  };

  const handleExport = (ids?: string[]) => {
    const target = ids ? assets.filter((a:any) => ids.includes(String(a.id))) : filtered;
    const data = target.map((a: any, i: number) => ({
        "STT": i + 1, "Mã tài sản": a.maTaiSan, "Tên thiết bị": a.tenThietBi,
        "Khoa phòng": a.KhoaPhong?.tenKhoaPhong, "Trạng thái": a.trangThai,
        "Nguyên giá": Number(a.nguyenGia).toLocaleString()
    }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets"); XLSX.writeFile(wb, "HAMS_Inventory.xlsx");
  };

  const handleExportBHXH = () => {
    const data = filtered.map((a: any, i: number) => ({
        "STT": i + 1,
        "TEN_TB": a.tenThietBi,
        "KY_HIEU": a.modelThietBi,
        "CONGTY_SX": a.HangSanXuat?.tenHangSanXuat,
        "NUOC_SX": a.NguonGocThietBi?.tenNguonGoc,
        "NAM_SX": a.namSanXuat,
        "NAM_SD": a.namSuDung,
        "MA_MAY": a.maTaiSan,
        "SO_LUU_HANH": a.soLuuHanh,
        "HD_TU": a.hanDungTu,
        "HD_DEN": a.hanDungDen,
        "TU_NGAY": a.tuNgay,
        "DEN_NGAY": a.denNgay
    }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_BHXH"); XLSX.writeFile(wb, "BaoCao_BHXH.xlsx");
  };

  const handleImportBHXH = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            
            // Thử đọc với range: 1 để bỏ qua dòng tiêu đề lớn đầu tiên nếu có
            let rawData: any[] = XLSX.utils.sheet_to_json(ws, { range: 1 });
            
            // Kiểm tra xem đây là file mẫu cũ hay file mới của người dùng
            const isNewFormat = rawData.some(r => r['TÊN TB'] || r['MÃ MÁY  SAU ĐIỀU CHỈNH']);

            if (!confirm(`Hệ thống tìm thấy ${rawData.length} thiết bị. Bạn có muốn nhập vào không?`)) return;

            // Xử lý mapping linh hoạt
            const insertData = rawData.map(row => {
                if (isNewFormat) {
                    return {
                        tenThietBi: row['TÊN TB'] || row['TEN_TB'],
                        modelThietBi: row['KÝ HIỆU'] || row['KY_HIEU'],
                        maTaiSan: String(row['MÃ MÁY  SAU ĐIỀU CHỈNH'] || row['MÃ MÁY  ĐANG ÁP DỤNG'] || row['MA_MAY'] || row['STT']),
                        namSanXuat: String(row['NĂM SẢN XUẤT'] || row['NAM_SX'] || ''),
                        soLuuHanh: row['SỐ LƯU HÀNH'] || row['SO_LUU_HANH'] || '',
                        trangThai: 'ACTIVE'
                    };
                }
                return {
                    tenThietBi: row.TEN_TB,
                    modelThietBi: row.KY_HIEU,
                    maTaiSan: String(row.MA_MAY || row.STT),
                    namSanXuat: row.NAM_SX,
                    soLuuHanh: row.SO_LUU_HANH,
                    trangThai: 'ACTIVE'
                };
            }).filter(item => item.tenThietBi && item.tenThietBi !== 'TÊN TB');

            const { error } = await supabase.from('TrangThietBi').upsert(insertData, { onConflict: 'maTaiSan' });
            if (error) throw error;
            alert("Đã nhập dữ liệu thành công!");
            onRefresh();
        } catch (err: any) { alert("Lỗi Import: " + err.message); }
    };
    reader.readAsBinaryString(file);
  };

  const handleBatchPrint = () => {
    const selectedAssets = assets.filter((a: any) => selectedIds.includes(String(a.id)));
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const labelsHtml = selectedAssets.map((a: any) => `
        <div style="width:50mm; height:30mm; padding:2mm; border:0.1mm solid #eee; page-break-after:always; display:flex; flex-direction:column; font-family:sans-serif;">
            <div style="font-size:6pt; font-weight:bold; border-bottom:0.2mm solid #000; padding-bottom:1mm; margin-bottom:1mm; text-align:center;">BỆNH VIỆN ĐA KHOA HAMS</div>
            <div style="display:flex; gap:2mm; flex:1; align-items:center;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${a.maTaiSan}" style="width:18mm; height:18mm;" />
                <div style="flex:1; display:flex; flex-direction:column; gap:0.5mm;">
                    <div style="font-size:7pt; font-weight:bold;">${a.tenThietBi}</div>
                    <div style="font-size:6pt;">Mã: ${a.maTaiSan}</div>
                    <div style="font-size:6pt;">Model: ${a.modelThietBi || '---'}</div>
                </div>
            </div>
            <div style="font-size:4pt; text-align:center; margin-top:1mm; opacity:0.6;">HAMS PRO 2026</div>
        </div>
    `).join('');
    printWindow.document.write(`<html><body onload="window.print(); window.close();">${labelsHtml}</body></html>`);
    printWindow.document.close();
  };

  const handleBatchStatusUpdate = async (st: string) => {
    if(!window.confirm(`Cập nhật ${selectedIds.length} máy?`)) return;
    await supabase.from('TrangThietBi').update({ trangThai: st }).in('id', selectedIds);
    setSelectedIds([]); onRefresh();
  };

  return (
    <div style={{ paddingBottom: isMobile ? '4rem' : 0 }}>
      {/* 1. BATCH TOOLBAR */}
      {selectedIds.length > 0 && (
          <div style={s.batchToolbar(theme)}>
              <div style={{...s.batchCount, background: theme.primary}}>{selectedIds.length} chọn</div>
              <button onClick={handleBatchPrint} style={s.batchBtn(theme)}><Printer size={16}/> In tem</button>
              <button onClick={()=>handleExport(selectedIds)} style={s.batchBtn(theme)}><FileDown size={16}/> Xuất file</button>
              {isAdmin && <button onClick={()=>handleBatchStatusUpdate('ACTIVE')} style={s.batchBtn(theme)}><CheckCircle2 size={16}/> Sẵn sàng</button>}
              <button onClick={()=>setSelectedIds([])} style={s.batchBtn(theme)}><X size={16}/></button>
          </div>
      )}

      {/* 2. TOP TOOLBAR */}
      <div style={s.toolbar(isMobile)}>
        <div style={s.searchContainer(theme)}>
            <Search size={18} color={theme.textMuted} />
            <input placeholder={isListening ? "Đang nghe..." : "Tìm máy..."} style={{...s.searchInput, color: theme.text}} value={search} onChange={e => setSearch(e.target.value)} />
            <Mic size={18} color={isListening ? theme.danger : theme.primary} style={{cursor:'pointer', animation: isListening ? 'pulse 1.5s infinite' : 'none'}} onClick={handleVoiceSearch} />
        </div>
        <div style={{display:'flex', gap: 10, alignItems:'center'}}>
            <div style={{position:'relative'}}>
                <button onClick={()=>setShowColPicker(!showColPicker)} style={s.configBtn(theme)}><Settings2 size={18}/></button>
                {showColPicker && (
                    <div style={{...s.colPicker(theme), background: theme.card}}>
                        {ALL_COLUMNS.map(c => (
                            <label key={c.id} style={{display:'flex', gap:10, padding:'5px 0', cursor:'pointer', fontSize:'0.85rem', color: theme.text}}>
                                <input type="checkbox" checked={visibleColumns.includes(c.id)} disabled={c.fixed} onChange={e => e.target.checked ? setVisibleColumns([...visibleColumns, c.id]) : setVisibleColumns(visibleColumns.filter(v => v !== c.id))} />
                                {c.label}
                            </label>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={()=>handleExport()} style={s.configBtn(theme)}><FileDown size={18}/></button>
            <div style={s.pillSwitcher(theme)}>
                <button onClick={()=>setViewMode('LIST')} style={s.pillBtn(viewMode==='LIST', theme)}><ListIcon size={16}/></button>
                <button onClick={()=>setViewMode('GRID')} style={s.pillBtn(viewMode==='GRID', theme)}><LayoutGrid size={16}/></button>
            </div>
            {isAdmin && <button onClick={()=>{setFormData({trangThai:'ACTIVE'}); setShowModal(true)}} style={{...s.addBtn, background: theme.primary}}><Plus size={20}/></button>}
        </div>
      </div>

      {/* 3. CONTENT */}
      {viewMode === 'LIST' ? (
        <div style={{...s.tableWrapper(theme), background: theme.card}}>
          <table style={s.table}>
              <thead>
                  <tr style={{borderBottom: `1px solid ${theme.border}`}}>
                      <th style={{padding: '1.25rem', width: 40}}><input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} /></th>
                      {ALL_COLUMNS.filter(c => visibleColumns.includes(c.id)).map(c => <th key={c.id} style={{...s.th, color: theme.textMuted}}>{c.label}</th>)}
                      <th style={s.th}></th>
                  </tr>
              </thead>
              <tbody>
                  {filtered.map(a => {
                      const isSel = selectedIds.includes(String(a.id));
                      return (
                        <tr key={a.id} style={{borderBottom: `1px solid ${theme.border}`, background: isSel ? `${theme.primary}15` : 'transparent'}}>
                            <td style={{padding: '1.25rem', cursor:'pointer'}} onClick={(e)=>{e.stopPropagation(); toggleSelectOne(a.id)}}>
                                <input type="checkbox" checked={isSel} onChange={()=>{}} style={{pointerEvents:'none'}} />
                            </td>
                            {visibleColumns.includes('maTaiSan') && <td onClick={()=>onSelect(a)} style={{...s.td, color: theme.primary, fontWeight: 800, cursor:'pointer'}}>{a.maTaiSan}</td>}
                            {visibleColumns.includes('tenThietBi') && <td onClick={()=>onSelect(a)} style={{...s.td, color: theme.text, fontWeight: 700, cursor:'pointer'}}>{a.tenThietBi}</td>}
                            {visibleColumns.includes('khoaPhong') && <td style={{...s.td, color: theme.text}}>{a.KhoaPhong?.tenKhoaPhong}</td>}
                            {visibleColumns.includes('modelThietBi') && <td style={{...s.td, color: theme.text}}>{a.modelThietBi}</td>}
                            {visibleColumns.includes('serialNumber') && <td style={{...s.td, color: theme.text}}>{a.serialNumber}</td>}
                            {visibleColumns.includes('hangSanXuat') && <td style={{...s.td, color: theme.text}}>{a.HangSanXuat?.tenHangSanXuat}</td>}
                            {visibleColumns.includes('namSanXuat') && <td style={{...s.td, color: theme.text}}>{a.namSanXuat}</td>}
                            {visibleColumns.includes('nguyenGia') && <td style={{...s.td, color: theme.text}}>{Number(a.nguyenGia).toLocaleString()}</td>}
                            {visibleColumns.includes('trangThai') && <td style={s.td}><span style={s.badge(a.trangThai, theme)}>{a.trangThai}</span></td>}
                            <td style={{padding:'1.25rem', textAlign:'right'}}><ChevronRight size={18} color={theme.textMuted}/></td>
                        </tr>
                      )
                  })}
              </tbody>
          </table>
        </div>
      ) : (
        <div style={s.gridWrapper}>
          {filtered.map(a => {
            const isSel = selectedIds.includes(String(a.id));
            return (
                <div key={a.id} style={{...s.gridCard(theme), background: theme.card, borderColor: isSel ? theme.primary : theme.border}}>
                    <div style={{position:'absolute', top: 15, right: 15, zIndex: 10, cursor:'pointer'}} onClick={(e)=>{e.stopPropagation(); toggleSelectOne(a.id)}}>
                        <input type="checkbox" checked={isSel} onChange={()=>{}} style={{width:20, height:20, pointerEvents:'none'}} />
                    </div>
                    <div onClick={()=>onSelect(a)} style={{cursor:'pointer', width:'100%', display:'flex', flexDirection:'column', alignItems:'center'}}>
                        <div style={s.gridCardIcon(a.trangThai, theme)}><Monitor size={32}/></div>
                        <div style={{fontWeight: 800, marginTop: '1rem', color: theme.text, textAlign:'center'}}>{a.tenThietBi}</div>
                        <div style={{color: theme.primary, fontSize: '0.8rem', fontWeight: 800}}>{a.maTaiSan}</div>
                        <div style={{fontSize:'0.75rem', color: theme.textMuted, marginTop: 5}}>{a.KhoaPhong?.tenKhoaPhong}</div>
                    </div>
                </div>
            )
          })}
        </div>
      )}

      {/* 4. MODAL ADD/EDIT */}
      {showModal && (
          <div style={s.overlay}>
              <div style={{...s.modal, background: theme.card, border: `1px solid ${theme.border}`}}>
                  <div style={{padding: '1.5rem', borderBottom: `1px solid ${theme.border}`, display:'flex', justifyContent:'space-between'}}>
                      <h3 style={{margin:0, color: theme.text}}>Thiết lập hồ sơ thiết bị</h3>
                      <button onClick={()=>setShowModal(false)} style={{border:'none', background:'none', cursor:'pointer', color: theme.textMuted}}><X size={20}/></button>
                  </div>
                  <div style={{padding:'2rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem'}}>
                      <div style={s.fGroup}><label style={{...s.label, color: theme.textMuted}}>Mã tài sản *</label><input style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.maTaiSan||''} onChange={e=>setFormData({...formData, maTaiSan: e.target.value})} /></div>
                      <div style={s.fGroup}><label style={{...s.label, color: theme.textMuted}}>Tên thiết bị *</label><input style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.tenThietBi||''} onChange={e=>setFormData({...formData, tenThietBi: e.target.value})} /></div>
                      <div style={s.fGroup}>
                          <label style={{...s.label, color: theme.textMuted}}>Khoa phòng</label>
                          <select style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.khoaPhongId||''} onChange={e=>setFormData({...formData, khoaPhongId: e.target.value})}>
                              <option value="">-- Chọn khoa --</option>
                              {depts.map(d => <option key={d.id} value={d.id}>{d.tenKhoaPhong}</option>)}
                          </select>
                      </div>
                      <div style={s.fGroup}>
                          <label style={{...s.label, color: theme.textMuted}}>Hãng sản xuất</label>
                          <select style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.hangSanXuatId||''} onChange={e=>setFormData({...formData, hangSanXuatId: e.target.value})}>
                              <option value="">-- Chọn hãng --</option>
                              {manufacturers.map(m => <option key={m.id} value={m.id}>{m.tenHangSanXuat}</option>)}
                          </select>
                      </div>
                      <div style={s.fGroup}><label style={{...s.label, color: theme.textMuted}}>Model</label><input style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.modelThietBi||''} onChange={e=>setFormData({...formData, modelThietBi: e.target.value})} /></div>
                      <div style={s.fGroup}><label style={{...s.label, color: theme.textMuted}}>Serial Number</label><input style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.serialNumber||''} onChange={e=>setFormData({...formData, serialNumber: e.target.value})} /></div>
                      <div style={s.fGroup}><label style={{...s.label, color: theme.textMuted}}>Năm sản xuất</label><input type="number" style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.namSanXuat||''} onChange={e=>setFormData({...formData, namSanXuat: e.target.value})} /></div>
                      <div style={s.fGroup}><label style={{...s.label, color: theme.textMuted}}>Nguyên giá (VNĐ)</label><input type="number" style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.nguyenGia||''} onChange={e=>setFormData({...formData, nguyenGia: e.target.value})} /></div>
                  </div>
                  <div style={{padding:'1.5rem', display:'flex', justifyContent:'flex-end', gap: 10, borderTop: `1px solid ${theme.border}`}}>
                      <button onClick={()=>setShowModal(false)} style={{...s.cancelBtn, background: theme.bg, color: theme.textMuted}}>Hủy bỏ</button>
                      <button onClick={async ()=>{
                          if(!formData.maTaiSan || !formData.tenThietBi) return alert("Vui lòng nhập đủ Mã và Tên!");
                          try {
                              const { error } = await supabase.from('TrangThietBi').insert([formData]);
                              if(error) throw error;
                              alert("Đã lưu thiết bị!"); setShowModal(false); onRefresh();
                          } catch(e:any) { alert(e.message); }
                      }} style={{...s.addBtn, background: theme.primary, padding:'0.8rem 2rem', width:'auto'}}>Lưu hồ sơ</button>
                  </div>
              </div>
          </div>
      )}
      <style>{` @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } } `}</style>
    </div>
  );
};

const s: any = {
  toolbar: (isMob: boolean) => ({ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '2rem', flexWrap: isMob ? 'wrap' : 'nowrap', alignItems:'center' }),
  searchContainer: (t: any) => ({ flex: 1, display:'flex', alignItems:'center', gap: 10, padding: '0 1.25rem', background: t.card, borderRadius: '12px', border: `1px solid ${t.border}`, boxShadow: t.shadow }),
  searchInput: { border:'none', outline:'none', flex: 1, padding: '0.8rem 0', fontSize: '0.95rem', background: 'none' },
  pillSwitcher: (t: any) => ({ display: 'flex', background: t.bg, padding: '4px', borderRadius: '10px', border: `1px solid ${t.border}` }),
  pillBtn: (active: boolean, t: any) => ({ border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: active ? t.card : 'transparent', color: active ? t.primary : t.textMuted, transition:'0.3s' }),
  addBtn: { border:'none', width: 45, height: 45, borderRadius: '12px', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  configBtn: (t: any) => ({ background: t.card, border: `1px solid ${t.border}`, color: t.textMuted, width: 45, height: 45, borderRadius: '12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }),
  colPicker: (t: any) => ({ position: 'absolute', top: '110%', right: 0, width: '200px', padding: '1.5rem', borderRadius: '16px', border: `1px solid ${t.border}`, zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }),
  
  tableWrapper: (t: any) => ({ borderRadius: '20px', overflowX: 'auto', border: `1px solid ${t.border}`, boxShadow: t.shadow }),
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
  th: { padding: '1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' },
  td: { padding: '1.25rem', fontSize: '0.9rem' },
  badge: (st: string, t: any) => ({ background: st === 'ACTIVE' ? `${t.secondary}15` : `${t.danger}15`, color: st === 'ACTIVE' ? t.secondary : t.danger, padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }),

  gridWrapper: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' },
  gridCard: (t: any) => ({ padding: '2rem', borderRadius: '24px', border: `1.5px solid ${t.border}`, position: 'relative', transition: '0.3s', boxShadow: t.shadow }),
  gridCardIcon: (st: string, t: any) => ({ width: 60, height: 60, borderRadius: '18px', background: st === 'ACTIVE' ? `${t.secondary}10` : `${t.danger}10`, color: st === 'ACTIVE' ? t.secondary : t.danger, display:'flex', justifyContent:'center', alignItems:'center' }),

  batchToolbar: (t: any) => ({ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: t.card, border: `1px solid ${t.primary}`, padding: '0.8rem 2rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 3000, boxShadow:'0 10px 30px rgba(0,0,0,0.2)' }),
  batchCount: { background: '#2563EB', color: '#fff', padding: '2px 10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800 },
  batchBtn: (t: any) => ({ background: 'none', border: 'none', color: t.text, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }),

  overlay: { position:'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 2000 },
  modal: { width: '100%', maxWidth: '700px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' },
  fGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: '0.85rem', fontWeight: 700 },
  input: { padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  cancelBtn: { padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', background: '#F1F5F9', color: '#64748B', fontWeight: 700, cursor: 'pointer' }
};