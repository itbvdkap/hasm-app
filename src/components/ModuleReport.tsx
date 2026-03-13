import { useMemo } from 'react';
import { 
  TrendingDown, 
  PieChart, 
  FileSpreadsheet, 
  FileText, 
  Download,
  AlertCircle
} from 'lucide-react';

export const ModuleReport = ({ assets = [], theme, isMobile }: any) => {
  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let age_2 = 0, age_2_5 = 0, age_5_10 = 0, age_10 = 0;
    
    assets.forEach((a: any) => {
        const age = currentYear - (a.ngayMua ? new Date(a.ngayMua).getFullYear() : currentYear);
        if (age < 2) age_2++;
        else if (age <= 5) age_2_5++;
        else if (age <= 10) age_5_10++;
        else age_10++;
    });

    const total = assets.length || 1;
    return {
      ageData: [
        { label: 'Mới (< 2 năm)', val: Math.round(age_2/total*100), color: theme.secondary },
        { label: 'Trung bình (2-5 năm)', val: Math.round(age_2_5/total*100), color: theme.primary },
        { label: 'Cũ (5-10 năm)', val: Math.round(age_5_10/total*100), color: theme.warning },
        { label: 'Rất cũ (> 10 năm)', val: Math.round(age_10/total*100), color: theme.danger }
      ]
    };
  }, [assets, theme]);

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: isMobile ? '1.5rem' : '2.2rem' }}>Báo cáo phân tích</h2>
        <p style={{ color: theme.textMuted, marginTop: '0.5rem' }}>Phân tích chuyên sâu và xuất dữ liệu định kỳ.</p>
      </div>

      <div style={s.mainGrid(isMobile)}>
        
        {/* BIỂU ĐỒ TUỔI THỌ TÀI SẢN */}
        <div className="glass-card" style={{ padding: '2rem', background: '#fff', borderRadius: '24px' }}>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: '2rem' }}>
                <TrendingDown size={20} color={theme.primary} />
                <b style={{ fontSize: '1rem' }}>Phân bổ tuổi thọ thiết bị</b>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap: '1.5rem' }}>
                {stats.ageData.map((a, i) => (
                    <div key={i}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize: '0.85rem', marginBottom: 8, fontWeight: 600 }}>
                            <span style={{color: theme.text}}>{a.label}</span>
                            <span style={{color: a.color}}>{a.val}%</span>
                        </div>
                        <div style={{ height: 8, background: '#f1f5f9', borderRadius: 10, overflow:'hidden' }}>
                            <div style={{ height: '100%', width: `${a.val}%`, background: a.color, borderRadius: 10 }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* HỆ THỐNG XUẤT FILE PRO */}
        <div style={{ display:'flex', flexDirection:'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '2rem', background: '#fff', borderRadius: '24px' }}>
                <b style={{ fontSize: '1rem', display:'block', marginBottom: '1.5rem' }}>Tác vụ xuất báo cáo</b>
                <div style={s.exportGrid(isMobile)}>
                    <ExportItem icon={<FileSpreadsheet color={theme.secondary}/>} label="Danh mục TTB" type="Excel" />
                    <ExportItem icon={<FileText color={theme.danger}/>} label="Bảng khấu hao" type="PDF" />
                    <ExportItem icon={<TrendingDown color={theme.primary}/>} label="Báo cáo kỹ thuật" type="PDF" />
                    <ExportItem icon={<Download color={theme.warning}/>} label="Dữ liệu thô" type="CSV" />
                </div>
            </div>

            <div style={s.alertBox(theme)}>
                <AlertCircle size={20} />
                <div style={{fontSize: '0.85rem'}}>
                    <b>Ghi chú:</b> Dữ liệu báo cáo được cập nhật tự động mỗi 30 phút từ hệ thống Supabase Real-time.
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

const ExportItem = ({ icon, label, type }: any) => (
    <div style={{ display:'flex', alignItems:'center', gap: 12, padding: '1rem', background: '#f8fafc', borderRadius: '12px', cursor:'pointer' }}>
        <div style={{ width: 40, height: 40, background: '#fff', borderRadius: '10px', display:'flex', justifyContent:'center', alignItems:'center', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
            {icon}
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Định dạng: {type}</div>
        </div>
    </div>
);

const s: any = {
  mainGrid: (isMob: boolean) => ({ display: 'grid', gridTemplateColumns: isMob ? '1fr' : '1.5fr 1fr', gap: '2.5rem' }),
  exportGrid: (isMob: boolean) => ({ display:'grid', gridTemplateColumns: '1fr', gap: '1rem' }),
  alertBox: (t: any) => ({ display:'flex', gap: 12, padding: '1.25rem', background: `${t.primary}08`, color: t.primary, borderRadius: '16px', border: `1px solid ${t.primary}20` })
};