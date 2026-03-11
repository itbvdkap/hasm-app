const XLSX = require('xlsx');

try {
    const filePath = 'C:/Users/Admin/hams-app/files/dm_ttb.xlsx';
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log("TIÊU ĐỀ CỘT TRONG FILE BYT:");
    console.log(JSON.stringify(data[0])); 
    if (data[1]) {
        console.log("\nDỮ LIỆU MẪU (HÀNG 1):");
        console.log(JSON.stringify(data[1]));
    }
} catch (error) {
    console.error("Lỗi đọc file:", error.message);
}
