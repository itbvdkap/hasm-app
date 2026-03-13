import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, Lock, ShieldCheck, Mail, Building2, Save } from 'lucide-react';

export const ModuleAccount = ({ session, theme, onRefresh }: any) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY'>('PROFILE');
  const [loading, setLoading] = useState(false);
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });

  const handleUpdatePassword = async () => {
    if (passData.new !== passData.confirm) return alert("Mật khẩu mới không khớp!");
    if (passData.new.length < 6) return alert("Mật khẩu phải từ 6 ký tự!");
    
    setLoading(true);
    try {
      const { error } = await supabase.from('Users').update({ passwordHash: passData.new }).eq('id', session.id);
      if (error) throw error;
      alert("Đổi mật khẩu thành công!");
      setPassData({ old: '', new: '', confirm: '' });
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: '2rem' }}>Tài khoản của tôi</h2>
        <p style={{ color: theme.textMuted, marginTop: '0.5rem' }}>Quản lý thông tin cá nhân và bảo mật tài khoản.</p>
      </div>

      <div style={s.tabContainer}>
        <button onClick={() => setActiveTab('PROFILE')} style={s.tabItem(activeTab==='PROFILE', theme)}><User size={18}/> Hồ sơ cá nhân</button>
        <button onClick={() => setActiveTab('SECURITY')} style={s.tabItem(activeTab==='SECURITY', theme)}><ShieldCheck size={18}/> Bảo mật & Mật khẩu</button>
      </div>

      <div className="glass-card" style={{ padding: '3rem', background: '#fff', borderRadius: '24px' }}>
        {activeTab === 'PROFILE' ? (
          <div style={s.grid}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={s.largeAvatar}>{session.fullName.charAt(0)}</div>
                <h3 style={{ margin: '1rem 0 0.5rem 0' }}>{session.fullName}</h3>
                <span style={s.badge}>{session.Roles?.roleName || 'Nhân viên'}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap: '1.5rem' }}>
                <div style={s.infoRow}><Building2 size={18} color={theme.primary}/> <div><label>KHOA PHÒNG</label><div>{session.KhoaPhong?.tenKhoaPhong || 'Chưa cập nhật'}</div></div></div>
                <div style={s.infoRow}><Mail size={18} color={theme.primary}/> <div><label>EMAIL</label><div>{session.email || 'Chưa cập nhật'}</div></div></div>
                <div style={s.infoRow}><User size={18} color={theme.primary}/> <div><label>TÊN ĐĂNG NHẬP</label><div>@{session.username}</div></div></div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h4 style={{ marginBottom: '2rem', textAlign:'center' }}>Thay đổi mật khẩu đăng nhập</h4>
            <div style={{ display:'flex', flexDirection:'column', gap: '1.5rem' }}>
                <div style={s.inputGroup}>
                    <label>MẬT KHẨU HIỆN TẠI</label>
                    <input type="password" style={s.input(theme)} placeholder="••••••••" value={passData.old} onChange={e=>setPassData({...passData, old: e.target.value})} />
                </div>
                <div style={s.inputGroup}>
                    <label>MẬT KHẨU MỚI</label>
                    <input type="password" style={s.input(theme)} placeholder="Tối thiểu 6 ký tự" value={passData.new} onChange={e=>setPassData({...passData, new: e.target.value})} />
                </div>
                <div style={s.inputGroup}>
                    <label>XÁC NHẬN MẬT KHẨU MỚI</label>
                    <input type="password" style={s.input(theme)} placeholder="Nhập lại mật khẩu mới" value={passData.confirm} onChange={e=>setPassData({...passData, confirm: e.target.value})} />
                </div>
                <button onClick={handleUpdatePassword} disabled={loading} style={{...s.saveBtn, background: theme.primary}}>
                    <Save size={18} /> {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const s: any = {
  tabContainer: { display:'flex', gap: 10, marginBottom: '2rem' },
  tabItem: (active: boolean, t: any) => ({
    display:'flex', alignItems:'center', gap: 8, padding: '0.8rem 1.5rem', borderRadius: '1rem', border: 'none', cursor: 'pointer',
    background: active ? t.primary : 'transparent', color: active ? '#fff' : t.textMuted, fontWeight: 700, transition: '0.3s'
  }),
  grid: { display:'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem', alignItems: 'center' },
  largeAvatar: { width: 100, height: 100, borderRadius: '50%', background: '#F1F5F9', display:'flex', justifyContent:'center', alignItems:'center', fontSize: '2.5rem', fontWeight: 800, color: '#3b82f6', border: '4px solid #fff', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' },
  badge: { background: 'rgba(37, 99, 235, 0.1)', color: '#3b82f6', padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 },
  infoRow: { display:'flex', alignItems:'center', gap: 15, label: { fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', display:'block', marginBottom: 2 }, fontSize: '1rem', fontWeight: 600 },
  inputGroup: { display:'flex', flexDirection:'column', gap: 8, label: { fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' } },
  input: (t: any) => ({ padding: '1rem', borderRadius: '12px', border: `1px solid ${t.border}`, outline: 'none', background: '#F8FAFC' }),
  saveBtn: { border: 'none', padding: '1rem', borderRadius: '12px', color: '#fff', fontWeight: 700, cursor: 'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap: 10, marginTop: '1rem' }
};