import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowLeft, 
  Edit3, 
  AlertTriangle, 
  Image as ImageIcon, 
  Download, 
  Repeat, 
  CalendarPlus, 
  AlertCircle,
  History,
  TrendingUp,
  FileText,
  CheckCircle2,
  MapPin,
  Calendar,
  Zap,
  ChevronRight,
  Info,
  ShieldCheck,
  Cpu,
  ZapOff,
  X,
  Monitor,
  Search
} from 'lucide-react';

export const ModuleAssetDetail = ({ asset, onBack, onRefresh, session, theme, isMobile, isAdmin }: any) => {
  const [activeTab, setActiveTab] = useState('VONG_DOI');
  const [showHealthModal, setShowHealthModal] = useState(false);

  const formatMoney = (v: any) => new Intl.NumberFormat('vi-VN').format(Math.max(0, v || 0)) + ' đ';
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('vi-VN') : '---';

  // --- LOGIC TÍNH KHẤU HAO THỰC TẾ ---
  const depreciation = useMemo(() => {
    const startDate = new Date(asset.createdAt || new Date());
    const now = new Date();
    const totalMonths = 60; // 5 năm khấu hao
    
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    
    const percentUsed = Math.min(100, Math.round((diffMonths / totalMonths) * 100));
    const remainingValue = asset.nguyenGia * (1 - percentUsed / 100);
    
    return { percentUsed, remainingValue, diffMonths };
  }, [asset]);

  // --- LOGIC AI DỰ BÁO ---
  const aiForecast = useMemo(() => {
    if (asset.trangThai === 'BROKEN') return { text: "Cần xử lý sự cố ngay lập tức.", color: theme.danger };
    const health = 100 - depreciation.percentUsed * 0.5; // Sức khỏe linh kiện giảm chậm hơn khấu hao tiền tệ
    if (health < 80) return { text: `Dự đoán: Cần bảo trì khối nguồn trong ${Math.max(1, 15 - depreciation.diffMonths)} ngày tới`, color: theme.warning };
    return { text: "Hệ thống vận hành ổn định. Dự kiến bảo trì định kỳ sau 3 tháng.", color: theme.secondary };
  }, [asset, theme, depreciation]);

  return (
    <div style={{...s.container, background: theme.bg, color: theme.text}}>
      
      {/* HEADER */}
      <div style={s.topNav}>
        <div style={{display:'flex', alignItems:'center', gap: 15}}>
            <button onClick={onBack} style={{...s.backBtn(theme), background: theme.card}}><ArrowLeft size={20}/></button>
            <b style={{fontSize: '1.2rem', color: theme.text}}>{asset.maTaiSan}</b>
        </div>
        <button style={{...s.updateBtn, background: theme.primary}}><Edit3 size={18} /> Cập nhật</button>
      </div>

      {/* HERO CARD */}
      <div className="glass-card" style={{padding: '2.5rem', marginBottom: '2.5rem', background: theme.card, borderRadius: '24px', border: `1px solid ${theme.border}`}}>
        <div style={s.heroGrid(isMobile)}>
            <div style={s.imageColumn}>
                <div style={{...s.deviceImageWrapper, background: theme.bg, borderColor: theme.border}}>
                    <div style={s.imagePlaceholder}><ImageIcon size={48} color={theme.textMuted} /></div>
                    <div style={s.imageStatusBadge(asset.trangThai)}>{asset.trangThai}</div>
                </div>
            </div>

            <div style={s.infoColumn}>
                <div style={{color: theme.primary, fontWeight: 800, fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8}}>Hồ sơ Digital Twin</div>
                <h1 style={{margin: 0, fontSize: '2rem', fontWeight: 800, color: theme.text}}>{asset.tenThietBi}</h1>
                <div style={s.subInfoGrid}>
                    <div style={s.infoItem}><label style={{color: theme.textMuted}}>KHOA PHÒNG</label> <span style={{color: theme.text}}>{asset.KhoaPhong?.tenKhoaPhong}</span></div>
                    <div style={s.infoItem}><label style={{color: theme.textMuted}}>HÃNG SX</label> <span style={{color: theme.text}}>{asset.HangSanXuat?.tenHangSanXuat || '---'}</span></div>
                </div>
                <div style={s.ctaGroup}>
                    <button style={{...s.ctaBtn(theme.primary, theme)}}><Repeat size={16}/> Điều chuyển</button>
                    <button style={{...s.ctaBtn(theme.secondary, theme)}}><CalendarPlus size={16}/> Đặt lịch</button>
                    <button style={{...s.ctaBtn(theme.danger, theme)}}><AlertCircle size={16}/> Báo hỏng</button>
                </div>
            </div>

            <div style={s.qrColumn}>
                <div style={{...s.qrMiniBox, background: theme.bg, borderColor: theme.border}}><QRCodeSVG value={asset.maTaiSan} size={85} /></div>
                <button style={{...s.downloadQrBtn, color: theme.primary}}><Download size={14}/> Tải mã QR</button>
            </div>
        </div>

        {/* --- THANH TÌNH TRẠNG THÔNG MINH (INTERACTIVE HEALTH BAR) --- */}
        <div style={{...s.metricsGrid(isMobile), borderTop: `1.5px solid ${theme.border}`}}>
            <MetricItem label="NGUYÊN GIÁ" val={formatMoney(asset.nguyenGia)} color={theme.text} theme={theme} />
            <MetricItem label={`GIÁ TRỊ CÒN LẠI (${100 - depreciation.percentUsed}%)`} val={formatMoney(depreciation.remainingValue)} color={theme.secondary} theme={theme} />
            
            <div style={s.healthSection} onClick={() => setShowHealthModal(true)}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <label style={{...s.metricLabel, color: theme.textMuted}}>KHẤU HAO THỰC TẾ</label>
                    <b style={{fontSize: '1.1rem', color: depreciation.percentUsed > 80 ? theme.danger : theme.primary}}>{depreciation.percentUsed}% <Info size={14} style={{marginLeft:5}} /></b>
                </div>
                <div style={{...s.healthBarContainer, background: theme.bg}}>
                    <div style={s.healthBar(depreciation.percentUsed, depreciation.percentUsed > 80 ? theme.danger : theme.primary)} />
                </div>
                <div style={{...s.aiForecast, color: aiForecast.color}}>
                    <Zap size={12} fill={aiForecast.color} /> {aiForecast.text}
                </div>
            </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{...s.tabHeader, borderBottom: `2px solid ${theme.border}`}}>
        <TabBtn active={activeTab==='VONG_DOI'} icon={<History size={18}/>} label="Vòng đời" onClick={()=>setActiveTab('VONG_DOI')} theme={theme} />
        <TabBtn active={activeTab==='TAI_CHINH'} icon={<TrendingUp size={18}/>} label="Tài chính" onClick={()=>setActiveTab('TAI_CHINH')} theme={theme} />
        <TabBtn active={activeTab==='HO_SO'} icon={<FileText size={18}/>} label="Hồ sơ" onClick={()=>setActiveTab('HO_SO')} theme={theme} />
      </div>

      <div className="glass-card" style={{padding: '3rem', background: theme.card, borderRadius: '24px', minHeight: '400px', border: `1px solid ${theme.border}`}}>
        {activeTab === 'VONG_DOI' && <VerticalTimeline events={asset.QuanLySuCo} theme={theme} />}
        {activeTab === 'TAI_CHINH' && <div style={{color: theme.textMuted}}>Chức năng đang phát triển...</div>}
        {activeTab === 'HO_SO' && <FilesTab files={asset.HoSoThietBi} theme={theme} />}
      </div>

      {/* --- POPUP CHẨN ĐOÁN CHI TIẾT (HEALTH DIAGNOSTIC) --- */}
      {showHealthModal && (
        <div style={s.overlay}>
            <div style={{...s.modal, background: theme.card, border: `1px solid ${theme.border}`}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom: '2rem'}}>
                    <div style={{display:'flex', alignItems:'center', gap: 10}}>
                        <ShieldCheck size={24} color={theme.secondary} />
                        <h3 style={{margin: 0, fontWeight: 800, color: theme.text}}>Phân tích sức khỏe linh kiện</h3>
                    </div>
                    <button onClick={()=>setShowHealthModal(false)} style={{...s.closeBtn, color: theme.textMuted}}><X size={24}/></button>
                </div>
                <div style={s.diagnosticGrid}>
                    <DiagnosticItem icon={<Zap size={20}/>} label="Khối nguồn công suất" status="Cảnh báo" val={45} color={theme.warning} desc="Tụ điện có dấu hiệu sụt áp nhẹ." theme={theme} />
                    <DiagnosticItem icon={<Cpu size={20}/>} label="Bo mạch xử lý chính" status="Tốt" val={92} color={theme.secondary} desc="Nhiệt độ ổn định 42°C." theme={theme} />
                    <DiagnosticItem icon={<Monitor size={20}/>} label="Màn hình hiển thị" status="Tốt" val={88} color={theme.secondary} desc="Độ sáng đạt tiêu chuẩn." theme={theme} />
                </div>
                <div style={{...s.aiAlertBox, background: theme.warning+'15', color: theme.warning}}>
                    <ZapOff size={20} color={theme.warning} />
                    <div>
                        <b>Khuyến nghị từ HAMS AI:</b>
                        <p style={{margin:'5px 0 0 0', fontSize:'0.85rem'}}>Vui lòng đặt lịch kiểm tra khối nguồn trong 2 tuần tới để tránh tình trạng máy tự ngắt khi đang sử dụng.</p>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

// --- HELPERS ---
const MetricItem = ({ label, val, color, theme }: any) => (
    <div style={s.metricBox}>
        <label style={{...s.metricLabel, color: theme.textMuted}}>{label}</label>
        <div style={{fontSize: '1.2rem', fontWeight: 800, color: color, marginTop: 5}}>{val}</div>
    </div>
);

const DiagnosticItem = ({ icon, label, status, val, color, desc, theme }: any) => (
    <div style={s.diagCard}>
        <div style={{display:'flex', alignItems:'center', gap: 12}}>
            <div style={{...s.diagIcon, color: color, background: `${color}15`}}>{icon}</div>
            <div style={{flex: 1}}>
                <div style={{fontWeight: 700, fontSize: '0.9rem', color: theme.text}}>{label}</div>
                <div style={{fontSize: '0.75rem', color: theme.textMuted}}>{desc}</div>
            </div>
            <b style={{color: color}}>{val}%</b>
        </div>
        <div style={{...s.diagBarBg, background: theme.bg}}><div style={s.diagBar(val, color)} /></div>
    </div>
);

const TabBtn = ({ active, icon, label, onClick, theme }: any) => (
    <button onClick={onClick} style={{
        display:'flex', alignItems:'center', gap: 8, padding: '1rem 2.5rem', borderRadius: '1rem 1rem 0 0', border: 'none', cursor: 'pointer',
        background: active ? theme.card : 'transparent', color: active ? theme.primary : theme.textMuted,
        fontWeight: 700, fontSize: '0.9rem', transition: '0.3s', borderBottom: active ? `3px solid ${theme.primary}` : 'none'
    }}>
        {icon} {label}
    </button>
);

const FilesTab = ({ files, theme }: any) => (
  <div>
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem'}}>
        <h3 style={{margin:0, color: theme.text}}>Document Vault</h3>
        <div style={{...s.searchBox, background: theme.bg, borderColor: theme.border}}>
            <Search size={16} color={theme.textMuted} />
            <input placeholder="Tìm trong tài liệu..." style={{...s.searchInput, color: theme.text}} />
        </div>
    </div>
    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1.5rem'}}>
        {files && files.length > 0 ? files.map((f: any) => (
        <div key={f.id} style={{padding:'1.5rem', background: theme.bg, borderRadius:'16px', display:'flex', flexDirection:'column', alignItems:'center', border:`1px solid ${theme.border}`}}>
            <FileText size={32} color={theme.textMuted} />
            <div style={{fontWeight: 700, marginTop: 10, textAlign:'center', fontSize:'0.9rem', color: theme.text}}>{f.tenTaiLieu || 'Tài liệu'}</div>
            <a href={f.url} target="_blank" rel="noreferrer" style={{marginTop:'1rem', color: theme.primary, fontWeight: 600, fontSize:'0.85rem', textDecoration:'none'}}>Tải về</a>
        </div>
        )) : <div style={{color: theme.textMuted}}>Chưa có hồ sơ đính kèm</div>}
    </div>
  </div>
);

const VerticalTimeline = ({ events, theme }: any) => {
    if (!events || events.length === 0) return <div style={{color: theme.textMuted, fontStyle:'italic'}}>Chưa có lịch sử bảo trì/sự cố</div>;
    return (
    <div style={s.tlContainer}>
        {events.map((e: any, i: number) => (
            <div key={e.id} style={s.tlStep}>
                <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                    <div style={{...s.tlDot, background: e.trangThaiXuLy === 'DONE' ? theme.secondary : theme.danger}} />
                    {i < events.length - 1 && <div style={{...s.tlLine, background: theme.border}} />}
                </div>
                <div style={{...s.tlContent, background: theme.bg, borderLeft: `4px solid ${e.trangThaiXuLy === 'DONE' ? theme.secondary : theme.danger}`}}>
                    <div style={{fontSize:'0.75rem', color: theme.textMuted, marginBottom:5}}>{new Date(e.createdAt).toLocaleDateString('vi-VN')}</div>
                    <b style={{display:'block', marginBottom: 5, color: theme.text}}>{e.moTaSuCo}</b>
                    <p style={{margin:0, fontSize:'0.9rem', color: theme.textMuted}}>{e.ghiChu || 'Không có ghi chú chi tiết.'}</p>
                </div>
            </div>
        ))}
    </div>
    );
};

const s: any = {
  container: { padding: '2.5rem', minHeight: '100vh' },
  topNav: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '2.5rem' },
  backBtn: (t:any) => ({ border: `1px solid ${t.border}`, width: 45, height: 45, borderRadius: '12px', display:'flex', justifyContent:'center', alignItems:'center', cursor:'pointer' }),
  updateBtn: { color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 700, display:'flex', alignItems:'center', gap: 8, cursor:'pointer' },
  
  heroGrid: (isMob: boolean) => ({ display: 'grid', gridTemplateColumns: isMob ? '1fr' : '1.3fr 2.5fr 0.7fr', gap: '3rem', alignItems: 'start' }),
  deviceImageWrapper: { width: '100%', aspectRatio: '1/1', borderRadius: '24px', position: 'relative', overflow: 'hidden', border: '1px solid' },
  imagePlaceholder: { width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center' },
  imageStatusBadge: (st: string) => ({ position:'absolute', top: 20, left: 20, background: '#F59E0B', color: '#fff', padding: '6px 14px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }),
  
  infoColumn: { display:'flex', flexDirection:'column', gap: '1.5rem' },
  subInfoGrid: { display:'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: 10 },
  infoItem: { label: { fontSize: '0.65rem', fontWeight: 800, display:'block', marginBottom: 6 }, span: { fontWeight: 700, fontSize: '1rem' } },
  ctaGroup: { display:'flex', gap: '1rem', marginTop: '1rem' },
  ctaBtn: (color: string, t: any) => ({ flex: 1, background: 'transparent', border: `2.5px solid ${color}`, color: color, padding: '0.8rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', display:'flex', alignItems:'center', justifyContent:'center', gap: 8, cursor:'pointer' }),
  
  qrColumn: { display:'flex', flexDirection:'column', alignItems:'center', gap: 15 },
  qrMiniBox: { padding: '20px', borderRadius: '20px', border: '1.5px solid' },
  downloadQrBtn: { background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 800, cursor:'pointer' },
  
  metricsGrid: (isMob: boolean) => ({ display: 'grid', gridTemplateColumns: isMob ? '1fr' : '1.2fr 1.2fr 2fr', gap: '2.5rem', marginTop: '3.5rem', paddingTop: '3rem' }),
  metricBox: { display:'flex', flexDirection:'column' },
  healthSection: { cursor:'pointer', transition:'0.2s', ':hover': { opacity: 0.8 } },
  metricLabel: { fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.5px' },
  healthBarContainer: { height: 10, borderRadius: 10, marginTop: 12, overflow:'hidden' },
  healthBar: (p: number, c: string) => ({ height: '100%', width: `${p}%`, background: c, borderRadius: 10 }),
  aiForecast: { fontSize: '0.75rem', fontWeight: 700, marginTop: 10, display:'flex', alignItems:'center', gap: 6 },
  
  overlay: { position:'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 5000, padding: '1.5rem' },
  modal: { padding: '2.5rem', borderRadius: '2rem', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  diagnosticGrid: { display:'flex', flexDirection:'column', gap: '1.5rem', marginTop: '1.5rem' },
  diagCard: { display:'flex', flexDirection:'column', gap: 10 },
  diagIcon: { width: 40, height: 40, borderRadius: '10px', display:'flex', justifyContent:'center', alignItems:'center' },
  diagBarBg: { height: 6, borderRadius: 10 },
  diagBar: (p: number, c: string) => ({ height: '100%', width: `${p}%`, background: c, borderRadius: 10 }),
  aiAlertBox: { marginTop: '2.5rem', padding: '1.25rem', borderRadius: '16px', display:'flex', gap: 15, fontSize:'0.9rem' },

  tabHeader: { display:'flex', gap: 5, marginTop: '4rem' },
  tlContainer: { display:'flex', flexDirection:'column' },
  tlStep: { display:'flex', gap: '2rem' },
  tlDot: { width: 14, height: 14, borderRadius: '50%', zIndex: 2, marginTop: 5 },
  tlLine: { flex: 1, width: 3, margin: '8px 0' },
  tlContent: { flex: 1, padding: '1.5rem', borderRadius: '20px', marginBottom: '2rem' },

  searchBox: { display:'flex', alignItems:'center', gap: 10, padding: '0 1rem', borderRadius: '10px', border: '1px solid', width: '250px' },
  searchInput: { border:'none', outline:'none', flex: 1, padding: '0.6rem 0', fontSize: '0.85rem', background: 'none' },
};