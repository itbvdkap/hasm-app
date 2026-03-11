import { useState, useEffect } from 'react';

declare const Html5QrcodeScanner: any;

export const ModuleMobileQR = ({ onScanSuccess }: any) => {
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let scanner: any = null;
    if (scanning) {
      scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true
      }, false);

      scanner.render((decodedText: string) => {
        setScanning(false);
        scanner.clear();
        onScanSuccess(decodedText);
      }, (error: any) => {
        // Có thể log lỗi ở đây nếu cần
      });
    }

    return () => {
      if (scanner) {
        try { scanner.clear(); } catch(e) {}
      }
    };
  }, [scanning, onScanSuccess]);

  return (
    <div style={css.container}>
      <div style={css.breadcrumb}>🏠 Trang chủ → <span style={{color: '#3b82f6'}}>Mobile QR Scanner</span></div>

      <div style={css.mainContent}>
        {/* PHONE SIMULATOR */}
        <div style={css.phoneFrame}>
          <div style={css.phoneHeader}>
            <span style={{fontWeight: 'bold', fontSize: 14}}>HAMS Scan Pro</span>
            <span>🔋 100%</span>
          </div>
          <div style={css.phoneBody}>
            {!scanning ? (
                <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: 60, marginBottom: 20}}>📷</div>
                    <h3 style={{color: '#fff'}}>Sẵn sàng quét</h3>
                    <p style={{color: '#64748b', fontSize: 13, padding: '0 20px'}}>Sử dụng Camera để nhận diện mã tài sản dán trên thiết bị.</p>
                    <button onClick={() => setScanning(true)} style={css.startBtn}>Bật Camera ngay ▶</button>
                </div>
            ) : (
                <div style={{width: '100%'}}>
                    <div id="reader" style={{width: '100%', borderRadius: 20, overflow: 'hidden'}}></div>
                    <button onClick={() => setScanning(false)} style={css.stopBtn}>Dừng quét</button>
                </div>
            )}
          </div>
        </div>

        {/* FEATURE INFO */}
        <div style={css.featureList}>
          <h2 style={{color: '#fff', marginBottom: 25}}>📱 Hướng dẫn Quét QR</h2>
          <div style={css.guideBox}>
            <p>1. Hướng Camera về phía tem tài sản.</p>
            <p>2. Đảm bảo tem nằm trong khung hình vuông.</p>
            <p>3. Hệ thống sẽ tự động nhận diện mã **ANPHU-XXXX**.</p>
            <p>4. Sau khi quét, bạn có thể xem hồ sơ, báo hỏng hoặc kiểm kê ngay lập tức.</p>
          </div>
          
          <div style={{marginTop: 30}}>
            <h3 style={{color: '#00d4a8'}}>✓ Tiện ích đi kèm</h3>
            <ul style={{color: '#94a3b8', lineHeight: '2', paddingLeft: 20}}>
                <li>Tự động lấy nét và cân bằng sáng.</li>
                <li>Hỗ trợ quét trong môi trường thiếu sáng (Flash).</li>
                <li>Tương thích 100% với Android và iOS qua trình duyệt.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const css: any = {
  container: { padding: '20px' },
  breadcrumb: { color: '#64748b', fontSize: 13, marginBottom: 25 },
  mainContent: { display: 'flex', gap: 60, alignItems: 'start', padding: '20px 40px' },
  phoneFrame: { width: 320, height: 600, background: '#0d1520', borderRadius: 40, border: '10px solid #1a2840', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' },
  phoneHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1a2840', background: '#111d2e' },
  phoneBody: { flex: 1, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#06090f' },
  startBtn: { marginTop: 30, background: '#00d4a8', color: '#000', border: 'none', padding: '15px 30px', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer' },
  stopBtn: { marginTop: 20, background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', width: '100%' },
  featureList: { flex: 1 },
  guideBox: { background: '#111d2e', padding: '20px 30px', borderRadius: 20, border: '1px solid #1a2840', color: '#e2e8f0', lineHeight: '1.8' }
};