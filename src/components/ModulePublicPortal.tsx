import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

declare const Html5QrcodeScanner: any;

export const ModulePublicPortal = ({ initialCode, onGoToLogin }: any) => {
  const [assetCode, setAssetCode] = useState(initialCode || '');
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'SEARCH' | 'INFO'>(initialCode ? 'INFO' : 'SEARCH');
  const [reportMode, setReportMode] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [reportData, setReportData] = useState({ desc: '', priority: 'NORMAL' });

  useEffect(() => {
    if (initialCode) handleSearch(initialCode);
  }, [initialCode]);

  // --- LOGIC QUÉT QR ---
  useEffect(() => {
    let scanner: any = null;
    if (scanning) {
      scanner = new Html5QrcodeScanner("public-reader", { 
        fps: 10, qrbox: { width: 250, height: 250 } 
      }, false);
      scanner.render((text: string) => {
        setScanning(false);
        scanner.clear();
        handleSearch(text);
      }, (err: any) => {});
    }
    return () => { if (scanner) try { scanner.clear(); } catch(e) {} };
  }, [scanning]);

  const handleSearch = async (code: string) => {
    if (!code) return;
    setLoading(true);
    const { data } = await supabase.from('TrangThietBi')
      .select('*, KhoaPhong(tenKhoaPhong), HoSoThietBi(*)')
      .eq('maTaiSan', code.trim().toUpperCase())
      .maybeSingle();
    
    if (data) {
      setAsset(data);
      setView('INFO');
    } else {
      alert("Không tìm thấy thiết bị có mã: " + code);
    }
    setLoading(false);
  };

  const handleSendReport = async () => {
    if (!reportData.desc) return alert("Vui lòng mô tả lỗi!");
    try {
      await supabase.from('QuanLySuCo').insert([{
        trangThietBiId: asset.id, moTaSuCo: reportData.desc, mucDo: reportData.priority, trangThaiXuLy: 'OPEN'
      }]);
      alert("Đã gửi yêu cầu xử lý thành công!");
      setReportMode(false);
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div style={s.wrapper}>
      <div style={s.nav}>
        <div style={{fontWeight: 'bold', color: '#00d4a8', fontSize: 18}}>🏥 HAMS AN PHÚ</div>
        <button onClick={onGoToLogin} style={s.loginBtn}>Đăng nhập quản lý</button>
      </div>

      <div style={s.container}>
        {view === 'SEARCH' ? (
          <div style={s.searchBox}>
            <h1 style={{color: '#fff', textAlign: 'center'}}>Tra cứu thiết bị y tế</h1>
            <p style={{color: '#64748b', textAlign: 'center', marginBottom: 30}}>Vui lòng quét QR hoặc nhập mã máy để tiếp tục</p>
            
            {scanning ? (
                <div style={{width: '100%', marginBottom: 20}}>
                    <div id="public-reader" style={{width: '100%', borderRadius: 20, overflow: 'hidden', background: '#000'}}></div>
                    <button onClick={() => setScanning(false)} style={s.stopBtn}>Dừng quét mã</button>
                </div>
            ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
                    <div style={s.inputGroup}>
                        <input style={s.mainInput} placeholder="Nhập mã máy (Vd: ANPHU-0001)" value={assetCode} onChange={e => setAssetCode(e.target.value)} />
                        <button onClick={() => handleSearch(assetCode)} style={s.searchBtn}>Tìm kiếm</button>
                    </div>
                    <div style={{textAlign: 'center', color: '#64748b', fontSize: 12}}>HOẶC</div>
                    <button onClick={() => setScanning(true)} style={s.qrStartBtn}>📷 Mở Camera quét mã QR</button>
                </div>
            )}
          </div>
        ) : (
          <div style={s.infoCard}>
            <button onClick={() => { setView('SEARCH'); setAsset(null); setAssetCode(''); }} style={s.backBtn}>← Quay lại</button>
            <div style={s.assetHeader}>
                <div style={s.iconBox}>🩺</div>
                <div>
                    <h2 style={{margin: 0, color: '#fff'}}>{asset.tenThietBi}</h2>
                    <p style={{color: '#00d4a8', fontWeight: 'bold', margin: '5px 0'}}>{asset.maTaiSan}</p>
                </div>
            </div>
            <div style={s.details}>
                <div style={s.detRow}><label>Vị trí:</label> <span>{asset.KhoaPhong?.tenKhoaPhong}</span></div>
                <div style={s.detRow}><label>Model:</label> <span>{asset.modelThietBi || '---'}</span></div>
                <div style={s.detRow}><label>Trạng thái:</label> <span style={{color: asset.trangThai === 'ACTIVE' ? '#22c55e' : '#ef4444'}}>● {asset.trangThai}</span></div>
            </div>
            <div style={{marginTop: 20}}>
                <h4 style={{color: '#fff', marginBottom: 10}}>📄 Tài liệu HDSD</h4>
                {asset.HoSoThietBi?.map((f: any) => (
                    <a key={f.id} href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${f.fileUrl}`} target="_blank" style={s.fileLink}>📖 {f.tenHoSo}</a>
                ))}
            </div>
            <div style={{marginTop: 30, borderTop: '1px solid #1a2840', paddingTop: 20}}>
                {!reportMode ? (
                    <button onClick={() => setReportMode(true)} style={s.reportBtn}>⚠️ Báo hỏng nhanh</button>
                ) : (
                    <div style={s.reportForm}>
                        <textarea style={s.input} rows={3} placeholder="Mô tả lỗi của máy..." onChange={e => setReportData({...reportData, desc: e.target.value})} />
                        <button onClick={handleSendReport} style={s.sendBtn}>Gửi yêu cầu hỗ trợ</button>
                        <button onClick={() => setReportMode(false)} style={s.cancelBtn}>Huỷ</button>
                    </div>
                )}
            </div>
          </div>
        )}
      </div>
      <div style={s.footer}>© 2026 HAMS Pro - Bệnh viện Đa khoa An Phú</div>
    </div>
  );
};

const s: any = {
  wrapper: { minHeight: '100vh', background: '#06090f', display: 'flex', flexDirection: 'column' },
  nav: { padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a2840' },
  loginBtn: { background: 'none', border: '1px solid #3b82f6', color: '#3b82f6', padding: '8px 20px', borderRadius: 8, cursor: 'pointer' },
  container: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 },
  searchBox: { width: '100%', maxWidth: 500 },
  inputGroup: { display: 'flex', gap: 10, background: '#111d2e', padding: 10, borderRadius: 15, border: '1px solid #1a2840' },
  mainInput: { flex: 1, background: 'none', border: 'none', color: '#fff', padding: '10px 15px', outline: 'none', fontSize: 16 },
  searchBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer' },
  qrStartBtn: { background: '#00d4a8', color: '#000', border: 'none', padding: '15px', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', fontSize: 15 },
  stopBtn: { width: '100%', marginTop: 10, background: '#ef4444', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, cursor: 'pointer' },
  infoCard: { width: '100%', maxWidth: 500, background: '#0d1520', padding: 30, borderRadius: 24, border: '1px solid #1a2840' },
  backBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 20 },
  assetHeader: { display: 'flex', gap: 20, alignItems: 'center', marginBottom: 25 },
  iconBox: { width: 60, height: 60, background: '#3b82f620', borderRadius: 15, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 24 },
  details: { background: '#111d2e', padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  detRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, label: { color: '#64748b' }, span: { color: '#fff', fontWeight: 500 } },
  fileLink: { display: 'block', padding: '12px', background: '#06090f', borderRadius: 10, color: '#3b82f6', textDecoration: 'none', marginBottom: 8, fontSize: 13 },
  reportBtn: { width: '100%', background: '#ef4444', color: '#fff', border: 'none', padding: '15px', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer' },
  input: { width: '100%', padding: '12px', background: '#06090f', border: '1px solid #1a2840', color: '#fff', borderRadius: 10, marginBottom: 10, outline: 'none', boxSizing: 'border-box' },
  sendBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', marginRight: 10 },
  cancelBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' },
  footer: { padding: 30, textAlign: 'center', color: '#64748b', fontSize: 12 }
};