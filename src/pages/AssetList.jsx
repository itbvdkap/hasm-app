import { useEffect, useState } from "react";
import { assetService } from "../services/assetService";

const AssetList = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await assetService.getAllAssets();
      setAssets(data);
    } catch (err) {
      alert("Không thể tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Đang tải dữ liệu từ Bệnh viện An Phú...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Danh sách Thiết bị Y tế</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#1a2840', color: '#fff' }}>
            <th>Mã TS</th>
            <th>Tên Thiết Bị</th>
            <th>Khoa/Phòng</th>
            <th>Trạng Thái</th>
            <th>Sức Khỏe</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #1a2840' }}>
              <td>{item.maTaiSan}</td>
              <td>
                <div><strong>{item.tenThietBi}</strong></div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{item.modelThietBi}</div>
              </td>
              <td>{item.KhoaPhong?.tenKhoaPhong}</td>
              <td>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: 4, 
                  background: item.trangThai === 'ACTIVE' ? '#22c55e20' : '#f59e0b20',
                  color: item.trangThai === 'ACTIVE' ? '#22c55e' : '#f59e0b'
                }}>
                  {item.trangThai}
                </span>
              </td>
              <td>{item.healthScore}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};