import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabaseClient.js';
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  Repeat, 
  ListOrdered, 
  BarChart3, 
  Settings, 
  ScanQrCode, 
  LogOut,
  Sun,
  Moon,
  UserCircle,
  AlertTriangle
} from 'lucide-react';

// --- IMPORT MODULES ---
import { ModuleDashboard } from './components/ModuleDashboard';
import { ModuleAssetList } from './components/ModuleAssetList';
import { ModuleAssetDetail } from './components/ModuleAssetDetail';
import { ModuleMaintenance } from './components/ModuleMaintenance';
import { ModuleCatalog } from './components/ModuleCatalog';
import { ModuleReport } from './components/ModuleReport';
import { ModuleLogin } from './components/ModuleLogin';
import { ModuleTransfer } from './components/ModuleTransfer';
import { ModulePublicPortal } from './components/ModulePublicPortal';
import { ModuleAccount } from './components/ModuleAccount';
import { LoadingSpinner } from './components/LoadingSpinner';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<string>('DASHBOARD');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [badges, setBadges] = useState({ maint: 0, transfer: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('hams_theme') || 'light');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    document.body.setAttribute('data-theme', themeMode);
    localStorage.setItem('hams_theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const handleResize = () => {
        const width = window.innerWidth;
        setIsMobile(width <= 768);
        setIsTablet(width > 768 && width <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const theme = {
    primary: 'var(--primary)',
    secondary: 'var(--secondary)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    bg: 'var(--bg)',
    sidebar: 'var(--sidebar)',
    card: 'var(--card)',
    text: 'var(--text)',
    textMuted: 'var(--text-muted)',
    border: 'var(--border)',
    radius: 'var(--radius-xl)',
    shadow: 'var(--shadow)'
  };

  const isAdmin = session?.Roles?.roleName === 'ADMIN' || session?.username === 'admin';
  const userKhoaPhongId = session?.khoaPhongId;

  const fetchAllData = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      // Thử bảng viết hoa trước (CamelCase)
      let { data: ads, error: assetError } = await supabase.from('TrangThietBi').select(`
        *,
        KhoaPhong(id, tenKhoaPhong),
        HangSanXuat(id, tenHangSanXuat),
        NguonGocThietBi(id, tenNguonGoc),
        LichBaoTri(*),
        HoSoThietBi(*)
      `).order('createdAt', { ascending: false });

      // Nếu lỗi 404 (không tìm thấy bảng), thử bảng viết thường hoàn toàn
      if (assetError && (assetError.code === 'PGRST204' || assetError.message.includes('not find'))) {
          console.log('Retrying with lowercase table names...');
          const { data: retryData, error: retryError } = await supabase.from('trangthietbi').select('*').order('created_at', { ascending: false });
          if (retryError) throw retryError;
          ads = retryData;
      } else if (assetError) {
          throw assetError;
      }

      setAssets(ads || []);

      // Fetch Badges
      const [mRes, tRes] = await Promise.all([
          supabase.from('LichBaoTri').select('id', { count: 'exact', head: true }).eq('trangThai', 'PENDING'),
          supabase.from('DieuChuyenTaiSan').select('id', { count: 'exact', head: true }).eq('trangThai', 'CHO_DUYET')
      ]);
      
      setBadges({ 
          maint: (mRes as any).count || 0, 
          transfer: (tRes as any).count || 0 
      });

    } catch (e: any) { 
        console.error('Fetch All Data Error:', e); 
        setFetchError(`Lỗi kết nối Database: ${e.message}. Vui lòng kiểm tra Biến môi trường trên Vercel.`);
    } finally { 
        setIsLoading(false); 
    }
  }, [session, isAdmin, userKhoaPhongId]);

  useEffect(() => { 
    if (session) fetchAllData(); 
  }, [session, fetchAllData]);

  if (!isConfigured) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#F8FAFC', padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#fff', padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', maxWidth: '500px' }}>
          <AlertTriangle size={64} color="#EF4444" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ margin: '0 0 1rem 0', color: '#1E293B' }}>Thiếu cấu hình hệ thống</h2>
          <p style={{ color: '#64748B', lineHeight: '1.6', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Ứng dụng HAMS PRO chưa được kết nối với cơ sở dữ liệu Supabase. 
            Vui lòng thiết lập <b>VITE_SUPABASE_URL</b> và <b>VITE_SUPABASE_ANON_KEY</b> trong bảng điều khiển Vercel.
          </p>
          <a href="https://vercel.com" target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#2563EB', color: '#fff', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 700 }}>
            Đi tới Vercel Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!session) return <ModuleLogin onLoginSuccess={setSession} theme={theme} />;
  
  if (isLoading && assets.length === 0) return <LoadingSpinner theme={theme} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: "'Inter', sans-serif" }}>
      
      {/* 1. SIDEBAR */}
      {!isMobile && (
        <aside style={{...ui.sidebar, background: theme.sidebar, borderRight: `1px solid ${theme.border}`, width: isTablet ? '80px' : '280px'}}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{...ui.logo, background: theme.primary, margin: '0 auto'}}>H</div>
                {!isTablet && <h2 style={{marginTop: '1rem', fontSize: '1.2rem', fontWeight: 800}}>HAMS PRO</h2>}
            </div>
            <nav style={{ flex: 1, padding: isTablet ? '0 10px' : '0 20px' }}>
                <NavItem active={view==='DASHBOARD'} icon={<LayoutDashboard size={20}/>} label="Tổng quan" onClick={()=>setView('DASHBOARD')} theme={theme} collapsed={isTablet} />
                <NavItem active={view==='ASSETS'} icon={<Package size={20}/>} label="Kho tài sản" onClick={()=>setView('ASSETS')} theme={theme} collapsed={isTablet} />
                <NavItem active={view==='MAINTENANCE'} icon={<Wrench size={20}/>} label="Bảo trì" onClick={()=>setView('MAINTENANCE')} theme={theme} collapsed={isTablet} badge={badges.maint} />
                <NavItem active={view==='TRANSFER'} icon={<Repeat size={20}/>} label="Điều chuyển" onClick={()=>setView('TRANSFER')} theme={theme} collapsed={isTablet} badge={badges.transfer} />
                {isAdmin && <NavItem active={view==='CATALOG'} icon={<ListOrdered size={20}/>} label="Danh mục" onClick={()=>setView('CATALOG')} theme={theme} collapsed={isTablet} />}
                <NavItem active={view==='REPORT'} icon={<BarChart3 size={20}/>} label="Báo cáo" onClick={()=>setView('REPORT')} theme={theme} collapsed={isTablet} />
            </nav>
            <div style={{padding: '1.5rem', borderTop: `1px solid ${theme.border}`}}>
                <button onClick={()=>setSession(null)} style={ui.logoutBtn} title="Đăng xuất"><LogOut size={18}/></button>
            </div>
        </aside>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <main style={{ flex: 1, marginLeft: isMobile ? 0 : (isTablet ? '80px' : '280px'), paddingBottom: isMobile ? '80px' : 0 }}>
        
        <header style={{...ui.header, borderBottom: `1px solid ${theme.border}`}}>
            <div style={{fontWeight: 800, color: theme.primary, display: isMobile ? 'block' : 'none'}}>HAMS PRO</div>
            <div style={{flex: 1}}/>
            <div style={{display:'flex', alignItems:'center', gap: 20}}>
                <button onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')} style={ui.themeToggle}>
                    {themeMode === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
                </button>
                <div onClick={()=>setView('ACCOUNT')} style={{...ui.avatar, border: `2px solid ${theme.primary}40`}}>
                    {session.fullName?.charAt(0) || 'U'}
                </div>
            </div>
        </header>

        {/* Cảnh báo lỗi Fetch */}
        {fetchError && (
            <div style={{ margin: '1rem 3rem', padding: '1rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', display: 'flex', gap: 12, alignItems: 'center', color: '#B91C1C' }}>
                <AlertTriangle size={20} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{fetchError}</div>
                <button onClick={fetchAllData} style={{ marginLeft: 'auto', background: '#B91C1C', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer' }}>Thử lại</button>
            </div>
        )}

        <div style={{ padding: isMobile ? '1.5rem' : '3rem' }}>
            {view === 'DASHBOARD' && <ModuleDashboard assets={assets} theme={theme} isMobile={isMobile} />}
            {view === 'ACCOUNT' && <ModuleAccount session={session} theme={theme} onRefresh={fetchAllData} />}
            {view === 'ASSETS' && (
                !selectedAsset ? 
                <ModuleAssetList assets={assets} theme={theme} isMobile={isMobile} onSelect={setSelectedAsset} onRefresh={fetchAllData} isAdmin={isAdmin} /> : 
                <ModuleAssetDetail asset={selectedAsset} onBack={()=>setSelectedAsset(null)} theme={theme} isMobile={isMobile} session={session} />
            )}
            {view === 'MAINTENANCE' && <ModuleMaintenance theme={theme} isMobile={isMobile} />}
            {view === 'TRANSFER' && <ModuleTransfer theme={theme} isMobile={isMobile} session={session} isAdmin={isAdmin} onRefresh={fetchAllData} />}
            {view === 'CATALOG' && <ModuleCatalog theme={theme} isMobile={isMobile} isAdmin={isAdmin} />}
            {view === 'REPORT' && <ModuleReport assets={assets} theme={theme} isMobile={isMobile} />}
            {view === 'PUBLIC_SCAN' && <ModulePublicPortal theme={theme} onBack={() => setView('DASHBOARD')} />}
        </div>
      </main>

      {/* 3. BOTTOM NAV (MOBILE) */}
      {isMobile && (
        <nav style={{...ui.bottomNav, background: theme.sidebar, borderTop: `1px solid ${theme.border}`}}>
            <BottomItem active={view==='DASHBOARD'} icon={<LayoutDashboard size={22}/>} onClick={()=>setView('DASHBOARD')} theme={theme} />
            <BottomItem active={view==='ASSETS'} icon={<Package size={22}/>} onClick={()=>setView('ASSETS')} theme={theme} />
            <div style={ui.fabContainer}><button onClick={() => setView('PUBLIC_SCAN')} style={{...ui.fab, background: theme.primary}}><ScanQrCode size={28} color="#fff" /></button></div>
            <BottomItem active={view==='MAINTENANCE'} icon={<Wrench size={22}/>} onClick={()=>setView('MAINTENANCE')} theme={theme} />
            <BottomItem active={view==='REPORT'} icon={<BarChart3 size={22}/>} onClick={()=>setView('REPORT')} theme={theme} />
        </nav>
      )}
    </div>
  );
}

const NavItem = ({ active, icon, label, onClick, theme, collapsed, badge }: any) => (
    <div onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', marginBottom: '0.25rem',
        borderRadius: '12px', cursor: 'pointer', transition: '0.3s',
        background: active ? `${theme.primary}15` : 'transparent',
        color: active ? theme.primary : theme.textMuted,
        justifyContent: collapsed ? 'center' : 'flex-start'
    }}>
        {icon}
        {!collapsed && <span style={{fontWeight: active ? 700 : 500, fontSize: '0.9rem'}}>{label}</span>}
        {!collapsed && badge > 0 && <span style={ui.badge}>{badge}</span>}
    </div>
);

const BottomItem = ({ active, icon, onClick, theme }: any) => (
    <div onClick={onClick} style={{ flex: 1, display: 'flex', justifyContent: 'center', color: active ? theme.primary : theme.textMuted }}>
        {icon}
    </div>
);

const ui: any = {
  sidebar: { position: 'fixed', height: '100vh', display: 'flex', flexDirection: 'column', zIndex: 100, transition: '0.3s' },
  logo: { width: '40px', height: '40px', borderRadius: '12px', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 900, fontSize: '1.2rem' },
  header: { height: '70px', display:'flex', alignItems:'center', padding:'0 2.5rem', background: 'var(--glass)', backdropFilter: 'blur(10px)', position:'sticky', top: 0, zIndex: 90 },
  avatar: { width: '38px', height: '38px', borderRadius: '50%', background: '#E2E8F0', display:'flex', justifyContent:'center', alignItems:'center', fontWeight: 700, color: '#64748B', cursor:'pointer' },
  themeToggle: { background:'none', border:'none', cursor:'pointer', padding: 8, borderRadius: '10px', display:'flex', alignItems:'center', color: 'var(--text)' },
  logoutBtn: { width: '100%', background: 'none', border: '1px solid var(--border)', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: 'var(--danger)' },
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', display: 'flex', alignItems: 'center', zIndex: 1000 },
  fabContainer: { position: 'relative', width: '60px', height: '100%' },
  fab: { position: 'absolute', top: '-30px', left: '0', width: '60px', height: '60px', borderRadius: '50%', border: '5px solid var(--bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' },
  badge: { background: '#EF4444', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', marginLeft: 'auto' }
};