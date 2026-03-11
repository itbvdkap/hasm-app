import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const ModuleAssetManager = ({ assets, loading }: any) => {
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = assets.filter((a: any) => 
    a.tenThietBi.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.maTaiSan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div>
          <h1>📦 Quản lý Danh mục Tài sản</h1>
          <p style={{ color: '#64748b' }}>Số hóa hồ sơ & Vòng đời thiết bị (Digital Twin)</p>
        </div>
        <button style={ui.addBtn}>+ THÊM TÀI SẢN</button>
      </div>

      <div style={ui.filterBar}>
        <input 
          placeholder="Tìm theo tên, mã tài sản, serial..." 
          style={ui.input} 
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select style={ui.select}><option>Tất cả khoa phòng</option></select>
        <select style={ui.select}><option>Trạng thái: Tất cả</option></select>
      </div>

      <div style={ui.grid}>
        {filtered.map((a: any) => (
          <div key={a.id} style={ui.card} onClick={() => setSelectedAsset(a)}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <QRCodeSVG value={a.id} size={45} bgColor="transparent" fgColor="#00d4a8" />
              <div style={ui.badge(a.trangThai)}>{a.trangThai}</div>
            </div>
            <h3 style={{ margin: '15px 0 5px 0' }}>{a.tenThietBi}</h3>
            <div style={{ fontSize: 12, color: '#64748b' }}>SN: {a.serialNumber} | {a.KhoaPhong?.tenKhoaPhong}</div>
            <div style={ui.healthContainer}>
                <div style={ui.healthLabel}>Sức khỏe: {a.healthScore}%</div>
                <div style={ui.healthBar(a.healthScore)} />
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CHI TIẾT DIGITAL TWIN */}
      {selectedAsset && (
        <div style={ui.modalOverlay}>
          <div style={ui.modalContent}>
            <div style={ui.modalHeader}>
              <h2>Hồ sơ Vòng đời: {selectedAsset.tenThietBi}</h2>
              <button onClick={() => setSelectedAsset(null)} style={ui.closeBtn}>✕</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 30 }}>
              <div style={ui.panel}>
                <h4>📁 HỒ SƠ & THÔNG SỐ KỸ THUẬT</h4>
                <div style={ui.infoGrid}>
                    <p><span>Mã tài sản:</span> {selectedAsset.maTaiSan}</p>
                    <p><span>Hãng SX:</span> {selectedAsset.HangSanXuat?.tenHangSanXuat}</p>
                    <p><span>Model:</span> {selectedAsset.modelThietBi}</p>
                    <p><span>Ngày kiểm định:</span> 15/12/2024</p>
                </div>
                <h4 style={{marginTop: 20}}>📄 TÀI LIỆU ĐÍNH KÈM</h4>
                <div style={ui.docList}>
                    <div style={ui.docItem}>📕 Hóa đơn mua hàng (v1.0)</div>
                    <div style={ui.docItem}>🛡️ Giấy chứng nhận kiểm định (v2.1)</div>
                </div>
              </div>

              <div style={ui.panel}>
                <h4>⏳ TIMELINE VÒNG ĐỜI</h4>
                <div style={ui.timeline}>
                    <div style={ui.timeStep}><b>10/01/2024:</b> Nhập kho mới từ GE</div>
                    <div style={ui.timeStep}><b>15/01/2024:</b> Bàn giao cho Khoa Nội</div>
                    <div style={ui.timeStep}><b>20/06/2024:</b> Bảo trì định kỳ lần 1</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ui: any = {
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 25 },
  addBtn: { background: '#00d4a8', border: 'none', padding: '12px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' },
  filterBar: { display: 'flex', gap: 15, marginBottom: 30 },
  input: { flex: 1, background: '#111d2e', border: '1px solid #1a2840', color: '#fff', padding: '12px', borderRadius: 10 },
  select: { background: '#111d2e', border: '1px solid #1a2840', color: '#fff', padding: '12px', borderRadius: 10 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  card: { background: '#111d2e', padding: 25, borderRadius: 24, border: '1px solid #1a2840', cursor: 'pointer' },
  badge: (s: any) => ({ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: s === 'ACTIVE' ? '#22c55e20' : '#ef444420', color: s === 'ACTIVE' ? '#22c55e' : '#ef4444', fontWeight: 700 }),
  healthContainer: { marginTop: 20 },
  healthLabel: { fontSize: 10, color: '#64748b', marginBottom: 5 },
  healthBar: (s: any) => ({ height: 4, width: '100%', background: '#1a2840', borderRadius: 2, position: 'relative' as any }),
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: '#0d1520', width: 900, padding: 40, borderRadius: 30, border: '1px solid #1a2840', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 30 },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: 24, cursor: 'pointer' },
  panel: { background: '#111d2e', padding: 25, borderRadius: 20 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: 10, fontSize: 13 },
  docList: { display: 'flex', flexDirection: 'column', gap: 10 },
  docItem: { background: '#1a2840', padding: 12, borderRadius: 10, fontSize: 12 },
  timeline: { borderLeft: '2px solid #1a2840', paddingLeft: 20 },
  timeStep: { marginBottom: 20, fontSize: 13 }
};