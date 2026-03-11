import { useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export const ModuleDashboard = ({ assets = [], pendingUsers = [], onRefresh, theme }: any) => {
  
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
      name, count: deptMap[name],
      percent: total > 0 ? Math.round((deptMap[name] / total) * 100) : 0
    })).sort((a,b) => b.count - a.count).slice(0, 5);

    const alerts = assets
      .filter((a: any) => a.trangThai === 'BROKEN' || a.trangThai === 'MAINTENANCE')
      .slice(0, 4)
      .map((a: any) => ({
        type: a.trangThai === 'BROKEN' ? 'Sự cố' : 'Bảo trì',
        name: a.tenThietBi,
        color: a.trangThai === 'BROKEN' ? '#ef4444' : '#f59e0b'
      }));

    return { total, totalVal, active, maint, broken, usageRate, deptData, alerts };
  }, [assets]);

  const handleUserAction = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      if (action === 'APPROVE') {
        await supabase.from('Users').update({ status: 'ACTIVE' }).eq('id', userId);
        alert("Đã duyệt nhân sự!");
      } else {
        await supabase.from('Users').delete().eq('id', userId);
        alert("Đã từ chối!");
      }
      onRefresh();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ marginBottom: 25, fontSize: 13, color: theme.muted }}>🏠 Trang chủ → <span style={{ color: '#3b82f6' }}>Dashboard</span></div>

      {/* STATS GRID */}
      <div style={css.statsGrid}>
        <StatCard label="Tổng tài sản" val={d.total} color="#3b82f6" theme={theme} />
        <StatCard label="Tổng giá trị" val={(d.totalVal / 1000000000).toFixed(1) + ' tỷ'} color="#00d4a8" theme={theme} />
        <StatCard label="Sự cố/Bảo trì" val={d.broken + d.maint} color="#ef4444" theme={theme} />
        <StatCard label="Tỷ lệ sử dụng" val={d.usageRate + '%'} color="#a855f7" theme={theme} />
      </div>

      {/* PHÊ DUYỆT NHÂN SỰ */}
      {pendingUsers.length > 0 && (
        <div style={{ ...css.panel, background: theme.card, border: `1px solid ${theme.border}`, marginBottom: 25 }}>
          <div style={{ fontWeight: 'bold', color: '#a855f7', marginBottom: 15 }}>👥 Yêu cầu phê duyệt ({pendingUsers.length})</div>
          <div style={css.userList}>
            {pendingUsers.map((u: any) => (
              <div key={u.id} style={css.userRow}>
                <div>
                    <div style={{fontWeight: 'bold'}}>{u.fullName}</div>
                    <div style={{fontSize: 11, color: theme.muted}}>{u.username}</div>
                </div>
                <div style={{display: 'flex', gap: 10}}>
                    <button onClick={() => handleUserAction(u.id, 'APPROVE')} style={css.approveBtn}>Duyệt</button>
                    <button onClick={() => handleUserAction(u.id, 'REJECT')} style={css.rejectBtn}>Xoá</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHARTS & ALERTS */}
      <div style={css.mainGrid}>
        <div style={{ ...css.panel, background: theme.card, border: `1px solid ${theme.border}` }}>
          <div style={{ fontWeight: 'bold', marginBottom: 20 }}>📊 Phân bổ theo Khoa</div>
          {d.deptData.map((dept, i) => (
            <div key={i} style={{marginBottom: 15}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5}}>
                <span>{dept.name}</span>
                <span style={{fontWeight: 'bold'}}>{dept.percent}%</span>
              </div>
              <div style={{height: 6, background: '#00000020', borderRadius: 10, overflow: 'hidden'}}>
                <div style={{height: '100%', width: `${dept.percent}%`, background: '#3b82f6'}} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...css.panel, background: theme.card, border: `1px solid ${theme.border}` }}>
          <div style={{ fontWeight: 'bold', marginBottom: 20 }}>🔔 Cảnh báo vận hành</div>
          {d.alerts.map((a, i) => (
            <div key={i} style={{padding: 12, background: '#00000010', borderRadius: 10, marginBottom: 10, borderLeft: `4px solid ${a.color}`}}>
              <div style={{fontSize: 11, color: a.color, fontWeight: 'bold'}}>{a.type}</div>
              <div style={{fontSize: 13, fontWeight: 'bold', marginTop: 3}}>{a.name}</div>
            </div>
          ))}
          {d.alerts.length === 0 && <p style={{textAlign: 'center', color: theme.muted}}>Hệ thống an toàn ✅</p>}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, color, theme }: any) => (
  <div style={{ background: theme.card, padding: 20, borderRadius: 16, border: `1px solid ${theme.border}`, borderLeft: `4px solid ${color}` }}>
    <div style={{ fontSize: 11, color: theme.muted, marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{val}</div>
  </div>
);

const css: any = {
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15, marginBottom: 25 },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 },
  panel: { padding: 20, borderRadius: 20 },
  userList: { display: 'flex', flexDirection: 'column', gap: 10 },
  userRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: '#00000010', borderRadius: 12 },
  approveBtn: { background: '#00d4a8', color: '#000', border: 'none', padding: '6px 15px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: 12 },
  rejectBtn: { background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 15px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }
};