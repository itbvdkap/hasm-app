import React, { useEffect, useState } from 'react';
import { assetService } from '../services/assetService';
import { calculateKPIs } from '../utils/dashboardHelpers';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await assetService.getAllAssets();
        const computed = calculateKPIs(data);
        setStats(computed);
      } catch (error) {
        console.error("Lỗi Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div style={{ color: '#fff' }}>Đang tổng hợp báo cáo...</div>;
  if (!stats) return <div style={{ color: '#fff' }}>Chưa có dữ liệu tài sản.</div>;

  return (
    <div style={{ padding: 24, background: '#06090f', minHeight: '100vh' }}>
      <h2 style={{ color: '#fff', marginBottom: 20 }}>📊 Dashboard Hệ thống HAMS</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        
        {/* Card 1: Tổng tài sản */}
        <StatCard 
          label="Tổng tài sản" 
          value={stats.totalAssets.toLocaleString()} 
          sub="Thiết bị hiện có"
          color="#00d4a8" 
        />

        {/* Card 2: Tổng giá trị (Tỷ đồng) */}
        <StatCard 
          label="Tổng giá trị" 
          value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalValue)} 
          sub="Giá trị nguyên giá"
          color="#3b82f6" 
        />

        {/* Card 3: Tỷ lệ hỏng hóc */}
        <StatCard 
          label="Tỷ lệ đang hỏng" 
          value={`${stats.brokenRate}%`} 
          sub={`${stats.brokenAssets} thiết bị chờ sửa`}
          color={stats.brokenRate > 10 ? "#ef4444" : "#f59e0b"} 
        />

        {/* Card 4: Cảnh báo sức khỏe */}
        <StatCard 
          label="Sức khỏe yếu" 
          value={stats.criticalHealthCount} 
          sub="Health Score < 50%"
          color="#a855f7" 
        />

      </div>
    </div>
  );
};

// Component con hiển thị Card cho gọn
const StatCard = ({ label, value, sub, color }) => (
  <div style={{ 
    background: '#111d2e', border: `1px solid ${color}33`, 
    padding: 20, borderRadius: 12, borderLeft: `4px solid ${color}` 
  }}>
    <div style={{ color: '#64748b', fontSize: 13 }}>{label}</div>
    <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', margin: '8px 0' }}>{value}</div>
    <div style={{ color: color, fontSize: 12 }}>{sub}</div>
  </div>
);

export default Dashboard;