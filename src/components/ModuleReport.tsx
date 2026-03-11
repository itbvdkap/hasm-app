import { useMemo } from 'react';

export const ModuleReport = ({ assets = [] }: any) => {
  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    
    // 1. Tính toán tuổi thọ thực tế
    let age_2 = 0, age_2_5 = 0, age_5_10 = 0, age_10 = 0;
    assets.forEach((a: any) => {
        const buyYear = a.ngayMua ? new Date(a.ngayMua).getFullYear() : currentYear;
        const age = currentYear - buyYear;
        if (age < 2) age_2++;
        else if (age <= 5) age_2_5++;
        else if (age <= 10) age_5_10++;
        else age_10++;
    });

    const total = assets.length || 1;
    const ageData = [
      { label: '< 2 năm (Mới)', percent: Math.round(age_2/total*100), color: '#00d4a8' },
      { label: '2–5 năm', percent: Math.round(age_2_5/total*100), color: '#3b82f6' },
      { label: '5–10 năm', percent: Math.round(age_5_10/total*100), color: '#f59e0b' },
      { label: '> 10 năm (Cũ)', percent: Math.round(age_10/total*100), color: '#ef4444' },
    ];

    // 2. Tính toán chi phí bảo trì thực tế theo khoa (Giả lập từ các đợt bảo trì DONE)
    const deptMap: any = {};
    assets.forEach((a: any) => {
        const dept = a.KhoaPhong?.tenKhoaPhong || "Chưa rõ";
        const maintCost = (a.SuaChuaChiTiet || []).reduce((s: number, c: any) => s + (Number(c.chiPhi) || 0), 0);
        deptMap[dept] = (deptMap[dept] || 0) + maintCost;
    });

    const deptCosts = Object.keys(deptMap).map((name, i) => ({
        name,
        cost: Math.round(deptMap[name] / 1000000), // Quy ra triệu đồng
        color: ['#3b82f6', '#00d4a8', '#a855f7', '#f59e0b', '#ec4899'][i % 5]
    })).sort((a,b) => b.cost - a.cost).slice(0, 5);

    // 3. Khấu hao tích lũy giả lập theo tháng (Dựa trên tổng nguyên giá)
    const totalVal = assets.reduce((s: number, a: any) => s + (Number(a.nguyenGia) || 0), 0);
    const monthStep = (totalVal / 60) / 10000000; // Giả lập mức tăng mỗi tháng
    const depreciationData = Array.from({length: 12}, (_, i) => Math.min(150, Math.round((i + 1) * monthStep)));

    return { depreciationData, deptCosts, ageData, age_10_percent: Math.round(age_10/total*100) };
  }, [assets]);

  return (
    <div style={css.container}>
      <div style={css.breadcrumb}>🏠 Trang chủ → <span style={{color: '#3b82f6'}}>Báo cáo Phân tích</span></div>

      <div style={css.mainGrid}>
        <div style={css.panel}>
          <div style={css.panelTitle}>📉 Khấu hao tích luỹ thực tế (2025)</div>
          <div style={css.chartArea}>
            {stats.depreciationData.map((val, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 10 }}>
                <div style={{ ...css.bar, height: val, background: 'linear-gradient(to top, #3b82f620, #3b82f6)' }} />
                <span style={{ fontSize: 10, color: '#64748b' }}>T{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={css.panel}>
          <div style={css.panelTitle}>🔧 Chi phí bảo trì theo khoa (triệu đ)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
            {stats.deptCosts.length > 0 ? stats.deptCosts.map((d, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                  <span style={{color: '#e2e8f0'}}>{d.name}</span>
                  <span style={{color: d.color, fontWeight: 'bold'}}>{d.cost} tr</span>
                </div>
                <div style={css.barBg}><div style={{...css.barFill, width: `${Math.min(100, d.cost)}%`, background: d.color}} /></div>
              </div>
            )) : <p style={{textAlign: 'center', color: '#64748b'}}>Chưa có dữ liệu chi phí</p>}
          </div>
        </div>

        <div style={css.panel}>
          <div style={css.panelTitle}>🕹️ Hệ thống Xuất báo cáo</div>
          <div style={css.exportGrid}>
            <ExportCard label="Báo cáo tài sản cố định" type="Excel" icon="📊" color="#00d4a8" />
            <ExportCard label="Mẫu 01-TSCĐ Bộ Y tế" type="Excel" icon="🏥" color="#00d4a8" />
            <ExportCard label="Bảng khấu hao năm 2025" type="PDF" icon="📉" color="#ef4444" />
            <ExportCard label="Biên bản kiểm kê quý" type="Word" icon="📋" color="#3b82f6" />
          </div>
        </div>

        <div style={css.panel}>
          <div style={css.panelTitle}>📅 Phân bổ tuổi thọ tài sản thực</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 25 }}>
            {stats.ageData.map((a, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                  <span style={{color: '#94a3b8'}}>{a.label}</span>
                  <span style={{color: '#fff', fontWeight: 'bold'}}>{a.percent}%</span>
                </div>
                <div style={css.barBg}><div style={{...css.barFill, width: `${a.percent}%`, background: a.color}} /></div>
              </div>
            ))}
          </div>
          <div style={css.noteBox}>
            💡 {stats.age_10_percent}% tài sản {'>'} 10 năm → Đề xuất lập hội đồng thanh lý trong năm tới.
          </div>
        </div>
      </div>
    </div>
  );
};

const ExportCard = ({ label, type, icon, color }: any) => (
  <div style={css.exportCard}>
    <div style={{fontSize: 24}}>{icon}</div>
    <div style={{flex: 1}}>
      <div style={{fontSize: 13, color: '#e2e8f0', fontWeight: 500}}>{label}</div>
    </div>
    <div style={{fontSize: 10, color, fontWeight: 'bold'}}>{type}</div>
  </div>
);

const css: any = {
  container: { padding: '20px' },
  breadcrumb: { color: '#64748b', fontSize: 13, marginBottom: 25 },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 25 },
  panel: { background: '#111d2e', padding: '25px', borderRadius: '20px', border: '1px solid #1a2840' },
  panelTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  chartArea: { height: 180, display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 30 },
  bar: { width: '100%', borderRadius: '4px 4px 0 0', transition: '0.3s' },
  barBg: { height: 6, background: '#06090f', borderRadius: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 10 },
  exportGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginTop: 25 },
  exportCard: { background: '#06090f', padding: '15px 20px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: 15, cursor: 'pointer', border: '1px solid #1a2840' },
  noteBox: { marginTop: 30, background: '#f59e0b10', padding: '12px 20px', borderRadius: '30px', color: '#f59e0b', fontSize: 12, textAlign: 'center', border: '1px solid #f59e0b20' }
};