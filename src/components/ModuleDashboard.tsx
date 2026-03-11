import { useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export const ModuleDashboard = ({ assets = [], pendingMaint = [], pendingUsers = [], onRefresh }: any) => {
  
  const d = useMemo(() => {
    const total = assets.length;
    const totalVal = assets.reduce((sum: number, a: any) => sum + (Number(a.nguyenGia) || 0), 0);
    const active = assets.filter((a: any) => a.trangThai === 'ACTIVE').length;
    const maint = assets.filter((a: any) => a.trangThai === 'MAINTENANCE').length;
    const broken = assets.filter((a: any) => a.trangThai === 'BROKEN').length;
    const usageRate = total > 0 ? Math.round((active / total) * 100) : 0;

    const deptMap: any = {};
    assets.forEach((a: any) => {
      const dept = a.KhoaPhong?.tenKhoaPhong || "Chưa phân khoa";
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    
    const deptData = Object.keys(deptMap).map(name => ({
      name, 
      count: deptMap[name],
      percent: total > 0 ? Math.round((deptMap[name] / total) * 100) : 0
    })).sort((a,b) => b.count - a.count).slice(0, 6);

    const schedule = pendingMaint.slice(0, 4).map((m: any) => ({
      date: new Date(m.ngayDuKien).toLocaleDateString('vi-VN', {day: '2d', month: '2d'}),
      title: m.TrangThietBi?.tenThietBi || 'Thiết bị bảo trì',
      loc: m.TrangThietBi?.KhoaPhong?.tenKhoaPhong || 'Phòng Kỹ thuật',
      type: 'KĐ định kỳ'
    }));

    const alerts = assets
      .filter((a: any) => a.trangThai === 'BROKEN' || a.trangThai === 'MAINTENANCE')
      .slice(0, 4)
      .map((a: any) => ({
        type: a.trangThai === 'BROKEN' ? 'Đang hỏng hóc' : 'Đang bảo trì',
        name: a.tenThietBi,
        time: a.maTaiSan,
        color: a.trangThai === 'BROKEN' ? '#ef4444' : '#f59e0b'
      }));

    return { total, totalVal, active, maint, broken, usageRate, deptData, schedule, alerts };
  }, [assets, pendingMaint]);

  // --- LOGIC PHÊ DUYỆT NHÂN SỰ ---
  const handleUserAction = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      if (action === 'APPROVE') {
        const { error } = await supabase.from('Users').update({ status: 'ACTIVE' }).eq('id', userId);
        if (error) throw error;
        alert("Đã phê duyệt nhân viên!");
      } else {
        const { error } = await supabase.from('Users').delete().eq('id', userId);
        if (error) throw error;
        alert("Đã từ chối tài khoản!");
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 25, fontSize: 13, color: '#64748b' }}>
        🏠 Trang chủ → <span style={{ color: '#3b82f6' }}>Dashboard Điều hành</span>
      </div>

      {/* STATS ROW */}
      <div style={css.grid6}>
        <Card label="Tổng tài sản" val={d.total} sub="+12 tháng này" color="#00d4a8" icon="📦" />
        <Card label="Tổng giá trị" val={(d.totalVal / 1000000000).toFixed(1) + ' tỷ'} sub="Giá trị sổ sách" color="#3b82f6" icon="💰" />
        <Card label="Cần bảo trì" val={d.maint} sub="Trong 7 ngày tới" color="#f59e0b" icon="🔧" />
        <Card label="Đang sửa chữa" val={d.broken} sub="Tạm ngừng HĐ" color="#ef4444" icon="⚠️" />
        <Card label="Nhân sự mới" val={pendingUsers.length} sub="Đang chờ duyệt" color="#a855f7" icon="👥" />
        <Card label="Tỷ lệ sử dụng" val={d.usageRate + '%'} sub="Trung bình toàn viện" color="#00d4a8" icon="📊" />
      </div>

      {/* PHÊ DUYỆT NHÂN SỰ (Chỉ hiện khi có người chờ) */}
      {pendingUsers.length > 0 && (
        <div style={{ ...css.panel, marginBottom: 25, border: '1px solid #a855f740' }}>
          <div style={{ ...css.panelHeader, color: '#a855f7' }}>👥 Yêu cầu phê duyệt nhân sự mới ({pendingUsers.length})</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 15 }}>
            {pendingUsers.map((user: any) => (
              <div key={user.id} style={css.userCard}>
                <div>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{user.fullName}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Tài khoản: {user.username} | {user.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => handleUserAction(user.id, 'APPROVE')} style={css.approveBtn}>Duyệt</button>
                    <button onClick={() => handleUserAction(user.id, 'REJECT')} style={css.rejectBtn}>Xoá</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={css.mainGrid}>
        <div style={css.panel}>
          <div style={css.panelHeader}>📊 Tài sản theo Khoa/Phòng</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {d.deptData.map((dept, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: '#e2e8f0' }}>{dept.name}</span>
                  <span style={{ color: css.colors[i % 6], fontWeight: 'bold' }}>{dept.percent}%</span>
                </div>
                <div style={css.barBg}>
                  <div style={{ ...css.barFill, width: `${dept.percent}%`, background: css.colors[i % 6] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={css.panel}>
          <div style={css.panelHeader}>🔧 Lịch bảo trì tháng này</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {d.schedule.map((s, i) => (
              <div key={i} style={{ ...css.scheduleItem, borderLeft: `3px solid ${css.colors[i % 4]}` }}>
                <div style={{ color: css.colors[i % 4], fontWeight: 'bold', fontSize: 13 }}>{s.date}</div>
                <div style={{ color: '#fff', fontWeight: 500, fontSize: 13, margin: '2px 0' }}>{s.title}</div>
                <div style={{ color: '#64748b', fontSize: 11 }}>👤 {s.loc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={css.panel}>
          <div style={css.panelHeader}>🔔 Cảnh báo rủi ro</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {d.alerts.map((a, i) => (
              <div key={i} style={{ ...css.alertItem, border: `1px solid ${a.color}40` }}>
                <div style={{ color: a.color, fontSize: 11, fontWeight: 'bold' }}>• {a.type}</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, margin: '4px 0' }}>{a.name}</div>
                <div style={{ color: '#94a3b8', fontSize: 11 }}>Mã TS: {a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Card = ({ label, val, sub, color, icon }: any) => (
  <div style={{ ...css.card, borderLeft: `4px solid ${color}` }}>
    <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>{val}</div>
    <div style={{ fontSize: 12, color: color, fontWeight: 'bold' }}>{label}</div>
    <div style={{ fontSize: 11, color: '#64748b', marginTop: 5 }}>{sub}</div>
  </div>
);

const css: any = {
  grid6: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 15, marginBottom: 25 },
  card: { background: '#111d2e', padding: 20, borderRadius: 12, border: '1px solid #1a2840' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 },
  panel: { background: '#111d2e', padding: 20, borderRadius: 16, border: '1px solid #1a2840' },
  panelHeader: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 20 },
  barBg: { height: 6, background: '#06090f', borderRadius: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 10 },
  scheduleItem: { background: '#06090f', padding: '12px 15px', borderRadius: 8 },
  alertItem: { background: '#06090f', padding: '12px 15px', borderRadius: 8 },
  userCard: { background: '#06090f', padding: '15px 20px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #1a2840' },
  approveBtn: { background: '#00d4a8', color: '#000', border: 'none', padding: '6px 15px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', fontSize: 12 },
  rejectBtn: { background: 'none', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 15px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', fontSize: 12 },
  colors: ['#3b82f6', '#00d4a8', '#a855f7', '#f59e0b', '#ec4899', '#ef4444']
};