import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const ModuleLogin = ({ onLoginSuccess }: any) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: ''
  });

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const u = formData.username.trim();
    const p = formData.password.trim();

    console.log("--- Đang thử đăng nhập ---");
    console.log("User:", u);

    try {
      if (mode === 'LOGIN') {
        // Tìm user - Sử dụng tên cột trong ngoặc kép nếu là camelCase
        const { data: user, error: userError } = await supabase
          .from('Users')
          .select('*')
          .eq('username', u)
          .eq('passwordHash', p) // Phải khớp y hệt database
          .maybeSingle();

        if (userError) {
            console.error("Lỗi truy vấn:", userError);
            throw new Error(`Lỗi Database: ${userError.message}`);
        }

        console.log("Kết quả từ DB:", user);

        if (!user) {
            throw new Error("Tài khoản hoặc mật khẩu không chính xác!");
        }

        if (user.status !== 'ACTIVE') {
            throw new Error(`Tài khoản chưa được kích hoạt (Trạng thái: ${user.status})`);
        }

        // Lấy Role nếu có
        if (user.roleId) {
            const { data: role } = await supabase
                .from('Roles')
                .select('roleName')
                .eq('id', user.roleId)
                .maybeSingle();
            user.Roles = role;
        }
        
        onLoginSuccess(user);
      } else {
        // LOGIC ĐĂNG KÝ
        const { error } = await supabase.from('Users').insert([{
          username: u,
          passwordHash: p,
          fullName: formData.fullName,
          email: formData.email,
          status: 'PENDING'
        }]);
        if (error) throw error;
        alert("Đăng ký thành công! Vui lòng chờ phê duyệt.");
        setMode('LOGIN');
      }
    } catch (err: any) {
      console.error("Login catch error:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={css.wrapper}>
      <div style={css.loginBox}>
        <div style={css.header}>
          <div style={css.logo}>🏥</div>
          <h2 style={css.title}>HAMS AN PHÚ</h2>
          <p style={css.subtitle}>Quản trị Thiết bị Y tế</p>
        </div>

        {errorMsg && <div style={css.errorBanner}>⚠️ {errorMsg}</div>}

        <form onSubmit={handleAuth} style={css.form}>
          {mode === 'REGISTER' && (
            <div style={css.inputGroup}>
              <label style={css.label}>Họ và tên</label>
              <input style={css.input} value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
          )}
          <div style={css.inputGroup}>
            <label style={css.label}>Tên đăng nhập</label>
            <input style={css.input} autoFocus value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
          </div>
          <div style={css.inputGroup}>
            <label style={css.label}>Mật khẩu</label>
            <input style={css.input} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} style={css.submitBtn}>
            {loading ? 'Đang kiểm tra...' : 'Đăng nhập hệ thống'}
          </button>
        </form>
        <div style={css.footer}>
          <span onClick={() => { setMode(mode==='LOGIN'?'REGISTER':'LOGIN'); setErrorMsg(null); }} style={css.link}>
            {mode === 'LOGIN' ? 'Yêu cầu cấp tài khoản mới' : 'Quay lại đăng nhập'}
          </span>
        </div>
      </div>
    </div>
  );
};

const css: any = {
  wrapper: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#06090f' },
  loginBox: { width: 380, background: '#0d1520', padding: 40, borderRadius: 24, border: '1px solid #1a2840' },
  header: { textAlign: 'center', marginBottom: 30 },
  logo: { fontSize: 40, marginBottom: 10 },
  title: { color: '#00d4a8', margin: 0, fontSize: 22, fontWeight: 800 },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 5 },
  errorBanner: { background: '#ef444415', color: '#ef4444', padding: '12px', borderRadius: 10, fontSize: 12, border: '1px solid #ef444430', marginBottom: 20, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 15 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 11, color: '#94a3b8', marginLeft: 5 },
  input: { background: '#111d2e', border: '1px solid #1a2840', padding: '14px', borderRadius: 12, color: '#fff', outline: 'none', transition: '0.2s' },
  submitBtn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '15px', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', marginTop: 10 },
  footer: { marginTop: 25, textAlign: 'center' },
  link: { color: '#3b82f6', fontSize: 13, cursor: 'pointer' }
};