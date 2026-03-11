import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

const T = {
  bg: "#06080d", surf: "#0b1017", card: "#111d2e", bdr: "#1a2840",
  teal: "#00d4a8", blue: "#3b82f6", muted: "#64748b", txt: "#e2e8f0", red: "#ef4444", yellow: "#f59e0b"
};

export const ModuleCatalog = () => {
  const [tab, setTab] = useState('KHOA_PHONG');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // CẤU HÌNH DANH MỤC CHUẨN HOÁ & PHÂN QUYỀN
  const CATALOG_TABS = [
    { id: 'KHOA_PHONG', label: 'Khoa / Phòng', icon: '🏢', table: 'KhoaPhong', cols: [{key: 'tenKhoaPhong', label: 'Tên khoa'}, {key: 'maKhoaPhong', label: 'Mã khoa'}] },
    { id: 'HANG_SX', label: 'Hãng sản xuất', icon: '🏭', table: 'HangSanXuat', cols: [{key: 'tenHangSanXuat', label: 'Tên hãng'}, {key: 'nuocSanXuat', label: 'Nước SX'}] },
    { id: 'DM_THIET_BI', label: 'Tên máy chuẩn', icon: '🩺', table: 'DanhMucThietBi', cols: [{key: 'tenThietBi', label: 'Tên máy'}, {key: 'maThietBi', label: 'Mã loại'}] },
    { id: 'NGUON_GOC', label: 'Nguồn gốc/Dự án', icon: '🌐', table: 'NguonGocThietBi', cols: [{key: 'tenNguonGoc', label: 'Tên nguồn'}] },
    { id: 'NHAN_VIEN', label: 'Nhân viên', icon: '👥', table: 'Users', cols: [{key: 'fullName', label: 'Họ tên'}, {key: 'username', label: 'Tài khoản'}, {key: 'email', label: 'Email'}] },
    { id: 'PHAN_QUYEN', label: 'Nhóm quyền', icon: '🛡️', table: 'Roles', cols: [{key: 'roleName', label: 'Tên nhóm'}, {key: 'description', label: 'Mô tả'}] },
    { id: 'DON_VI_DV', label: 'Đơn vị dịch vụ', icon: '🛠️', table: 'DonViDichVu', cols: [{key: 'tenDonVi', label: 'Tên đơn vị'}, {key: 'soDienThoai', label: 'SĐT'}] }
  ];

  const activeTab = CATALOG_TABS.find(t => t.id === tab)!;

  const fetchData = async () => {
    setLoading(true);
    const { data: res } = await supabase.from(activeTab.table).select('*').order('id', { ascending: false });
    setData(res || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tab]);

  // --- CHỨC NĂNG EXCEL ---
  const downloadTemplate = () => {
    const headers = activeTab.cols.map(c => c.label);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `Mau_Nhap_${activeTab.label}.xlsx`);
  };

  const handleImportExcel = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData: any[] = XLSX.utils.sheet_to_json(ws);
      
      // Map dữ liệu từ label tiếng Việt sang key Database
      const importData = rawData.map(row => {
        const item: any = {};
        activeTab.cols.forEach(c => {
          item[c.key] = row[c.label];
        });
        return item;
      });

      const { error } = await supabase.from(activeTab.table).insert(importData);
      if (error) alert("Lỗi import: " + error.message);
      else { alert(`Đã nhập thành công ${importData.length} bản ghi!`); fetchData(); }
    };
    reader.readAsBinaryString(file);
  };

  // --- CRUD LOGIC ---
  const handleSave = async () => {
    setSaving(true);
    try {
      if (formData.id) await supabase.from(activeTab.table).update(formData).eq('id', formData.id);
      else await supabase.from(activeTab.table).insert([formData]);
      setShowModal(false);
      fetchData();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
            <h1 style={{margin: 0}}>📂 Quản lý danh mục</h1>
            <p style={{color: T.muted, fontSize: 13, marginTop: 5}}>Thiết lập dữ liệu nền tảng cho hệ thống HAMS</p>
        </div>
        <div style={{display: 'flex', gap: 10}}>
            <button style={s.ghostBtn} onClick={downloadTemplate}>📥 Tải file mẫu</button>
            <label style={s.importBtn}>
                📤 Nhập Excel
                <input type="file" hidden onChange={handleImportExcel} accept=".xlsx, .xls" />
            </label>
            <button style={s.addBtn} onClick={() => { setFormData({}); setShowModal(true); }}>+ Thêm bản ghi</button>
        </div>
      </div>

      <div style={s.tabBar}>
        {CATALOG_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={s.tabItem(tab === t.id)}>{t.icon} {t.label}</button>
        ))}
      </div>

      <div style={s.contentCard}>
        <table style={s.table}>
          <thead>
            <tr style={s.thRow}>
              {activeTab.cols.map(c => <th key={c.key} style={s.th}>{c.label}</th>)}
              <th style={{...s.th, textAlign: 'right'}}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={s.tr}>
                {activeTab.cols.map(c => <td key={c.key} style={s.td}>{item[c.key] || '---'}</td>)}
                <td style={{...s.td, textAlign: 'right'}}>
                  <button onClick={() => { setFormData(item); setShowModal(true); }} style={s.actionBtn}>Sửa</button>
                  <button onClick={async () => { 
                    if(confirm("Xoá bản ghi?")) {
                        const {error} = await supabase.from(activeTab.table).delete().eq('id', item.id);
                        if(error) alert("Không thể xoá dữ liệu đang sử dụng!");
                        else fetchData();
                    }
                  }} style={{...s.actionBtn, color: T.red}}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <h3 style={{marginTop: 0, color: T.teal}}>{formData.id ? '📝 Chỉnh sửa' : '➕ Thêm mới'} {activeTab.label}</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
                {activeTab.cols.map(c => (
                    <div key={c.key}>
                        <label style={s.label}>{c.label}</label>
                        <input style={s.input} value={formData[c.key] || ''} onChange={e => setFormData({...formData, [c.key]: e.target.value})} />
                    </div>
                ))}
            </div>
            <div style={s.modalActions}>
              <button onClick={() => setShowModal(false)} style={s.cancelBtn}>Bỏ qua</button>
              <button onClick={handleSave} style={s.saveBtn}>{saving ? 'Đang lưu...' : 'Lưu dữ liệu'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const s: any = {
  container: { padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 30, alignItems: 'center' },
  addBtn: { background: T.blue, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' },
  importBtn: { background: T.teal, color: '#000', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 },
  ghostBtn: { background: 'none', color: T.muted, border: `1px solid ${T.bdr}`, padding: '10px 20px', borderRadius: 8, cursor: 'pointer' },
  tabBar: { display: 'flex', gap: 8, marginBottom: 25, overflowX: 'auto', paddingBottom: 10 },
  tabItem: (active: boolean) => ({
    padding: '12px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
    background: active ? T.blue : T.card, color: active ? '#fff' : T.muted, transition: '0.2s'
  }),
  contentCard: { background: T.card, borderRadius: 16, border: `1px solid ${T.bdr}`, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { background: '#162030' },
  th: { padding: '15px 20px', textAlign: 'left', color: T.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  td: { padding: '18px 20px', color: T.txt, borderBottom: `1px solid ${T.bdr}`, fontSize: 14 },
  tr: { transition: '0.2s', ':hover': { background: '#ffffff05' } },
  actionBtn: { background: 'none', border: 'none', color: T.blue, marginLeft: 15, cursor: 'pointer', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: T.surf, padding: 35, borderRadius: 24, width: 400, border: `1px solid ${T.bdr}`, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  label: { fontSize: 12, color: T.muted, marginBottom: 5, display: 'block' },
  input: { width: '100%', padding: '12px 15px', background: T.bg, border: `1px solid ${T.bdr}`, color: '#fff', borderRadius: 10, boxSizing: 'border-box', outline: 'none' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 15, marginTop: 30 },
  saveBtn: { background: T.teal, color: '#000', border: 'none', padding: '12px 25px', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { background: 'none', color: T.muted, border: 'none', cursor: 'pointer' }
};