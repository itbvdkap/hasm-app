import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const T = { bg: "#06080d", surf: "#0b1017", card: "#111d2e", bdr: "#1a2840", teal: "#00d4a8", blue: "#3b82f6", muted: "#64748b", txt: "#e2e8f0", red: "#ef4444" };

export const ModuleCatalog = () => {
  const [tab, setTab] = useState('KHOA_PHONG');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Cấu hình đầy đủ trường cho từng bảng theo Schema
  const CATALOG_TABS = [
    { 
        id: 'KHOA_PHONG', label: 'Khoa / Phòng', icon: '🏢', table: 'KhoaPhong', 
        fields: [
            { key: 'maKhoaPhong', label: 'Mã khoa (Ngắn)', type: 'text', required: true },
            { key: 'tenKhoaPhong', label: 'Tên đầy đủ', type: 'text', required: true },
            { key: 'toaNha', label: 'Toà nhà', type: 'text' },
            { key: 'tang', label: 'Tầng', type: 'text' },
            { key: 'moTa', label: 'Ghi chú mô tả', type: 'textarea' }
        ]
    },
    { 
        id: 'DM_THIET_BI', label: 'Tên máy chuẩn', icon: '🩺', table: 'DanhMucThietBi',
        fields: [
            { key: 'maThietBi', label: 'Mã loại (Vd: SA01)', type: 'text' },
            { key: 'tenThietBi', label: 'Tên thiết bị chuẩn', type: 'text', required: true }
        ]
    },
    { 
        id: 'HANG_SX', label: 'Hãng sản xuất', icon: '🏭', table: 'HangSanXuat',
        fields: [
            { key: 'tenHangSanXuat', label: 'Tên hãng SX', type: 'text', required: true },
            { key: 'nuocSanXuat', label: 'Nước sản xuất', type: 'text' },
            { key: 'moTa', label: 'Thông tin hãng', type: 'textarea' }
        ]
    },
    { 
        id: 'DON_VI_DV', label: 'Đơn vị dịch vụ', icon: '🛠️', table: 'DonViDichVu',
        fields: [
            { key: 'tenDonVi', label: 'Tên đơn vị sửa chữa', type: 'text', required: true },
            { key: 'soDienThoai', label: 'Số điện thoại', type: 'text' },
            { key: 'diaChi', label: 'Địa chỉ', type: 'text' }
        ]
    },
    { 
        id: 'PHAN_QUYEN', label: 'Nhóm quyền', icon: '🛡️', table: 'Roles',
        fields: [
            { key: 'roleName', label: 'Tên nhóm quyền', type: 'text', required: true },
            { key: 'description', label: 'Mô tả quyền hạn', type: 'text' }
        ]
    }
  ];

  const activeTab = CATALOG_TABS.find(t=>t.id===tab)!;

  const fetchData = async () => {
    setLoading(true);
    const { data: res } = await supabase.from(activeTab.table).select('*').order('id', { ascending: false });
    setData(res || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tab]);

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      if (payload.id) {
        await supabase.from(activeTab.table).update(payload).eq('id', payload.id);
      } else {
        await supabase.from(activeTab.table).insert([payload]);
      }
      alert("Đã lưu thành công!");
      setShowModal(false);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={{margin: 0}}>⚙️ Cấu hình Danh mục</h1>
        <button style={s.addBtn} onClick={() => { setFormData({}); setShowModal(true); }}>+ Thêm mới {activeTab.label}</button>
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
              {activeTab.fields.slice(0, 3).map(f => <th key={f.key} style={s.th}>{f.label}</th>)}
              <th style={{textAlign: 'right'}}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={s.tr}>
                {activeTab.fields.slice(0, 3).map(f => (
                    <td key={f.key} style={s.td}>
                        {f.key.includes('ten') ? <b>{item[f.key]}</b> : item[f.key] || '---'}
                    </td>
                ))}
                <td style={{...s.td, textAlign: 'right'}}>
                  <button onClick={() => { setFormData(item); setShowModal(true); }} style={s.actionBtn}>Sửa</button>
                  <button onClick={async () => {
                    if(confirm("Xoá?")) {
                        const {error} = await supabase.from(activeTab.table).delete().eq('id', item.id);
                        if(error) alert("Dữ liệu đang được sử dụng!"); else fetchData();
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
            <h3 style={{marginTop: 0, color: T.teal}}>Khai báo {activeTab.label}</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
                {activeTab.fields.map(f => (
                    <div key={f.key}>
                        <label style={s.label}>{f.label} {f.required && '*'}</label>
                        {f.type === 'textarea' ? (
                            <textarea style={s.input} value={formData[f.key] || ''} onChange={e => setFormData({...formData, [f.key]: e.target.value})} rows={3} />
                        ) : (
                            <input style={s.input} value={formData[f.key] || ''} onChange={e => setFormData({...formData, [f.key]: e.target.value})} />
                        )}
                    </div>
                ))}
            </div>
            <div style={s.modalActions}>
              <button onClick={() => setShowModal(false)} style={s.cancelBtn}>Bỏ qua</button>
              <button onClick={handleSave} style={s.saveBtn}>Xác nhận lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const s: any = {
  container: { padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 25 },
  addBtn: { background: T.blue, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' },
  tabBar: { display: 'flex', gap: 10, marginBottom: 25, overflowX: 'auto', paddingBottom: 10 },
  tabItem: (active: boolean) => ({ padding: '12px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', background: active ? T.blue : T.card, color: active ? '#fff' : T.muted, fontSize: 13, whiteSpace: 'nowrap' }),
  contentCard: { background: T.card, borderRadius: 16, border: `1px solid ${T.bdr}`, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { background: '#162030', textAlign: 'left', color: T.muted, fontSize: 11, textTransform: 'uppercase', height: 50 },
  td: { padding: '15px 20px', color: T.txt, borderBottom: `1px solid ${T.bdr}`, fontSize: 14 },
  tr: { ':hover': { background: '#ffffff05' } },
  actionBtn: { background: 'none', border: 'none', color: T.blue, fontWeight: 'bold', cursor: 'pointer', marginLeft: 15 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: T.surf, padding: 35, borderRadius: 24, width: 450, border: `1px solid ${T.bdr}` },
  label: { fontSize: 12, color: T.muted, marginBottom: 5, display: 'block' },
  input: { width: '100%', padding: '12px', background: T.bg, border: `1px solid ${T.bdr}`, color: '#fff', borderRadius: 10, outline: 'none', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 15, marginTop: 30 },
  saveBtn: { background: T.teal, color: '#000', border: 'none', padding: '12px 25px', borderRadius: 10, fontWeight: 'bold' },
  cancelBtn: { background: 'none', color: T.muted, border: 'none' }
};