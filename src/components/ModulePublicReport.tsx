import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const ModulePublicReport = ({ assetCode, onFinish }: any) => {
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ moTaSuCo: '', mucDo: 'NORMAL' });

  useEffect(() => {
    supabase.from('TrangThietBi').select('*, KhoaPhong(tenKhoaPhong)')
      .eq('maTaiSan', assetCode).maybeSingle()
      .then(({data}) => {
        setAsset(data);
        setLoading(false);
      });
  }, [assetCode]);

  const handleSubmit = async () => {
    if (!formData.moTaSuCo) return alert("Vui lòng mô tả tình trạng lỗi!");
    setSubmitting(true);
    try {
      const { error } = await supabase.from('QuanLySuCo').insert([{
        trangThietBiId: asset.id,
        moTaSuCo: formData.moTaSuCo,
        mucDo: formData.mucDo,
        trangThaiXuLy: 'OPEN'
      }]);
      if (error) throw error;
      alert("Cảm ơn bạn! Thông tin sự cố đã được gửi tới phòng Vật tư thiết bị.");
      onFinish();
    } catch (e: any) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={s.container}>Đang nhận diện thiết bị...</div>;
  if (!asset) return <div style={s.container}>❌ Không tìm thấy thiết bị này trên hệ thống!</div>;

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={{textAlign: 'center', marginBottom: 20}}>
            <span style={{fontSize: 40}}>⚠️</span>
            <h2 style={{color: '#fff', margin: '10px 0 0 0'}}>Báo hỏng thiết bị</h2>
            <p style={{color: '#64748b', fontSize: 13}}>Hệ thống tiếp nhận sự cố nhanh</p>
        </div>

        <div style={s.assetInfo}>
            <div style={{fontWeight: 'bold', color: '#00d4a8'}}>{asset.tenThietBi}</div>
            <div style={{fontSize: 12, color: '#94a3b8'}}>{asset.maTaiSan} | {asset.KhoaPhong?.tenKhoaPhong}</div>
        </div>

        <div style={{marginTop: 20}}>
            <label style={s.label}>Mô tả tình trạng lỗi</label>
            <textarea style={s.input} rows={4} placeholder="Vd: Máy không lên nguồn, màn hình bị sọc..." 
                onChange={e => setFormData({...formData, moTaSuCo: e.target.value})} />
        </div>

        <div style={{marginTop: 15}}>
            <label style={s.label}>Mức độ ưu tiên</label>
            <select style={s.input} onChange={e => setFormData({...formData, mucDo: e.target.value})}>
                <option value="NORMAL">Bình thường</option>
                <option value="URGENT">Khẩn cấp (Cần dùng ngay)</option>
                <option value="DANGER">Nguy hiểm (Rò điện, cháy nổ)</option>
            </select>
        </div>

        <button onClick={handleSubmit} disabled={submitting} style={s.btn}>
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu hỗ trợ ▶'}
        </button>
        
        <p style={{textAlign: 'center', fontSize: 11, color: '#64748b', marginTop: 20}}>Hệ thống HAMS v2.1 - Bệnh viện An Phú</p>
      </div>
    </div>
  );
};

const s: any = {
  container: { height: '100vh', background: '#06090f', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, background: '#0d1520', padding: 30, borderRadius: 24, border: '1px solid #1a2840' },
  assetInfo: { background: '#111d2e', padding: 15, borderRadius: 12, border: '1px solid #3b82f640' },
  label: { fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 8 },
  input: { width: '100%', padding: '12px', background: '#111d2e', border: '1px solid #1a2840', color: '#fff', borderRadius: 10, outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', marginTop: 25, background: '#ef4444', color: '#fff', border: 'none', padding: '15px', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer' }
};