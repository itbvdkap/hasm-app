import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { QRCodeSVG } from 'qrcode.react';

export const ModuleAssetDetail = ({ asset, onBack, onRefresh, session }: any) => {
  const [activeTab, setActiveTab] = useState('LICH_SU');
  const [isUploading, setIsUploading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [depts, setDepts] = useState<any[]>([]);
  const [transferData, setTransferData] = useState({ denKhoaPhongId: '', lyDo: '' });

  useEffect(() => {
    if (showTransferModal) {
        supabase.from('KhoaPhong').select('id, tenKhoaPhong').then(({data}) => setDepts(data || []));
    }
  }, [showTransferModal]);

  const handleCreateTransfer = async () => {
    if (!transferData.denKhoaPhongId) return alert("Vui lòng chọn khoa phòng đến!");
    try {
        const { error } = await supabase.from('DieuChuyenTaiSan').insert([{
            trangThietBiId: asset.id,
            tuKhoaPhongId: asset.khoaPhongId,
            denKhoaPhongId: transferData.denKhoaPhongId,
            nguoiYeuCauId: session.id,
            lyDo: transferData.lyDo,
            trangThai: 'CHO_DUYET'
        }]);
        if (error) throw error;
        alert("Đã gửi yêu cầu điều chuyển! Vui lòng chờ Admin phê duyệt.");
        setShowTransferModal(false);
        if (onRefresh) onRefresh();
    } catch (e: any) { alert(e.message); }
  };

  const formatMoney = (v: any) => new Intl.NumberFormat('vi-VN').format(v || 0) + ' đ';
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('vi-VN') : '---';

  return (
    <div style={ui.container}>
      <div style={{ display: 'none' }} id="hidden-qr"><QRCodeSVG value={asset.maTaiSan} size={80} /></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25 }}>
        <div style={ui.breadcrumb}><span onClick={onBack} style={{ cursor: 'pointer' }}>🏠 Trang chủ</span> → Chi tiết TS</div>
        <div style={{display: 'flex', gap: 10}}>
            <button onClick={() => setShowTransferModal(true)} style={ui.transferBtn}>🚚 Điều chuyển máy</button>
            <button onClick={() => {/* logic print */}} style={ui.printBtn}>🖨️ In tem tài sản</button>
        </div>
      </div>

      <div style={ui.headerCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 30 }}>
            <div style={ui.mainIcon}>🩺</div>
            <div>
              <div style={{ color: '#3b82f6', fontSize: 13, fontWeight: 'bold' }}>{asset.maTaiSan} • S/N: {asset.serialNumber}</div>
              <h1 style={ui.title}>{asset.tenThietBi}</h1>
              <div style={{ display: 'flex', gap: 15, marginTop: 10 }}>
                <span style={ui.tag}>📍 {asset.KhoaPhong?.tenKhoaPhong}</span>
                <span style={ui.tag}>🏭 {asset.HangSanXuat?.tenHangSanXuat}</span>
              </div>
            </div>
          </div>
          <div style={ui.statusBadge(asset.trangThai)}>● {asset.trangThai === 'ACTIVE' ? 'Hoạt động' : 'Sự cố'}</div>
        </div>
        <div style={ui.kpiGrid}>
          <div style={ui.kpiBox}><label>Nguyên giá</label><div>{formatMoney(asset.nguyenGia)}</div></div>
          <div style={ui.kpiBox}><label>Giá trị còn lại</label><div style={{color: '#00d4a8'}}>{formatMoney(asset.giaTriConLai)}</div></div>
          <div style={ui.kpiBox}><label>Khấu hao/tháng</label><div style={{color: '#f59e0b'}}>{formatMoney(Math.round(asset.nguyenGia/60))}</div></div>
          <div style={ui.kpiBox}><label>BT tiếp theo</label><div style={{color: '#3b82f6'}}>{formatDate(asset.ngayHetHanKiemDinh)}</div></div>
        </div>
      </div>

      <div style={ui.tabBar}>
        <button onClick={()=>setActiveTab('LICH_SU')} style={ui.tabItem(activeTab==='LICH_SU')}>🕒 Lịch sử</button>
        <button onClick={()=>setActiveTab('BAO_TRI')} style={ui.tabItem(activeTab==='BAO_TRI')}>🔧 Bảo trì</button>
        <button onClick={()=>setActiveTab('HO_SO')} style={ui.tabItem(activeTab==='HO_SO')}>📎 Hồ sơ ({(asset.HoSoThietBi || []).length})</button>
      </div>

      <div style={ui.contentBody}>
        {activeTab === 'LICH_SU' && <TimelineTab asset={asset} />}
        {/* ... các tab khác ... */}
      </div>

      {/* MODAL ĐIỀU CHUYỂN */}
      {showTransferModal && (
        <div style={ui.modalOverlay}>
            <div style={ui.modalContent}>
                <h3>🚚 Yêu cầu điều chuyển tài sản</h3>
                <p style={{fontSize: 13, color: '#94a3b8'}}>Máy: {asset.tenThietBi} ({asset.maTaiSan})</p>
                <div style={{marginTop: 20, display: 'flex', flexDirection: 'column', gap: 15}}>
                    <div>
                        <label style={{fontSize: 12, color: '#64748b'}}>Khoa phòng đích</label>
                        <select style={ui.input} onChange={e => setTransferData({...transferData, denKhoaPhongId: e.target.value})}>
                            <option value="">-- Chọn khoa tiếp nhận --</option>
                            {depts.filter(d => d.id !== asset.khoaPhongId).map(d => <option key={d.id} value={d.id}>{d.tenKhoaPhong}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{fontSize: 12, color: '#64748b'}}>Lý do điều chuyển</label>
                        <textarea style={ui.input} rows={3} placeholder="Vd: Điều chuyển phục vụ phòng mổ mới..." onChange={e => setTransferData({...transferData, lyDo: e.target.value})} />
                    </div>
                </div>
                <div style={{marginTop: 30, textAlign: 'right'}}>
                    <button onClick={() => setShowTransferModal(false)} style={{background: 'none', border: 'none', color: '#64748b', marginRight: 20}}>Huỷ bỏ</button>
                    <button onClick={handleCreateTransfer} style={ui.confirmBtn}>Gửi yêu cầu</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// ... TimelineTab component ...
const TimelineTab = ({ asset }: any) => (
    <div style={{padding: 20}}>{/* Nội dung timeline như cũ */}</div>
);

const ui: any = {
  container: { padding: '20px' },
  breadcrumb: { color: '#64748b', fontSize: 13 },
  headerCard: { background: '#111d2e', padding: 30, borderRadius: 24, border: '1px solid #1a2840', marginBottom: 30 },
  mainIcon: { width: 70, height: 70, background: '#3b82f620', border: '1px solid #3b82f640', borderRadius: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 32 },
  title: { margin: '5px 0', fontSize: 26, color: '#fff' },
  statusBadge: (s: any) => ({ background: s === 'ACTIVE' ? '#22c55e20' : '#ef444420', color: s === 'ACTIVE' ? '#22c55e' : '#ef4444', padding: '8px 20px', borderRadius: 30, fontSize: 13, fontWeight: 'bold' }),
  tag: { background: '#1a2840', padding: '5px 12px', borderRadius: 8, fontSize: 12, color: '#94a3b8' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 35, paddingTop: 25, borderTop: '1px solid #1a2840' },
  kpiBox: { label: { color: '#64748b', fontSize: 11, marginBottom: 8, display: 'block' }, fontWeight: 'bold', fontSize: 18, color: '#fff' },
  tabBar: { display: 'flex', gap: 10, borderBottom: '1px solid #1a2840', marginBottom: 30 },
  tabItem: (active: boolean) => ({ padding: '12px 25px', border: 'none', background: active ? '#3b82f6' : 'transparent', color: active ? '#fff' : '#64748b', borderRadius: '12px 12px 0 0', cursor: 'pointer' }),
  contentBody: { background: '#111d2e', padding: 30, borderRadius: 24, border: '1px solid #1a2840' },
  transferBtn: { background: '#f59e0b', color: '#000', border: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' },
  printBtn: { background: '#00d4a8', color: '#000', border: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: '#0d1520', padding: 35, borderRadius: 24, width: 450, border: '1px solid #1a2840' },
  input: { width: '100%', padding: '12px', background: '#111d2e', border: '1px solid #1a2840', color: '#fff', borderRadius: 10, outline: 'none', marginTop: 5 },
  confirmBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' }
};