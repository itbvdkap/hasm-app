import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, ScanQrCode, X, ArrowRight, AlertTriangle, FileText, MapPin } from 'lucide-react';

declare const Html5QrcodeScanner: any;

export const ModulePublicPortal = ({ initialCode, onGoToLogin, theme }: any) => {
  const [assetCode, setAssetCode] = useState(initialCode || '');
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'SEARCH' | 'INFO'>(initialCode ? 'INFO' : 'SEARCH');
  const [reportMode, setReportMode] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [reportData, setReportData] = useState({ moTa: '', priority: 'NORMAL' });

  useEffect(() => {
    if (initialCode) handleSearch(initialCode);
  }, [initialCode]);

  useEffect(() => {
    let scanner: any = null;
    if (scanning) {
      scanner = new Html5QrcodeScanner("public-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render((text: string) => { setScanning(false); scanner.clear(); handleSearch(text); }, (err: any) => {});
    }
    return () => { if (scanner) try { scanner.clear(); } catch(e) {} };
  }, [scanning]);

  const handleSearch = async (code: string) => {
    if (!code) return;
    setLoading(true);
    const { data } = await supabase.from('TrangThietBi').select('*, KhoaPhong(tenKhoaPhong), HoSoThietBi(*)').eq('maTaiSan', code.trim().toUpperCase()).maybeSingle();
    if (data) { setAsset(data); setView('INFO'); }
    else { alert("Không tìm thấy thiết bị: " + code); }
    setLoading(false);
  };

  const handleSendReport = async () => {
    if (!reportData.moTa) return alert("Vui lòng mô tả lỗi!");
    try {
      await supabase.from('QuanLySuCo').insert([{ trangThietBiId: asset.id, moTaSuCo: reportData.moTa, mucDo: reportData.priority, trangThaiXuLy: 'OPEN' }]);
      alert("Đã gửi báo cáo thành công!"); setReportMode(false);
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div style={s.wrapper}>
      <div style={s.nav}>
        <div style={{fontWeight: 900, color: theme.primary, fontSize: '1.2rem'}}>HAMS PRO</div>
        <button onClick={onGoToLogin} style={s.loginBtn(theme)}>Nhân viên đăng nhập</button>
      </div>

      <div style={s.container}>
        {view === 'SEARCH' ? (
          <div style={s.heroSection}>
            <h1 style={s.mainTitle}>Hệ thống Tra cứu & Báo hỏng</h1>
            <p style={s.subTitle}>Quét mã QR hoặc nhập mã tài sản để xem hướng dẫn sử dụng và yêu cầu sửa chữa.</p>
            
            {scanning ? (
                <div style={s.scannerWrapper}>
                    <div id="public-reader" style={{width: '100%', borderRadius: '20px', overflow: 'hidden'}}></div>
                    <button onClick={() => setScanning(false)} style={s.stopBtn}>Dừng quét mã</button>
                </div>
            ) : (
                <div style={s.actionBox}>
                    <div style={s.inputGroup(theme)}>
                        <Search size={20} color={theme.textMuted} />
                        <input style={s.mainInput} placeholder="Nhập mã máy (Vd: AP-0001)" value={assetCode} onChange={e => setAssetCode(e.target.value)} />
                        <button onClick={() => handleSearch(assetCode)} style={{...s.searchBtn, background: theme.primary}}>Tìm máy</button>
                    </div>
                    <div style={s.divider}><span>HOẶC</span></div>
                    <button onClick={() => setScanning(true)} style={{...s.qrBtn, background: theme.secondary}}>
                        <ScanQrCode size={24} /> <span>Mở Camera quét mã QR</span>
                    </button>
                </div>
            )}
          </div>
        ) : (
          <div className="glass-card" style={s.infoCard}>
            <button onClick={() => { setView('SEARCH'); setAsset(null); setAssetCode(''); }} style={s.backBtn}>← Quay lại tìm kiếm</button>
            <div style={s.assetHeader}>
                <div style={{...s.iconBox, background: `${theme.primary}10`}}><MonitorIcon color={theme.primary}/></div>
                <div>
                    <h2 style={{margin: 0, fontSize: '1.4rem'}}>{asset.tenThietBi}</h2>
                    <p style={{color: theme.primary, fontWeight: 800, margin: '4px 0'}}>{asset.maTaiSan}</p>
                </div>
            </div>
            <div style={s.details(theme)}>
                <div style={s.detRow}><label>Vị trí:</label> <span><MapPin size={12}/> {asset.KhoaPhong?.tenKhoaPhong}</span></div>
                <div style={s.detRow}><label>Trạng thái:</label> <span style={{color: asset.trangThai==='ACTIVE'?theme.secondary:theme.danger}}>● {asset.trangThai}</span></div>
            </div>
            <div style={{marginTop: '1.5rem'}}>
                <h4 style={{fontSize: '0.9rem', marginBottom: '1rem'}}>📄 Hướng dẫn sử dụng & Hồ sơ</h4>
                {asset.HoSoThietBi?.map((f: any) => (
                    <a key={f.id} href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${f.fileUrl}`} target="_blank" style={s.fileLink(theme)}>
                        <FileText size={16} /> {f.tenHoSo}
                    </a>
                ))}
            </div>
            <div style={{marginTop: '2rem', borderTop: `1px solid ${theme.border}`, paddingTop: '1.5rem'}}>
                {!reportMode ? (
                    <button onClick={() => setReportMode(true)} style={s.reportBtn}>⚠️ Báo hỏng thiết bị ngay</button>
                ) : (
                    <div style={s.reportForm}>
                        <textarea style={{...s.input, background: theme.bg, border: `1px solid ${theme.border}`}} rows={3} placeholder="Mô tả tình trạng hỏng hóc..." onChange={e => setReportData({...reportData, moTa: e.target.value})} />
                        <div style={{display:'flex', gap: 10}}>
                            <button onClick={handleSendReport} style={{...s.sendBtn, background: theme.danger}}>Gửi yêu cầu</button>
                            <button onClick={() => setReportMode(false)} style={s.cancelBtn}>Huỷ</button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        )}
      </div>
      <div style={s.footer}>© 2026 HAMS PRO - Bệnh viện Đa khoa An Phú</div>
    </div>
  );
};

const MonitorIcon = ({color}: any) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;

const s: any = {
  wrapper: { minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' },
  nav: { padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  loginBtn: (t: any) => ({ background: 'none', border: `1px solid ${t.border}`, color: t.textMuted, padding: '0.6rem 1.25rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }),
  container: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' },
  heroSection: { width: '100%', maxWidth: '600px', textAlign: 'center' },
  mainTitle: { fontSize: '2.5rem', fontWeight: 900, color: '#1E293B', marginBottom: '1rem', letterSpacing: '-1px' },
  subTitle: { color: '#64748B', fontSize: '1.1rem', marginBottom: '3rem' },
  actionBox: { display:'flex', flexDirection:'column', gap: '1.5rem' },
  inputGroup: (t: any) => ({ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', padding: '8px 8px 8px 20px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }),
  mainInput: { border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '1rem' },
  searchBtn: { border: 'none', padding: '0.8rem 1.5rem', borderRadius: '14px', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  divider: { display:'flex', alignItems:'center', color: '#CBD5E1', fontSize: '0.75rem', fontWeight: 800, gap: 15, ':before': { content: '""', flex: 1, height: 1, background: '#E2E8F0' }, ':after': { content: '""', flex: 1, height: 1, background: '#E2E8F0' } },
  qrBtn: { border: 'none', padding: '1.2rem', borderRadius: '20px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' },
  infoCard: { width: '100%', maxWidth: '480px', padding: '2.5rem', borderRadius: '32px' },
  backBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 },
  assetHeader: { display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '2rem' },
  iconBox: { width: 56, height: 56, borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  details: (t: any) => ({ background: '#F8FAFC', padding: '1.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }),
  detRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', label: { color: '#64748B' }, span: { fontWeight: 600, display:'flex', alignItems:'center', gap: 5 } },
  fileLink: (t: any) => ({ display: 'flex', alignItems:'center', gap: 10, padding: '1rem', background: '#fff', borderRadius: '14px', color: t.primary, textDecoration: 'none', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600, border: `1px solid ${t.border}` }),
  reportBtn: { width: '100%', background: '#EF4444', color: '#fff', border: 'none', padding: '1.1rem', borderRadius: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)' },
  input: { width: '100%', padding: '1.1rem', borderRadius: '14px', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box', fontSize: '0.95rem' },
  sendBtn: { flex: 1, padding: '1rem', borderRadius: '14px', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  cancelBtn: { padding: '1rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 },
  footer: { padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' },
  stopBtn: { width: '100%', marginTop: '1rem', padding: '1rem', borderRadius: '14px', border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700 },
  scannerWrapper: { width: '100%', background: '#000', borderRadius: '24px', padding: '10px' }
};