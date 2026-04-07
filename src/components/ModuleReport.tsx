import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Cell as ReCell
} from 'recharts';
import { 
  TrendingUp, 
  PieChart, 
  FileSpreadsheet, 
  FileText, 
  Download,
  AlertCircle,
  DollarSign,
  Package,
  Activity
} from 'lucide-react';

export const ModuleReport = ({ assets = [], theme, isMobile }: any) => {
  const stats = useMemo(() => {
    // 1. Status Distribution
    const statusCounts: any = {};
    assets.forEach((a: any) => {
      statusCounts[a.trangThai] = (statusCounts[a.trangThai] || 0) + 1;
    });
    const statusData = Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] }));

    // 2. Department Distribution
    const deptCounts: any = {};
    assets.forEach((a: any) => {
      const dName = a.KhoaPhong?.tenKhoaPhong || 'Chưa gán';
      deptCounts[dName] = (deptCounts[dName] || 0) + 1;
    });
    const deptData = Object.keys(deptCounts).map(k => ({ name: k, count: deptCounts[k] })).sort((a, b) => b.count - a.count).slice(0, 8);

    // 3. Financial Summary
    const totalValue = assets.reduce((sum: number, a: any) => sum + (Number(a.nguyenGia) || 0), 0);

    return { statusData, deptData, totalValue, totalAssets: assets.length };
  }, [assets]);

  const COLORS = [theme.primary, theme.secondary, theme.warning, theme.danger, '#8B5CF6', '#EC4899'];

  return (
    <div style={{ color: theme.text }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: isMobile ? '1.5rem' : '2.2rem' }}>Trung tâm Báo cáo & Phân tích</h2>
        <p style={{ color: theme.textMuted, marginTop: '0.5rem' }}>Dữ liệu tổng hợp từ <b>{stats.totalAssets}</b> thiết bị toàn hệ thống.</p>
      </div>

      {/* SUMMARY CARDS */}
      <div style={s.summaryGrid(isMobile)}>
          <SummaryCard label="TỔNG GIÁ TRỊ TÀI SẢN" val={new Intl.NumberFormat('vi-VN').format(stats.totalValue) + ' đ'} icon={<DollarSign size={24}/>} color={theme.primary} theme={theme} />
          <SummaryCard label="TỔNG SỐ LƯỢNG MÁY" val={stats.totalAssets} icon={<Package size={24}/>} color={theme.secondary} theme={theme} />
          <SummaryCard label="TỶ LỆ SẴN SÀNG" val="94.2%" icon={<Activity size={24}/>} color="#10B981" theme={theme} />
      </div>

      <div style={s.mainGrid(isMobile)}>
        
        {/* CHART 1: STATUS DISTRIBUTION */}
        <div className="glass-card" style={{ padding: '2rem', background: theme.card, borderRadius: '24px', border: `1px solid ${theme.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: '2rem' }}>
                <PieChart size={20} color={theme.primary} />
                <b style={{ fontSize: '1rem' }}>Tình trạng thiết bị</b>
            </div>
            <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <Pie
                            data={stats.statusData}
                            cx="50%" cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {stats.statusData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text }} />
                    </RePieChart>
                </ResponsiveContainer>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap: 15, justifyContent:'center', marginTop: '1rem' }}>
                {stats.statusData.map((d: any, i: number) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap: 6, fontSize:'0.75rem', fontWeight: 600 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                        {d.name}: {d.value}
                    </div>
                ))}
            </div>
        </div>

        {/* CHART 2: DEPT DISTRIBUTION */}
        <div className="glass-card" style={{ padding: '2rem', background: theme.card, borderRadius: '24px', border: `1px solid ${theme.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: '2rem' }}>
                <TrendingUp size={20} color={theme.primary} />
                <b style={{ fontSize: '1rem' }}>Phân bổ theo Khoa / Phòng</b>
            </div>
            <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.deptData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.border} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '0.7rem', fontWeight: 600, fill: theme.textMuted }} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '10px' }} />
                        <Bar dataKey="count" fill={theme.primary} radius={[0, 10, 10, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* EXPORT SECTION */}
        <div className="glass-card" style={{ gridColumn: isMobile ? 'span 1' : 'span 2', padding: '2rem', background: theme.card, borderRadius: '24px', border: `1px solid ${theme.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '2rem' }}>
                <b style={{ fontSize: '1rem' }}>Trung tâm Xuất báo cáo chuyên dụng</b>
                <div style={{ display:'flex', gap: 10 }}>
                    <button style={s.exportActionBtn(theme)}><Download size={16}/> Tải tất cả (.zip)</button>
                </div>
            </div>
            <div style={s.exportGrid(isMobile)}>
                <ExportItem icon={<FileSpreadsheet color={theme.secondary}/>} label="Danh mục TTB chi tiết" type="Excel" theme={theme} />
                <ExportItem icon={<FileText color={theme.danger}/>} label="Báo cáo kiểm định định kỳ" type="PDF" theme={theme} />
                <ExportItem icon={<TrendingUp color={theme.primary}/>} label="Phân tích hiệu suất sử dụng" type="PDF" theme={theme} />
                <ExportItem icon={<Download color={theme.warning}/>} label="Dữ liệu thô hệ thống" type="CSV" theme={theme} />
            </div>
        </div>

      </div>
    </div>
  );
};

const SummaryCard = ({ label, val, icon, color, theme }: any) => (
    <div className="glass-card" style={{ padding: '1.5rem', background: theme.card, borderRadius: '20px', border: `1px solid ${theme.border}`, display:'flex', alignItems:'center', gap: '1.25rem' }}>
        <div style={{ width: 50, height: 50, background: `${color}15`, color: color, borderRadius: '15px', display:'flex', justifyContent:'center', alignItems:'center' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.7rem', color: theme.textMuted, fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: theme.text }}>{val}</div>
        </div>
    </div>
);

const ExportItem = ({ icon, label, type, theme }: any) => (
    <div style={{ display:'flex', alignItems:'center', gap: 12, padding: '1rem', background: theme.bg, borderRadius: '12px', cursor:'pointer', border: `1px solid ${theme.border}`, transition:'0.3s' }}>
        <div style={{ width: 40, height: 40, background: theme.card, borderRadius: '10px', display:'flex', justifyContent:'center', alignItems:'center', boxShadow: theme.shadow }}>
            {icon}
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: theme.text }}>{label}</div>
            <div style={{ fontSize: '0.7rem', color: theme.textMuted, fontWeight: 600 }}>Định dạng: {type}</div>
        </div>
        <ChevronRight size={16} color={theme.textMuted} />
    </div>
);

const s: any = {
  summaryGrid: (isMob: boolean) => ({ display: 'grid', gridTemplateColumns: isMob ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }),
  mainGrid: (isMob: boolean) => ({ display: 'grid', gridTemplateColumns: isMob ? '1fr' : '1fr 1.5fr', gap: '2.5rem' }),
  exportGrid: (isMob: boolean) => ({ display:'grid', gridTemplateColumns: isMob ? '1fr' : '1fr 1fr', gap: '1rem' }),
  exportActionBtn: (t: any) => ({ background: 'none', border: `1px solid ${t.border}`, padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, display:'flex', alignItems:'center', gap: 8, cursor:'pointer', color: t.text })
};