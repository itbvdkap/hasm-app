import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

export const ModuleAssetList = ({ assets, onSelect, onRefresh, isAdmin }: any) => {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // State cho việc chọn hàng loạt để in
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [catalogs, setCatalogs] = useState({ 
    depts: [], brands: [], deviceNames: [], origins: [] 
  });
  
  const initialForm = {
    id: null, maTaiSan: '', tenThietBi: '', modelThietBi: '', serialNumber: '',
    trangThai: 'ACTIVE', khoaPhongId: '', hangSanXuatId: '', nguonGocId: '',
    nguyenGia: 0, thoiGianKhauHao: 60, ngayMua: new Date().toISOString().split('T')[0],
    chuKyKiemDinh: 12, loaiTaiSan: 'MEDICAL',
    namSanXuat: new Date().getFullYear(),
    soLuuHanh: '', hopDongTu: '', hopDongDen: ''
  };
  
  const [formData, setFormData] = useState<any>(initialForm);

  useEffect(() => {
    const fetchCatalogs = async () => {
      const [depts, brands, names, origins] = await Promise.all([
        supabase.from('KhoaPhong').select('id, tenKhoaPhong'),
        supabase.from('HangSanXuat').select('id, tenHangSanXuat'),
        supabase.from('DanhMucThietBi').select('id, tenThietBi'),
        supabase.from('NguonGocThietBi').select('id, tenNguonGoc')
      ]);
      setCatalogs({ depts: depts.data || [], brands: brands.data || [], deviceNames: names.data || [], origins: origins.data || [] });
    };
    fetchCatalogs();
  }, [showModal]);

  // --- LOGIC IN TEM HÀNG LOẠT ---
  const handlePrintBatch = () => {
    if (selectedIds.length === 0) return alert("Vui lòng chọn ít nhất một thiết bị để in!");
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const selectedAssets = assets.filter((a: any) => selectedIds.includes(a.id));
    
    let labelsHtml = '';
    selectedAssets.forEach((asset: any) => {
      labelsHtml += `
        <div class="label-page">
          <div class="label-container">
            <div class="qr-side"><img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${asset.maTaiSan}" /></div>
            <div class="info-side">
              <div class="hospital-name">BV ĐA KHOA AN PHÚ</div>
              <div class="asset-name">${asset.tenThietBi}</div>
              <div class="detail-row"><span>S/N:</span> <b>${asset.serialNumber || '---'}</b></div>
              <div class="detail-row"><span>Năm SX:</span> <b>${asset.namSanXuat || '---'}</b></div>
              <div class="detail-row"><span>Khoa:</span> <b>${asset.KhoaPhong?.tenKhoaPhong || '---'}</b></div>
              <div class="asset-id">${asset.maTaiSan}</div>
            </div>
          </div>
        </div>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <style>
            @page { size: 50mm 30mm; margin: 0; }
            body { margin: 0; padding: 0; background: #fff; }
            .label-page { width: 50mm; height: 30mm; page-break-after: always; padding: 5px; box-sizing: border-box; }
            .label-container { border: 0.5px solid #000; height: 28mm; display: flex; gap: 8px; padding: 4px; box-sizing: border-box; overflow: hidden; }
            .qr-side img { width: 18mm; height: 18mm; margin-top: 2mm; }
            .info-side { flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
            .hospital-name { font-size: 6pt; font-weight: bold; border-bottom: 0.5px solid #000; padding-bottom: 1px; white-space: nowrap; }
            .asset-name { font-size: 7.5pt; font-weight: bold; margin: 2px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.1; }
            .detail-row { font-size: 6pt; display: flex; justify-content: space-between; line-height: 1.2; }
            .asset-id { font-size: 8pt; font-weight: bold; text-align: center; border: 0.5px solid #000; margin-top: 1px; background: #000; color: #fff; }
          </style>
        </head>
        <body>${labelsHtml}</body>
        <script>setTimeout(() => { window.print(); window.close(); }, 1000);</script>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSelectAll = (e: any) => {
    if (e.target.checked) setSelectedIds(filtered.map((a: any) => a.id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filtered = assets.filter((a: any) => {
    const match = (a.tenThietBi || '').toLowerCase().includes(search.toLowerCase()) || 
                  (a.maTaiSan || '').toLowerCase().includes(search.toLowerCase());
    return filter === 'ALL' ? match : (match && a.trangThai === filter);
  });

  return (
    <div style={css.container}>
      <div style={css.toolbar}>
        <div style={css.searchWrapper}>
          🔍 <input placeholder="Tìm nhanh thiết bị..." style={css.searchInput} onChange={(e) => setSearch(e.target.value)} />
        </div>
        
        <div style={{display: 'flex', gap: 10}}>
            {selectedIds.length > 0 && (
                <button style={css.printBatchBtn} onClick={handlePrintBatch}>🖨️ In {selectedIds.length} tem</button>
            )}
            <button style={css.excelBtn} onClick={() => {/* Logic export đã có */}}>📤 Xuất Excel</button>
            {isAdmin && (
                <button style={css.addBtn} onClick={() => { setFormData(initialForm); setShowModal(true); }}>+ Thêm TS</button>
            )}
        </div>
      </div>

      <table style={css.table}>
        <thead>
          <tr style={css.thRow}>
            <th style={{paddingLeft: 15}}><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === filtered.length && filtered.length > 0} /></th>
            <th>MÃ TÀI SẢN</th>
            <th>TÊN THIẾT BỊ</th>
            <th>MODEL / SN</th>
            <th>KHOA PHÒNG</th>
            <th>TRẠNG THÁI</th>
            {isAdmin && <th>THAO TÁC</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map((a: any) => (
            <tr key={a.id} style={css.trBody} onClick={() => onSelect(a)}>
              <td style={{paddingLeft: 15}} onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={selectedIds.includes(a.id)} onChange={() => toggleSelect(a.id)} />
              </td>
              <td style={{color: '#3b82f6', fontWeight: 'bold'}}>{a.maTaiSan}</td>
              <td style={{fontWeight: 500}}>{a.tenThietBi}</td>
              <td style={{fontSize: 12, color: '#94a3b8'}}>{a.modelThietBi} <br/> {a.serialNumber}</td>
              <td>{a.KhoaPhong?.tenKhoaPhong || '---'}</td>
              <td><span style={css.badge(a.trangThai)}>{a.trangThai}</span></td>
              {isAdmin && (
                <td onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setFormData(a); setShowModal(true); }} style={css.editBtn}>✏️ Sửa</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL THÊM/SỬA (Giữ nguyên như cũ) */}
      {showModal && isAdmin && (
        <div style={css.modalOverlay}>
          <div style={css.modalContent}>
            <h2 style={{color: '#00d4a8'}}>{formData.id ? '📝 Cập Nhật' : '➕ Thêm Mới'}</h2>
            {/* Form nội dung giữ nguyên... */}
            <div style={{marginTop: 30, textAlign: 'right'}}>
                <button onClick={() => setShowModal(false)} style={{marginRight: 20, background: 'none', border: 'none', color: '#64748b'}}>Huỷ</button>
                <button onClick={async () => { /* Logic save */ }} style={css.saveBtn}>Lưu dữ liệu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const css: any = {
  container: { background: '#0d1520', padding: '20px', borderRadius: '15px' },
  toolbar: { display: 'flex', justifyContent: 'space-between', marginBottom: 25, gap: 15, alignItems: 'center' },
  searchWrapper: { flex: 1, background: '#111d2e', borderRadius: 10, padding: '10px 15px', border: '1px solid #1a2840' },
  searchInput: { background: 'none', border: 'none', color: '#fff', outline: 'none', marginLeft: 10, width: '80%' },
  printBatchBtn: { background: '#a855f7', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' },
  excelBtn: { background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  addBtn: { background: '#00d4a8', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { textAlign: 'left', color: '#64748b', fontSize: 11, borderBottom: '1px solid #1a2840', height: 45 },
  trBody: { borderBottom: '1px solid #1a2840', cursor: 'pointer', transition: '0.2s' },
  badge: (s: string) => ({ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 'bold', background: s === 'ACTIVE' ? '#22c55e20' : '#ef444420', color: s === 'ACTIVE' ? '#22c55e' : '#ef4444' }),
  editBtn: { background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: '#0d1520', padding: 30, borderRadius: 24, width: 600, border: '1px solid #1a2840' },
  saveBtn: { background: '#00d4a8', color: '#000', border: 'none', padding: '12px 35px', borderRadius: 10, fontWeight: 'bold' }
};