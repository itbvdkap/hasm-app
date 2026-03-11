export const calculateKPIs = (assets) => {
  if (!assets || assets.length === 0) return null;

  // 1. Tổng số lượng tài sản
  const totalAssets = assets.length;

  // 2. Tổng giá trị tài sản (Nguyên giá)
  const totalValue = assets.reduce((sum, item) => sum + (Number(item.nguyenGia) || 0), 0);

  // 3. Số thiết bị đang hỏng/cần sửa (Trạng thái khác 'ACTIVE')
  const brokenAssets = assets.filter(item => 
    item.trangThai === 'BROKEN' || item.trangThai === 'MAINTENANCE'
  ).length;

  // 4. Tỷ lệ thiết bị đang hỏng (%)
  const brokenRate = ((brokenAssets / totalAssets) * 100).toFixed(1);

  // 5. Thiết bị có sức khỏe thấp (Health Score < 50)
  const criticalHealthCount = assets.filter(item => (item.healthScore || 0) < 50).length;

  return {
    totalAssets,
    totalValue,
    brokenAssets,
    brokenRate,
    criticalHealthCount
  };
};