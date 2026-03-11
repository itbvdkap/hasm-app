import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const ModuleLogin = ({ onLoginSuccess }: any) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [depts, setDepts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    username: '', password: '', fullName: '', email: '', khoaPhongId: ''
  });

  useEffect(() => {
    if (mode === 'REGISTER') {
        supabase.from('KhoaPhong').select('id, tenKhoaPhong').then(({data}) => setDepts(data || []));
    }
  }, [mode]);

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'LOGIN') {
        const { data: user, error } = await supabase.from('Users').select('*, Roles(roleName)').eq('username', formData.username.trim()).eq('passwordHash', formData.password.trim()).maybeSingle();
        if (error || !user) throw new Error("Tài khoản hoặc mật khẩu không đúng!");
        if (user.status !== 'ACTIVE') throw new Error(`Tài khoản ${user.status}. Chờ Admin phê duyệt!`);
        onLoginSuccess(user);
      } else {
        if (!formData.fullName || !formData.khoaPhongId) throw new Error("Vui lòng nhập đầy đủ thông tin và chọn Khoa!");
        const { error } = await supabase.from('Users').insert([{
          username: formData.username.trim(),
          passwordHash: formData.password.trim(),
          fullName: formData.fullName,
          email: formData.email,
          khoaPhongId: formData.khoaPhongId,
          status: 'PENDING'
        }]);
        if (error) throw error;
        alert("Đăng ký thành công! Vui lòng chờ Admin phê duyệt.");
        setMode('LOGIN');
      }
    } catch (err: any) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={css.wrapper}>
      <div style={css.loginBox}>
        <div style={css.header}>
          <div style={css.logo}>🏥</div>
          <h2 style={css.title}>HAMS AN PHÚ</h2>
          <p style={css.subtitle}>{mode === 'LOGIN' ? 'Đăng nhập hệ thống quản lý' : 'Đăng ký tài khoản nhân sự mới'}</p>
        </div>

        {errorMsg && <div style={css.errorBanner}>⚠️ {errorMsg}</div>}

        <form onSubmit={handleAuth} style={css.form}>
          {mode === 'REGISTER' && (
            <>
              <div style={css.inputGroup}>
                <label style={css.label}>Họ và tên</label>
                <input style={css.input} placeholder="Nguyễn Văn A" onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div style={css.inputGroup}>
                <label style={css.label}>Khoa / Phòng công tác</label>
                <select style={css.input} onChange={e => setFormData({...formData, khoaPhongId: e.target.value})}>
                    <option value="">-- Chọn đơn vị --</option>
                    {depts.map(d => <option key={d.id} value={d.id}>{d.tenKhoaPhong}</option>)}
                </select>
              </div>
            </>
          )}
          <div style={css.inputGroup}>
            <label style={css.label}>Tên đăng nhập</label>
            <input style={css.input} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
          </div>
          <div style={css.inputGroup}>
            <label style={css.label}>Mật khẩu</label>
            <input style={css.input} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} style={css.submitBtn}>
            {loading ? 'Đang xử lý...' : (mode === 'LOGIN' ? 'Đăng nhập' : 'Gửi yêu cầu phê duyệt')}
          </button>
        </form>
        <div style={css.footer}>
          <span onClick={() => setMode(mode==='LOGIN'?'REGISTER':'LOGIN')} style={css.link}>
            {mode === 'LOGIN' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Quay lại đăng nhập'}
          </span>
        </div>
      </div>
    </div>
  );
};

const css: any = {
  wrapper: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#06090f' },
  loginBox: { width: 400, background: '#0d1520', padding: 40, borderRadius: 24, border: '1px solid #1a2840' },
  header: { textAlign: 'center', marginBottom: 30 },
  logo: { fontSize: 40, marginBottom: 10 },
  title: { color: '#00d4a8', margin: 0, fontSize: 22, fontWeight: 800 },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 5 },
  errorBanner: { background: '#ef444415', color: '#ef4444', padding: '12px', borderRadius: 10, fontSize: 12, marginBottom: 20, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 15 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 11, color: '#94a3b8' },
  input: { background: '#111d2e', border: '1px solid #1a2840', padding: '12px', borderRadius: 10, color: '#fff', outline: 'none' },
  submitBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '15px', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', marginTop: 10 },
  footer: { marginTop: 25, textAlign: 'center' },
  link: { color: '#3b82f6', fontSize: 13, cursor: 'pointer' }
};