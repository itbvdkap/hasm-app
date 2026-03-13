import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Scan, 
  X, 
  Camera, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ScanQrCode 
} from 'lucide-react';

declare const Html5Qrcode: any;

export const ModuleLogin = ({ onLoginSuccess, theme }: any) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // States cho Portal Truy xuất (Theo mẫu hình ảnh)
  const [showPortal, setShowPortal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState<any>(null);
  
  const [report, setReport] = useState({ 
    maTaiSan: '', 
    moTaLoi: '', 
    nguoiBaoCao: '', 
    doKhanCap: 'NORMAL' 
  });
  const [deviceInfo, setDeviceInfo] = useState<string | null>(null);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- LOGIC KIỂM TRA THÔNG TIN MÁY ---
  const validateDevice = async (code: string) => {
    if (!code) return;
    const { data } = await supabase.from('TrangThietBi').select('tenThietBi').eq('maTaiSan', code.trim().toUpperCase()).maybeSingle();
    if (data) {
        setDeviceInfo(data.tenThietBi);
        setSearchError(false);
    } else {
        setDeviceInfo(null);
        setSearchError(true);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { if(report.maTaiSan) validateDevice(report.maTaiSan); }, 500);
    return () => clearTimeout(timer);
  }, [report.maTaiSan]);

  const handleStartScan = async () => {
    setScanning(true);
    setTimeout(async () => {
        const html5QrCode = new Html5Qrcode("portal-scanner-view");
        setScannerInstance(html5QrCode);
        try {
            await html5QrCode.start(
                { facingMode: "environment" }, 
                { fps: 20, qrbox: { width: 200, height: 200 } },
                (text: string) => {
                    setReport(prev => ({ ...prev, maTaiSan: text }));
                    handleStopScan(html5QrCode);
                },
                () => {}
            );
        } catch (err) {
            setScanning(false);
        }
    }, 300);
  };

  const handleStopScan = async (instance = scannerInstance) => {
    if (instance && instance.isScanning) { await instance.stop(); instance.clear(); }
    setScanning(false); setScannerInstance(null);
  };

  const handleSubmit = async () => {
    if (!report.maTaiSan) return alert("Vui lòng nhập mã máy!");
    setLoading(true);
    try {
        await supabase.from('QuanLySuCo').insert([{
            moTaSuCo: `[TRUY XUẤT] ${report.moTaLoi || 'Kiểm kê'}`,
            mucDo: report.doKhanCap,
            trangThaiXuLy: 'OPEN',
            ghiChu: `Mã máy: ${report.maTaiSan} | Người báo cáo: ${report.nguoiBaoCao}`
        }]);
        alert("Đã gửi thông tin thành công!");
        setShowPortal(false);
        setReport({ maTaiSan: '', moTaLoi: '', nguoiBaoCao: '', doKhanCap: 'NORMAL' });
        setDeviceInfo(null);
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const handleAuth = async (e: any) => {
    e.preventDefault(); setLoading(true);
    const { data: user } = await supabase.from('Users').select('*, Roles(roleName)').eq('username', formData.username.trim()).eq('passwordHash', formData.password.trim()).maybeSingle();
    if (user) onLoginSuccess(user); else alert("Sai tài khoản!");
    setLoading(false);
  };

  return (
    <div style={s.wrapper}>
      {!isMobile && (
        <div style={{...s.brandSide, background: theme.primary}}>
            <div style={s.brandContent}><div style={s.logoIcon}>H</div><h1 style={s.brandTitle}>HAMS PRO</h1></div>
        </div>
      )}

      <div style={s.formSide}>
        <div style={s.loginBox}>
            <h2 style={s.formTitle}>Đăng nhập quản lý</h2>
            <form onSubmit={handleAuth} style={s.form}>
                <div style={s.inputGroup}><Mail size={18} color="#94a3b8"/><input style={s.input} placeholder="Tên đăng nhập" onChange={e=>setFormData({...formData, username: e.target.value})}/></div>
                <div style={s.inputGroup}><Lock size={18} color="#94a3b8"/><input style={s.input} type="password" placeholder="Mật khẩu" onChange={e=>setFormData({...formData, password: e.target.value})}/></div>
                <button type="submit" disabled={loading} style={{...s.submitBtn, background: theme.primary}}>Đăng nhập ngay</button>
            </form>
        </div>

        {/* NÚT QUÉT QR MÀU XANH LÁ (MẪU) */}
        <div onClick={() => setShowPortal(true)} style={s.qrCard}>
            <div style={s.qrIconBox}><ScanQrCode size={28} color="#16a34a" /></div>
            <div style={{flex: 1}}>
                <div style={s.qrTitle}>Quét mã QR thiết bị</div>
                <div style={s.qrSub}>Kiểm kê hoặc báo lỗi nhanh không cần ĐN</div>
            </div>
            <button style={s.qrMiniBtn}>Quét mã</button>
        </div>
      </div>

      {/* MODAL TRUY XUẤT THIẾT BỊ (CHÍNH XÁC THEO MẪU ẢNH) */}
      {showPortal && (
        <div style={s.overlay}>
            <div style={s.modal}>
                {/* HEADER - GREEN-600 */}
                <div style={s.modalHeader}>
                    <div style={s.headerIcon}><Scan size={24} color="#fff" /></div>
                    <div style={{flex: 1}}>
                        <h3 style={s.modalTitle}>Truy xuất thiết bị</h3>
                        <p style={s.modalSub}>Quét QR hoặc nhập mã để kiểm tra / báo lỗi</p>
                    </div>
                    <button onClick={()=>{setShowPortal(false); handleStopScan(); setDeviceInfo(null);}} style={s.closeBtn}><X size={24} color="#fff" /></button>
                </div>

                <div style={s.modalBody}>
                    {/* CAMERA AREA */}
                    <div style={s.scannerContainer}>
                        <div id="portal-scanner-view" style={s.cameraView}>
                            {!scanning && (
                                <div onClick={handleStartScan} style={s.cameraPlaceholder}>
                                    <Camera size={32} color="#4ade80" />
                                    <div style={s.scanText}>Đưa mã QR thiết bị vào khung hình</div>
                                </div>
                            )}
                        </div>
                        {scanning && <div style={s.laserLine}></div>}
                        <div style={s.focusFrame}></div>
                    </div>

                    <div style={s.divider}><span>Hoặc</span></div>

                    {/* FORM FIELDS - KHỚP 100% ẢNH */}
                    <div style={{display:'flex', flexDirection:'column', gap: '1.25rem'}}>
                        <div style={s.fGroup}>
                            <label style={s.label}>Nhập mã thiết bị thủ công</label>
                            <input 
                                style={{...s.modalInput, borderColor: searchError ? '#ef4444' : '#e2e8f0'}} 
                                placeholder="VD: MRI-001" 
                                value={report.maTaiSan} 
                                onChange={e=>setReport({...report, maTaiSan: e.target.value})} 
                            />
                            {deviceInfo && <div style={s.infoHint}>✅ {deviceInfo}</div>}
                            {searchError && <div style={s.errorHint}>❌ Mã thiết bị không tồn tại</div>}
                        </div>

                        <div style={s.fGroup}>
                            <label style={s.label}>Mô tả tình trạng lỗi (nếu có)</label>
                            <textarea style={s.modalArea} rows={3} placeholder="Máy không lên nguồn, kêu to..." value={report.moTaLoi} onChange={e=>setReport({...report, moTaLoi: e.target.value})} />
                        </div>

                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: '1rem'}}>
                            <div style={s.fGroup}>
                                <label style={s.label}>Người báo cáo</label>
                                <input style={s.modalInput} placeholder="Tên hoặc Khoa" value={report.nguoiBaoCao} onChange={e=>setReport({...report, nguoiBaoCao: e.target.value})} />
                            </div>
                            <div style={s.fGroup}>
                                <label style={s.label}>Độ khẩn cấp</label>
                                <select style={s.modalInput} value={report.doKhanCap} onChange={e=>setReport({...report, doKhanCap: e.target.value})}>
                                    <option value="NORMAL">Kiểm kê bình thường</option>
                                    <option value="MINOR">Lỗi nhẹ - Vẫn chạy được</option>
                                    <option value="EMERGENCY">Khẩn cấp - Dừng máy</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleSubmit} style={s.confirmBtn}>Xác nhận thông tin</button>
                </div>
            </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `@keyframes scan-move { 0% { top: 10%; } 100% { top: 90%; } }`}} />
    </div>
  );
};

const s: any = {
  wrapper: { height: '100vh', display: 'flex', background: '#F8FAFC', overflow: 'hidden' },
  brandSide: { flex: 1.2, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5rem', color: '#fff' },
  logoIcon: { width: 60, height: 60, background: 'rgba(255,255,255,0.2)', borderRadius: '18px', display:'flex', justifyContent:'center', alignItems:'center', fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' },
  brandTitle: { fontSize: '3rem', fontWeight: 900, margin: 0 },
  formSide: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  loginBox: { width: '100%', maxWidth: '380px' },
  formTitle: { fontSize: '1.8rem', fontWeight: 800, color: '#1E293B', marginBottom: '2rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  inputGroup: { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', padding: '0 1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0' },
  input: { border: 'none', background: 'none', padding: '1rem 0', outline: 'none', flex: 1, fontSize: '0.95rem' },
  submitBtn: { border: 'none', padding: '1.1rem', borderRadius: '16px', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  qrCard: { position: 'absolute', bottom: '2rem', right: '2rem', width: '320px', background: '#F0FDF4', borderLeft: '5px solid #16a34a', padding: '1.25rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', boxShadow: '0 15px 35px rgba(22, 163, 74, 0.1)' },
  qrIconBox: { width: 48, height: 48, background: '#fff', borderRadius: '14px', display:'flex', justifyContent:'center', alignItems:'center' },
  qrTitle: { fontWeight: 800, fontSize: '0.95rem', color: '#166534' },
  qrSub: { fontSize: '0.75rem', color: '#15803D', marginTop: 3 },
  qrMiniBtn: { background: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', color: '#16a34a', fontWeight: 700, fontSize: '0.75rem' },
  overlay: { position:'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 5000, padding: '1.5rem' },
  modal: { background: '#fff', borderRadius: '2rem', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' },
  modalHeader: { background: '#16a34a', padding: '1.5rem 2rem', color: '#fff', display:'flex', alignItems:'center', gap: '1rem' },
  headerIcon: { width: 45, height: 45, background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display:'flex', justifyContent:'center', alignItems:'center' },
  modalTitle: { margin: 0, fontSize: '1.2rem', fontWeight: 800 },
  modalSub: { margin: 0, fontSize: '0.8rem', opacity: 0.9 },
  closeBtn: { background: 'rgba(0,0,0,0.1)', border:'none', borderRadius: '50%', width: 36, height: 36, display:'flex', justifyContent:'center', alignItems:'center', cursor:'pointer' },
  modalBody: { padding: '2rem' },
  scannerContainer: { width:'100%', height: '200px', background: '#111827', borderRadius: '20px', position: 'relative', overflow: 'hidden', marginBottom: '1.5rem' },
  cameraView: { width: '100%', height: '100%' },
  cameraPlaceholder: { height: '100%', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', cursor:'pointer' },
  scanText: { color: '#9ca3af', fontSize: '0.85rem', marginTop: 10 },
  laserLine: { position:'absolute', left: '10%', right: '10%', height: '2px', background: '#4ade80', boxShadow: '0 0 15px #4ade80', zIndex: 10, animation: 'scan-move 2s ease-in-out infinite' },
  focusFrame: { position:'absolute', inset: '20px', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '12px' },
  divider: { display:'flex', alignItems:'center', color: '#94a3b8', fontSize: '0.8rem', margin: '1rem 0', gap: '10px', ':before': { content:'""', flex:1, height:'1px', background:'#e2e8f0' }, ':after': { content:'""', flex:1, height:'1px', background:'#e2e8f0' } },
  fGroup: { display:'flex', flexDirection:'column', gap: 6 },
  label: { fontSize: '0.85rem', fontWeight: 700, color: '#334155' },
  modalInput: { padding: '0.8rem 1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', width:'100%', boxSizing:'border-box' },
  modalArea: { padding: '0.8rem 1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', resize: 'none', width:'100%', boxSizing:'border-box' },
  confirmBtn: { width: '100%', background: '#16a34a', color: '#fff', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', marginTop: '1.5rem', cursor: 'pointer' },
  infoHint: { color: '#16a34a', fontSize: '0.8rem', fontWeight: 700, marginTop: 4 },
  errorHint: { color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, marginTop: 4 }
};