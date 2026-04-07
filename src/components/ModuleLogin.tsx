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
    if (e) e.preventDefault();
    setLoading(true);
    try {
        // 1. Kiểm tra đăng nhập nhanh (Admin không mật khẩu)
        if (formData.username === 'admin' && !formData.password) {
            onLoginSuccess({
                id: 'admin-id',
                username: 'admin',
                fullName: 'Quản trị viên (Quick Access)',
                Roles: { roleName: 'ADMIN' },
                KhoaPhong: { tenKhoaPhong: 'Phòng Quản trị' }
            });
            setLoading(false);
            return;
        }

        const { data: user } = await supabase.from('Users')
            .select('*, Roles(roleName), KhoaPhong(tenKhoaPhong)')
            .eq('username', formData.username.trim())
            .eq('passwordHash', formData.password.trim())
            .maybeSingle();
        
        if (user) {
            onLoginSuccess(user);
        } else if (formData.username === 'admin' && formData.password === 'admin123') {
            // Fallback cho Admin khi DB trống
            onLoginSuccess({
                id: 'admin-id',
                username: 'admin',
                fullName: 'Quản trị viên Hệ thống',
                Roles: { roleName: 'ADMIN' },
                KhoaPhong: { tenKhoaPhong: 'Phòng Quản trị' }
            });
        } else {
            alert("Sai tài khoản hoặc mật khẩu!");
        }
    } catch (err) {
        // Nếu lỗi kết nối DB, vẫn cho phép admin vào bằng fallback
        if (formData.username === 'admin') {
            onLoginSuccess({ 
                id: 'admin-id', 
                username: 'admin', 
                fullName: 'Quản trị viên (Offline Mode)', 
                Roles: { roleName: 'ADMIN' },
                KhoaPhong: { tenKhoaPhong: 'Phòng Quản trị' }
            });
        } else {
            alert("Lỗi kết nối cơ sở dữ liệu!");
        }
    }
    setLoading(false);
  };

  const handleQuickAdmin = () => {
      setFormData({ username: 'admin', password: '' });
      setTimeout(() => handleAuth(null), 100);
  };

  return (
    <div style={{...s.wrapper, background: theme.bg}}>
      {!isMobile && (
        <div style={{...s.brandSide, background: theme.primary}}>
            <div style={s.brandContent}><div style={s.logoIcon}>H</div><h1 style={s.brandTitle}>HAMS PRO</h1></div>
        </div>
      )}

      <div style={s.formSide}>
        <div style={s.loginBox}>
            <h2 style={{...s.formTitle, color: theme.text}}>Đăng nhập quản lý</h2>
            <form onSubmit={handleAuth} style={s.form}>
                <div style={{...s.inputGroup, background: theme.card, borderColor: theme.border}}><Mail size={18} color={theme.textMuted}/><input style={{...s.input, color: theme.text}} placeholder="Tên đăng nhập" value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})}/></div>
                <div style={{...s.inputGroup, background: theme.card, borderColor: theme.border}}><Lock size={18} color={theme.textMuted}/><input style={{...s.input, color: theme.text}} type="password" placeholder="Mật khẩu" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})}/></div>
                <button type="submit" disabled={loading} style={{...s.submitBtn, background: theme.primary}}>Đăng nhập ngay</button>
                
                <div onClick={handleQuickAdmin} style={{textAlign:'center', marginTop: '1rem', color: theme.primary, cursor:'pointer', fontSize:'0.85rem', fontWeight: 700}}>
                    ⚡ Đăng nhập nhanh (Admin)
                </div>
            </form>
        </div>

        {/* NÚT QUÉT QR MÀU XANH LÁ (MẪU) */}
        <div onClick={() => setShowPortal(true)} style={{...s.qrCard, background: `${theme.secondary}15`, borderColor: theme.secondary, boxShadow: theme.shadow}}>
            <div style={{...s.qrIconBox, background: theme.card}}><ScanQrCode size={28} color={theme.secondary} /></div>
            <div style={{flex: 1}}>
                <div style={{...s.qrTitle, color: theme.secondary}}>Quét mã QR thiết bị</div>
                <div style={{...s.qrSub, color: theme.secondary, opacity: 0.8}}>Kiểm kê hoặc báo lỗi nhanh không cần ĐN</div>
            </div>
            <button style={{...s.qrMiniBtn, color: theme.secondary, background: theme.card}}>Quét mã</button>
        </div>
      </div>

      {/* MODAL TRUY XUẤT THIẾT BỊ (CHÍNH XÁC THEO MẪU ẢNH) */}
      {showPortal && (
        <div style={s.overlay}>
            <div style={{...s.modal, background: theme.card}}>
                {/* HEADER - GREEN-600 */}
                <div style={{...s.modalHeader, background: theme.secondary}}>
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
                                    <Camera size={32} color={theme.secondary} />
                                    <div style={s.scanText}>Đưa mã QR thiết bị vào khung hình</div>
                                </div>
                            )}
                        </div>
                        {scanning && <div style={{...s.laserLine, background: theme.secondary, boxShadow: `0 0 15px ${theme.secondary}`}}></div>}
                        <div style={{...s.focusFrame, borderColor: `${theme.secondary}40`}}></div>
                    </div>

                    <div style={{display:'flex', alignItems:'center', margin: '1.5rem 0', gap: 10}}>
                        <div style={{flex: 1, height: '1px', background: theme.border}} />
                        <span style={{color: theme.textMuted, fontSize: '0.8rem'}}>Hoặc</span>
                        <div style={{flex: 1, height: '1px', background: theme.border}} />
                    </div>

                    {/* FORM FIELDS - KHỚP 100% ẢNH */}
                    <div style={{display:'flex', flexDirection:'column', gap: '1.25rem'}}>
                        <div style={s.fGroup}>
                            <label style={{...s.label, color: theme.text}}>Nhập mã thiết bị thủ công</label>
                            <input 
                                style={{...s.modalInput, background: theme.bg, color: theme.text, borderColor: searchError ? theme.danger : theme.border}} 
                                placeholder="VD: MRI-001" 
                                value={report.maTaiSan} 
                                onChange={e=>setReport({...report, maTaiSan: e.target.value})} 
                            />
                            {deviceInfo && <div style={{...s.infoHint, color: theme.secondary}}>✅ {deviceInfo}</div>}
                            {searchError && <div style={{...s.errorHint, color: theme.danger}}>❌ Mã thiết bị không tồn tại</div>}
                        </div>

                        <div style={s.fGroup}>
                            <label style={{...s.label, color: theme.text}}>Mô tả tình trạng lỗi (nếu có)</label>
                            <textarea style={{...s.modalArea, background: theme.bg, color: theme.text, borderColor: theme.border}} rows={3} placeholder="Máy không lên nguồn, kêu to..." value={report.moTaLoi} onChange={e=>setReport({...report, moTaLoi: e.target.value})} />
                        </div>

                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: '1rem'}}>
                            <div style={s.fGroup}>
                                <label style={{...s.label, color: theme.text}}>Người báo cáo</label>
                                <input style={{...s.modalInput, background: theme.bg, color: theme.text, borderColor: theme.border}} placeholder="Tên hoặc Khoa" value={report.nguoiBaoCao} onChange={e=>setReport({...report, nguoiBaoCao: e.target.value})} />
                            </div>
                            <div style={s.fGroup}>
                                <label style={{...s.label, color: theme.text}}>Độ khẩn cấp</label>
                                <select style={{...s.modalInput, background: theme.bg, color: theme.text, borderColor: theme.border}} value={report.doKhanCap} onChange={e=>setReport({...report, doKhanCap: e.target.value})}>
                                    <option value="NORMAL">Kiểm kê bình thường</option>
                                    <option value="MINOR">Lỗi nhẹ - Vẫn chạy được</option>
                                    <option value="EMERGENCY">Khẩn cấp - Dừng máy</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleSubmit} style={{...s.confirmBtn, background: theme.secondary}}>Xác nhận thông tin</button>
                </div>
            </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `@keyframes scan-move { 0% { top: 10%; } 100% { top: 90%; } }`}} />
    </div>
  );
};

const s: any = {
  wrapper: { height: '100vh', display: 'flex', overflow: 'hidden' },
  brandSide: { flex: 1.2, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5rem', color: '#fff' },
  logoIcon: { width: 60, height: 60, background: 'rgba(255,255,255,0.2)', borderRadius: '18px', display:'flex', justifyContent:'center', alignItems:'center', fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' },
  brandTitle: { fontSize: '3rem', fontWeight: 900, margin: 0 },
  formSide: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  loginBox: { width: '100%', maxWidth: '380px' },
  formTitle: { fontSize: '1.8rem', fontWeight: 800, marginBottom: '2rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  inputGroup: { display: 'flex', alignItems: 'center', gap: 12, padding: '0 1.25rem', borderRadius: '16px', border: '1px solid' },
  input: { border: 'none', background: 'none', padding: '1rem 0', outline: 'none', flex: 1, fontSize: '0.95rem' },
  submitBtn: { border: 'none', padding: '1.1rem', borderRadius: '16px', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  qrCard: { position: 'absolute', bottom: '2rem', right: '2rem', width: '320px', borderLeft: '5px solid', padding: '1.25rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' },
  qrIconBox: { width: 48, height: 48, borderRadius: '14px', display:'flex', justifyContent:'center', alignItems:'center' },
  qrTitle: { fontWeight: 800, fontSize: '0.95rem' },
  qrSub: { fontSize: '0.75rem', marginTop: 3 },
  qrMiniBtn: { border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem' },
  overlay: { position:'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 5000, padding: '1.5rem' },
  modal: { borderRadius: '2rem', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' },
  modalHeader: { padding: '1.5rem 2rem', color: '#fff', display:'flex', alignItems:'center', gap: '1rem' },
  headerIcon: { width: 45, height: 45, background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display:'flex', justifyContent:'center', alignItems:'center' },
  modalTitle: { margin: 0, fontSize: '1.2rem', fontWeight: 800 },
  modalSub: { margin: 0, fontSize: '0.8rem', opacity: 0.9 },
  closeBtn: { background: 'rgba(0,0,0,0.1)', border:'none', borderRadius: '50%', width: 36, height: 36, display:'flex', justifyContent:'center', alignItems:'center', cursor:'pointer' },
  modalBody: { padding: '2rem' },
  scannerContainer: { width:'100%', height: '200px', background: '#111827', borderRadius: '20px', position: 'relative', overflow: 'hidden', marginBottom: '1.5rem' },
  cameraView: { width: '100%', height: '100%' },
  cameraPlaceholder: { height: '100%', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', cursor:'pointer' },
  scanText: { color: '#9ca3af', fontSize: '0.85rem', marginTop: 10 },
  laserLine: { position:'absolute', left: '10%', right: '10%', height: '2px', zIndex: 10, animation: 'scan-move 2s ease-in-out infinite' },
  focusFrame: { position:'absolute', inset: '20px', border: '1px solid', borderRadius: '12px' },
  fGroup: { display:'flex', flexDirection:'column', gap: 6 },
  label: { fontSize: '0.85rem', fontWeight: 700 },
  modalInput: { padding: '0.8rem 1rem', borderRadius: '12px', border: '1.5px solid', outline: 'none', fontSize: '0.9rem', width:'100%', boxSizing:'border-box' },
  modalArea: { padding: '0.8rem 1rem', borderRadius: '12px', border: '1.5px solid', outline: 'none', fontSize: '0.9rem', resize: 'none', width:'100%', boxSizing:'border-box' },
  confirmBtn: { width: '100%', color: '#fff', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', marginTop: '1.5rem', cursor: 'pointer' },
  infoHint: { fontSize: '0.8rem', fontWeight: 700, marginTop: 4 },
  errorHint: { fontSize: '0.8rem', fontWeight: 700, marginTop: 4 }
};