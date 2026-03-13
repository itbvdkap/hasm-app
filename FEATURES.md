# 📜 HAMS PRO - HIẾN CHƯƠNG & CHECKLIST HỆ THỐNG (2026)

> **LƯU Ý QUAN TRỌNG:** Đây là bộ quy chuẩn cốt lõi. Mọi cập nhật mã nguồn PHẢI tuân thủ các nguyên tắc thiết kế và tính năng dưới đây để đảm bảo tính nhất quán và trải nghiệm người dùng (UX).

---

### 🏛️ 1. NGUYÊN TẮC THIẾT KẾ CỐT LÕI (DESIGN MANDATES)
- [x] **Ngôn ngữ:** Soft UI / Glassmorphism Light.
- [ ] **Dark Mode / Night Theme:** Chế độ tối cho bác sĩ trực đêm (Giảm mỏi mắt).
- [ ] **High Contrast Mode:** Tăng độ tương phản & cỡ chữ cho y bác sĩ lớn tuổi.
- [x] **Màu sắc Semantic:** Primary Blue (#2563EB), Success (>80% - Green), Warning (50-80% - Orange), Danger (<50% - Red).
- [x] **Bo góc (Radius):** 16px (Card), 24px-32px (Modal/Hero).
- [x] **Layout Responsive:** Sidebar (Desktop), Rail (Tablet), Bottom Nav (Mobile).

---

### 📊 2. MODULE DASHBOARD (ĐIỀU HÀNH THÔNG MINH)
- [x] **Interactive Donut Chart:** Biểu đồ tỷ lệ sức khỏe hệ thống Real-time.
- [x] **Vertical Tech Timeline:** Dải thời gian hiển thị các ca kỹ thuật trong ngày.
- [ ] **System Audit Log:** Nhật ký kiểm toán (Ai, làm gì, lúc nào) - Không thể xóa.

---

### 📦 3. MODULE TÀI SẢN (ASSET MANAGEMENT)
- [x] **View Switcher:** Nút Pill (Lưới/Danh sách) chuyển đổi linh hoạt.
- [x] **Voice Search:** Tìm kiếm thiết bị bằng giọng nói (Tiếng Việt 🎤).
- [x] **Smart Verification:** Kiểm tra mã máy real-time trước khi báo hỏng.
- [ ] **Inventory Mode:** Chế độ quét QR hàng loạt để kiểm kê định kỳ hàng năm.

---

### 🔍 4. MODULE CHI TIẾT (DIGITAL TWIN 4.0)
- [x] **Interactive Health Bar:** Thanh tình trạng đổi màu theo %, click vào xem chi tiết linh kiện lỗi.
- [ ] **AI Predictive Maintenance:** Dự báo hỏng hóc linh kiện dựa trên lịch sử (Độ tin cậy >85%).
- [ ] **3D/AR View:** Tương tác mô hình 3D (.gltf) cho thiết bị đắt tiền (MRI, CT).
- [ ] **Document Vault:** Kho lưu trữ PDF (HDSD, CO/CQ) tích hợp tìm kiếm nội dung file.
- [ ] **Dynamic QR:** Giao diện quét thay đổi theo vai trò (Bác sĩ / Kỹ sư / Bệnh nhân).

---

### ⚙️ 5. MODULE DANH MỤC (PHÂN QUYỀN MA TRẬN)
- [x] **Master-Detail Layout:** Menu dọc chia nhóm danh mục.
- [x] **Approval Flow:** Tab Chờ xét duyệt với Pulse Badge đỏ.
- [ ] **Matrix Roles:** Phân quyền theo cấp bậc khoa phòng (Trưởng khoa chỉ thấy thiết bị khoa mình).

---

### 🔐 6. LOGIN & PUBLIC PORTAL (ZERO FRICTION)
- [x] **Green Card FAB:** Khối quét QR xanh lá (Báo hỏng 10 giây không cần đăng nhập).
- [x] **Laser Scan UI:** Giao diện quét toàn màn hình có tia laser xanh neon.

---

### 🚀 LỘ TRÌNH THỰC THI NGAY (TODO)
1. [ ] **Telegram Bot Integration:** Bắn thông báo sự cố tức thì đến kỹ thuật viên.
2. [ ] **Thanh Tình trạng Thông minh (Interactive Health Bar).**
3. [ ] **Cập nhật Dark Mode (Toggle Night Theme).**
4. [ ] **Triển khai Phân quyền Ma trận (Matrix Roles).**
