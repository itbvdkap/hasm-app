import { useMemo } from 'react';
import { 
  Monitor, 
  Activity, 
  Wrench, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle2,
  PieChart,
  History,
  ShieldCheck
} from 'lucide-react';

export const ModuleDashboard = ({ assets = [], theme, isMobile }: any) => {
  
  const d = useMemo(() => {
    const total = assets.length || 1;
    const active = assets.filter((a: any) => a.trangThai === 'ACTIVE').length;
    const maint = assets.filter((a: any) => a.trangThai === 'MAINTENANCE').length;
    const broken = assets.filter((a: any) => a.trangThai === 'BROKEN').length;
    
    // Tỷ lệ sức khỏe thiết bị
    const activePercent = Math.round((active / total) * 100);
    const brokenPercent = Math.round((broken / total) * 100);

    return { total, active, maint, broken, activePercent, brokenPercent };
  }, [assets]);

  return (
    <div style={{ color: theme.text }}>
      {/* HEADER TỐI GIẢN */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: isMobile ? '1.5rem' : '2.2rem' }}>Tổng quan vận hành</h2>
        <p style={{ color: theme.textMuted, marginTop: '0.5rem' }}>Chào buổi sáng! Hệ thống đang quản lý <b>{d.total}</b> thiết bị y tế.</p>
      </div>

      {/* WIDGET CARDS GRID */}
      <div style={s.statsGrid(isMobile)}>
        <WidgetCard label="TỔNG THIẾT BỊ" val={d.total} color={theme.primary} icon={<Monitor size={24}/>} theme={theme} />
        <WidgetCard label="ĐANG HOẠT ĐỘNG" val={d.active} color={theme.secondary} icon={<CheckCircle2 size={24}/>} theme={theme} />
        <WidgetCard label="CẦN BẢO TRÌ" val={d.maint} color={theme.warning} icon={<Wrench size={24}/>} theme={theme} />
        <WidgetCard label="ĐANG SỰ CỐ" val={d.broken} color={theme.danger} icon={<AlertCircle size={24}/>} theme={theme} />
      </div>

      {/* DATA VISUALIZATION SECTION */}
      <div style={s.mainGrid(isMobile)}>
        
        {/* DONUT CHART SIMULATION (SOFT UI STYLE) */}
        <div className="glass-card" style={{ padding: '2rem', background: theme.card, borderRadius: '24px', border: `1px solid ${theme.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: '2rem' }}>
                <PieChart size={20} color={theme.primary} />
                <b style={{ fontSize: '1rem', color: theme.text }}>Tỷ lệ sức khỏe hệ thống</b>
            </div>
            <div style={s.donutWrapper}>
                <div style={s.donut(d.activePercent, theme.secondary, theme.bg)}>
                    <div style={{...s.donutInner, background: theme.card}}>
                        <div style={{fontSize: '2rem', fontWeight: 800, color: theme.text}}>{d.activePercent}%</div>
                        <div style={{fontSize: '0.7rem', color: theme.textMuted}}>HOẠT ĐỘNG TỐT</div>
                    </div>
                </div>
            </div>
            <div style={{ marginTop: '2rem', display:'flex', justifyContent:'space-around' }}>
                <LegendItem label="Sẵn sàng" color={theme.secondary} theme={theme} />
                <LegendItem label="Sự cố" color={theme.danger} theme={theme} />
                <LegendItem label="Bảo trì" color={theme.warning} theme={theme} />
            </div>
        </div>

        {/* TIMELINE - CÁC CA KỸ THUẬT GẦN ĐÂY */}
        <div className="glass-card" style={{ padding: '2rem', background: theme.card, borderRadius: '24px', border: `1px solid ${theme.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: '2rem' }}>
                <Activity size={20} color={theme.primary} />
                <b style={{ fontSize: '1rem', color: theme.text }}>Dải thời gian kỹ thuật (Hôm nay)</b>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap: '1.5rem' }}>
                <TimelineItem time="08:30" title="Kiểm định máy X-Quang" loc="Khoa CĐHA" color={theme.primary} theme={theme} />
                <TimelineItem time="10:15" title="Sửa lỗi nguồn Monitor" loc="Khoa HSCC" color={theme.danger} theme={theme} />
                <TimelineItem time="14:00" title="Bảo trì hệ thống Oxy" loc="Toà nhà A" color={theme.warning} theme={theme} />
                <TimelineItem time="16:45" title="Bàn giao máy Siêu âm" loc="Khoa Sản" color={theme.secondary} theme={theme} />
            </div>
        </div>

        {/* SYSTEM AUDIT LOG */}
        <div className="glass-card" style={{ gridColumn: isMobile ? 'span 1' : 'span 2', padding: '2rem', background: theme.card, borderRadius: '24px', border: `1px solid ${theme.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: '2rem' }}>
                <ShieldCheck size={20} color={theme.primary} />
                <b style={{ fontSize: '1rem', color: theme.text }}>Nhật ký kiểm toán hệ thống</b>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap: '1rem' }}>
                <AuditItem user="admin" action="Cập nhật thông tin TS-001" time="2 phút trước" theme={theme} />
                <AuditItem user="kythuat_01" action="Bắt đầu xử lý sự cố SC-102" time="15 phút trước" theme={theme} />
                <AuditItem user="bs_lan" action="Báo hỏng máy Monitor M-02" time="1 giờ trước" theme={theme} />
                <AuditItem user="admin" action="Thêm mới người dùng: bs_minh" time="3 giờ trước" theme={theme} />
            </div>
        </div>

      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const WidgetCard = ({ label, val, color, icon, theme }: any) => (
    <div className="glass-card" style={{ padding: '1.5rem', background: theme.card, borderRadius: '20px', display:'flex', alignItems:'center', gap: '1.25rem', border: `1px solid ${theme.border}` }}>
        <div style={{ width: 50, height: 50, background: `${color}10`, color: color, borderRadius: '15px', display:'flex', justifyContent:'center', alignItems:'center' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.7rem', color: theme.textMuted, fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.text }}>{val}</div>
        </div>
    </div>
);

const LegendItem = ({ label, color, theme }: any) => (
    <div style={{ display:'flex', alignItems:'center', gap: 8, fontSize: '0.8rem', fontWeight: 600, color: theme.text }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <span>{label}</span>
    </div>
);

const TimelineItem = ({ time, title, loc, color, theme }: any) => (
    <div style={{ display:'flex', gap: '1.5rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: theme.textMuted, width: 40 }}>{time}</div>
        <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: '1.25rem', position:'relative' }}>
            <div style={{ position:'absolute', left: -6, top: 0, width: 9, height: 9, borderRadius:'50%', background: color }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: theme.text }}>{title}</div>
            <div style={{ fontSize: '0.75rem', color: theme.textMuted, marginTop: 2 }}>📍 {loc}</div>
        </div>
    </div>
);

const AuditItem = ({ user, action, time, theme }: any) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:'1rem', borderBottom:`1px solid ${theme.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius:'50%', background: theme.primary+'20', color: theme.primary, display:'flex', justifyContent:'center', alignItems:'center', fontSize:'0.8rem', fontWeight: 800 }}>{user.charAt(0).toUpperCase()}</div>
            <div>
                <div style={{ fontSize:'0.9rem', fontWeight: 700, color: theme.text }}>{user} <span style={{ fontWeight: 400, color: theme.textMuted }}>{action}</span></div>
            </div>
        </div>
        <div style={{ fontSize:'0.75rem', color: theme.textMuted }}>{time}</div>
    </div>
);

const s: any = {
  statsGrid: (isMob: boolean) => ({ display: 'grid', gridTemplateColumns: isMob ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }),
  mainGrid: (isMob: boolean) => ({ display: 'grid', gridTemplateColumns: isMob ? '1fr' : '1fr 1.5fr', gap: '2.5rem' }),
  donutWrapper: { display:'flex', justifyContent:'center', alignItems:'center', height: 200 },
  donut: (percent: number, color: string, bg: string) => ({
    width: 180, height: 180, borderRadius: '50%',
    background: `conic-gradient(${color} ${percent * 3.6}deg, ${bg} 0deg)`,
    display:'flex', justifyContent:'center', alignItems:'center', position:'relative'
  }),
  donutInner: { width: 140, height: 140, borderRadius: '50%', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.05)' }
};