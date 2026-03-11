import * as XLSX from 'xlsx';

/**
 * Hàm xuất dữ liệu ra file Excel
 * @param data: Mảng dữ liệu (Array of Objects)
 * @param fileName: Tên file muốn đặt
 */
export const exportToExcel = (data: any[], fileName: string) => {
  if (!data || data.length === 0) {
    alert("Không có dữ liệu để xuất!");
    return;
  }

  // 1. Tạo worksheet từ mảng dữ liệu
  const ws = XLSX.utils.json_to_sheet(data);
  
  // 2. Tạo workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DanhSach");
  
  // 3. Xuất file (Tự động tải về trình duyệt)
  XLSX.writeFile(wb, `${fileName}_${new Date().toLocaleDateString('vi-VN')}.xlsx`);
};