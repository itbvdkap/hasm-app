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
import { ModulePublicReport } from './components/ModulePublicReport';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<string>('DASHBOARD');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // STATS CHO NOTIFICATIONS
  const [badges, setBadges] = useState({ maint: 0, users: 0, transfer: 0 });
  const [publicAssetCode, setPublicAssetCode] = useState<string | null>(null);

  const isAdmin = session?.Roles?.roleName === 'ADMIN' || session?.username === 'admin';

  // 1. KIỂM TRA CHẾ ĐỘ QUÉT QR CÔNG KHAI (Báo hỏng không cần login)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('asset');
    if (code) setPublicAssetCode(code);
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      // Tải tài sản
      let aq = supabase.from('TrangThietBi').select('*, KhoaPhong(tenKhoaPhong, maKhoaPhong), HangSanXuat(tenHangSanXuat), HoSoThietBi(*), LichBaoTri(*), QuanLySuCo(*), SuaChuaChiTiet(*)');
      if (!isAdmin && session.khoaPhongId) aq = aq.eq('khoaPhongId', session.khoaPhongId);
      const { data: ads } = await aq.order('createdAt', { ascending: false });

      // Tải thông báo (Badges)
      const [mRes, uRes, tRes] = await Promise.all([
        supabase.from('LichBaoTri').select('id', { count: 'exact' }).eq('trangThai', 'PENDING'),
        supabase.from('Users').select('id', { count: 'exact' }).eq('status', 'PENDING'),
        supabase.from('DieuChuyenTaiSan').select('id', { count: 'exact' }).eq('trangThai', 'CHO_DUYET')
      ]);

      setAssets(ads || []);
      setBadges({ 
        maint: mRes.count || 0, 
        users: uRes.count || 0, 
        transfer: tRes.count || 0 
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [session, isAdmin]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // HIỂN THỊ CỔNG BÁO HỎNG CÔNG KHAI NẾU CÓ MÃ QR
  if (publicAssetCode) {
    return <ModulePublicReport assetCode={publicAssetCode} onFinish={() => setPublicAssetCode(null)} />;
  }

  if (!session) return <ModuleLogin onLoginSuccess={setSession} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#06090f', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDEBAR */}
      <div style={ui.sidebar}>
        <div style={ui.logoArea}>
          <h2 style={{ color: '#00d4a8', margin: 0 }}>🏥 HAMS PRO</h2>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 5 }}>Chào, {session.fullName}</div>
        </div>

        <nav style={{ flex: 1 }}>
          <MenuLink active={view==='DASHBOARD'} onClick={()=>setView('DASHBOARD')} icon="📊" label="Dashboard" />
          <MenuLink active={view==='ASSETS'} onClick={()=>{setView('ASSETS'); setSelectedAsset(null);}} icon="📦" label="Tài sản" />
          <MenuLink active={view==='MAINTENANCE'} onClick={()=>setView('MAINTENANCE')} icon="🔧" label="Bảo trì" badge={badges.maint} />
          <MenuLink active={view==='TRANSFER'} onClick={()=>setView('TRANSFER')} icon="🚚" label="Điều chuyển" badge={badges.transfer} />
          
          {isAdmin && (
            <>
              <MenuLink active={view==='CATALOG'} onClick={()=>setView('CATALOG')} icon="📂" label="Danh mục" />
              <MenuLink active={view==='REPORT'} onClick={()=>setView('REPORT')} icon="📈" label="Báo cáo" />
              <MenuLink active={false} onClick={()=>setView('DASHBOARD')} icon="👥" label="Nhân sự" badge={badges.users} />
            </>
          )}
          <MenuLink active={view==='MOBILE_QR'} onClick={()=>setView('MOBILE_QR')} icon="📱" label="Mobile QR" />
        </nav>

        <button onClick={()=>setSession(null)} style={ui.logoutBtn}>🚪 Đăng xuất</button>
      </div>

      <div style={ui.mainContent}>
        {view === 'DASHBOARD' && <ModuleDashboard assets={assets} pendingUsers={badges.users > 0} onRefresh={fetchAllData} />}
        {view === 'TRANSFER' && <ModuleTransfer isAdmin={isAdmin} session={session} onRefresh={fetchAllData} />}
        {view === 'MAINTENANCE' && <ModuleMaintenance />}
        {view === 'CATALOG' && <ModuleCatalog />}
        {view === 'REPORT' && <ModuleReport assets={assets} />}
        {view === 'MOBILE_QR' && <ModuleMobileQR onScanSuccess={(code: string) => { setView('ASSETS'); setSelectedAsset(assets.find(a=>a.maTaiSan===code)); }} />}
        
        {view === 'ASSETS' && (
          <>
            {!selectedAsset ? (
              <ModuleAssetList assets={assets} isAdmin={isAdmin} onSelect={setSelectedAsset} onRefresh={fetchAllData} />
            ) : (
              <ModuleAssetDetail asset={selectedAsset} onBack={()=>setSelectedAsset(null)} onRefresh={fetchAllData} session={session} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

const MenuLink = ({ active, onClick, icon, label, badge }: any) => (
  <div onClick={onClick} style={{ padding: '14px 20px', borderRadius: 12, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: active ? '#3b82f6' : 'transparent', color: active ? '#fff' : '#64748b' }}>
    <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontWeight: active ? 700 : 400, fontSize: 14 }}>{label}</span>
    </div>
    {badge > 0 && <span style={ui.badge}>{badge}</span>}
  </div>
);

const ui: any = {
  sidebar: { width: 280, background: '#0d1520', padding: '30px 20px', borderRight: '1px solid #1a2840', position: 'fixed', height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  logoArea: { paddingBottom: 30, marginBottom: 25, borderBottom: '1px solid #1a2840' },
  mainContent: { flex: 1, marginLeft: 280, padding: '30px 40px' },
  badge: { background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 'bold' },
  logoutBtn: { width: '100%', background: 'none', border: '1px solid #ef444440', color: '#ef4444', padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', marginTop: 20 }
};