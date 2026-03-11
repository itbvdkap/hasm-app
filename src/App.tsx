import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';

// --- IMPORT MODULES ---
import { ModuleDashboard } from './components/ModuleDashboard';
import { ModuleAssetList } from './components/ModuleAssetList';
import { ModuleAssetDetail } from './components/ModuleAssetDetail';
import { ModuleMaintenance } from './components/ModuleMaintenance';
import { ModuleCatalog } from './components/ModuleCatalog';
import { ModuleReport } from './components/ModuleReport';
import { ModuleMobileQR } from './components/ModuleMobileQR';
import { ModuleLogin } from './components/ModuleLogin';
import { ModuleTransfer } from './components/ModuleTransfer';
import { ModulePublicPortal } from './components/ModulePublicPortal';
import { ModuleSettings } from './components/ModuleSettings';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<string>('DASHBOARD');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [pendingMaint, setPendingMaint] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [badges, setBadges] = useState({ maint: 0, users: 0, transfer: 0 });
  
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [showLogin, setShowLogin] = useState(false);

  // QUẢN LÝ THEME
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('hams_settings');
    return saved ? JSON.parse(saved) : { theme: 'dark', fontSize: 'medium' };
  });

  const isAdmin = session?.Roles?.roleName === 'ADMIN' || session?.username === 'admin';

  const fetchAllData = useCallback(async () => {
    if (!session) return;
    try {
      // 1. Tải tài sản
      let aq = supabase.from('TrangThietBi').select('*, KhoaPhong(tenKhoaPhong, maKhoaPhong), HangSanXuat(tenHangSanXuat), HoSoThietBi(*), LichBaoTri(*), QuanLySuCo(*), SuaChuaChiTiet(*)');
      if (!isAdmin && session.khoaPhongId) aq = aq.eq('khoaPhongId', session.khoaPhongId);
      const { data: ads } = await aq.order('createdAt', { ascending: false });

      // 2. Tải thông báo & Người dùng chờ duyệt
      const [mRes, uRes, tRes, pUsers] = await Promise.all([
        supabase.from('LichBaoTri').select('id', { count: 'exact' }).eq('trangThai', 'PENDING'),
        supabase.from('Users').select('id', { count: 'exact' }).eq('status', 'PENDING'),
        supabase.from('DieuChuyenTaiSan').select('id', { count: 'exact' }).eq('trangThai', 'CHO_DUYET'),
        supabase.from('Users').select('*').eq('status', 'PENDING')
      ]);

      setAssets(ads || []);
      setPendingUsers(pUsers.data || []);
      setBadges({ maint: mRes.count || 0, users: uRes.count || 0, transfer: tRes.count || 0 });
    } catch (e) { console.error(e); }
  }, [session, isAdmin]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const theme = settings.theme === 'dark' ? {
    bg: '#06090f', sidebar: '#0d1520', card: '#111d2e', text: '#e2e8f0', border: '#1a2840', muted: '#64748b'
  } : {
    bg: '#f8fafc', sidebar: '#ffffff', card: '#ffffff', text: '#1e293b', border: '#e2e8f0', muted: '#94a3b8'
  };

  if (!session && !showLogin) return <ModulePublicPortal onGoToLogin={() => setShowLogin(true)} />;
  if (!session && showLogin) return <ModuleLogin onLoginSuccess={setSession} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: 'Inter, sans-serif' }}>
      
      {/* MOBILE MENU TOGGLE */}
      <button style={ui.mobileToggle} onClick={() => setSidebarOpen(!isSidebarOpen)}>☰</button>

      {/* SIDEBAR */}
      <div style={{...ui.sidebar, background: theme.sidebar, borderRight: `1px solid ${theme.border}`, left: isSidebarOpen ? 0 : -280}}>
        <div style={{...ui.logoArea, borderBottom: `1px solid ${theme.border}`}}>
          <h2 style={{ color: '#00d4a8', margin: 0 }}>🏥 HAMS PRO</h2>
          <div style={{ fontSize: 11, color: theme.muted, marginTop: 5 }}>{session.fullName} ({isAdmin ? 'Admin' : 'Khoa'})</div>
        </div>

        <nav style={{ flex: 1, padding: '0 20px' }}>
          <MenuLink active={view==='DASHBOARD'} onClick={()=>{setView('DASHBOARD'); setSidebarOpen(window.innerWidth > 1024);}} icon="📊" label="Dashboard" theme={theme} />
          <MenuLink active={view==='ASSETS'} onClick={()=>{setView('ASSETS'); setSelectedAsset(null); setSidebarOpen(window.innerWidth > 1024);}} icon="📦" label="Tài sản" theme={theme} />
          <MenuLink active={view==='MAINTENANCE'} onClick={()=>{setView('MAINTENANCE'); setSidebarOpen(window.innerWidth > 1024);}} icon="🔧" label="Bảo trì" badge={badges.maint} theme={theme} />
          <MenuLink active={view==='TRANSFER'} onClick={()=>{setView('TRANSFER'); setSidebarOpen(window.innerWidth > 1024);}} icon="🚚" label="Điều chuyển" badge={badges.transfer} theme={theme} />
          {isAdmin && <MenuLink active={view==='CATALOG'} onClick={()=>{setView('CATALOG'); setSidebarOpen(window.innerWidth > 1024);}} icon="📂" label="Danh mục" theme={theme} />}
          <MenuLink active={view==='REPORT'} onClick={()=>{setView('REPORT'); setSidebarOpen(window.innerWidth > 1024);}} icon="📈" label="Báo cáo" theme={theme} />
          <MenuLink active={view==='SETTINGS'} onClick={()=>{setView('SETTINGS'); setSidebarOpen(window.innerWidth > 1024);}} icon="⚙️" label="Cài đặt" theme={theme} />
        </nav>

        <button onClick={() => { setSession(null); setShowLogin(false); }} style={ui.logoutBtn}>🚪 Đăng xuất</button>
      </div>

      {/* OVERLAY FOR MOBILE */}
      {isSidebarOpen && window.innerWidth <= 1024 && <div style={ui.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* MAIN CONTENT */}
      <div style={{ ...ui.mainContent, marginLeft: window.innerWidth > 1024 ? 280 : 0 }}>
        {view === 'DASHBOARD' && <ModuleDashboard assets={assets} pendingUsers={pendingUsers} onRefresh={fetchAllData} theme={theme} />}
        {view === 'ASSETS' && (
          !selectedAsset ? 
          <ModuleAssetList assets={assets} isAdmin={isAdmin} onSelect={setSelectedAsset} onRefresh={fetchAllData} theme={theme} /> : 
          <ModuleAssetDetail asset={selectedAsset} onBack={()=>setSelectedAsset(null)} onRefresh={fetchAllData} session={session} theme={theme} />
        )}
        {view === 'MAINTENANCE' && <ModuleMaintenance />}
        {view === 'TRANSFER' && <ModuleTransfer isAdmin={isAdmin} session={session} onRefresh={fetchAllData} />}
        {view === 'CATALOG' && <ModuleCatalog />}
        {view === 'REPORT' && <ModuleReport assets={assets} />}
        {view === 'SETTINGS' && <ModuleSettings settings={settings} onUpdate={setSettings} />}
      </div>
    </div>
  );
}

const MenuLink = ({ active, onClick, icon, label, badge, theme }: any) => (
  <div onClick={onClick} style={{ 
    padding: '12px 15px', borderRadius: 12, cursor: 'pointer', marginBottom: 5, 
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
    background: active ? '#3b82f6' : 'transparent', color: active ? '#fff' : theme.text
  }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontWeight: active ? 700 : 400, fontSize: 14 }}>{label}</span>
    </div>
    {badge > 0 && <span style={ui.badge}>{badge}</span>}
  </div>
);

const ui: any = {
  sidebar: { width: 280, position: 'fixed', height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', zIndex: 1001, transition: '0.3s' },
  logoArea: { padding: '30px 25px', marginBottom: 20 },
  mainContent: { flex: 1, padding: '20px', boxSizing: 'border-box', transition: '0.3s' },
  badge: { background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 'bold' },
  logoutBtn: { margin: '20px', background: 'none', border: '1px solid #ef444440', color: '#ef4444', padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' },
  mobileToggle: { position: 'fixed', top: 15, left: 15, zIndex: 1002, background: '#3b82f6', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: 8, cursor: 'pointer', display: window.innerWidth > 1024 ? 'none' : 'block' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }
};