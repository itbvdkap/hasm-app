import { useState } from 'react';

export const ModuleSettings = ({ settings, onUpdate }: any) => {
  return (
    <div style={css.container}>
      <h1 style={{color: settings.theme === 'dark' ? '#fff' : '#1e293b'}}>⚙️ Cài đặt hệ thống</h1>
      <p style={{color: '#64748b', marginBottom: 40}}>Tùy chỉnh trải nghiệm cá nhân của bạn</p>

      <div style={css.grid}>
        {/* CHỌN GIAO DIỆN */}
        <div style={{...css.card, background: settings.theme === 'dark' ? '#111d2e' : '#fff', border: `1px solid ${settings.theme === 'dark' ? '#1a2840' : '#e2e8f0'}`}}>
          <h3 style={{color: settings.theme === 'dark' ? '#fff' : '#1e293b', marginTop: 0}}>🎨 Chế độ hiển thị</h3>
          <div style={css.optionRow}>
            <button onClick={() => onUpdate({ ...settings, theme: 'dark' })} 
              style={css.btn(settings.theme === 'dark', '#3b82f6')}>🌙 Chế độ Tối (Dark)</button>
            <button onClick={() => onUpdate({ ...settings, theme: 'light' })} 
              style={css.btn(settings.theme === 'light', '#3b82f6')}>☀️ Chế độ Sáng (Light)</button>
          </div>
        </div>

        {/* CHỌN CỠ CHỮ */}
        <div style={{...css.card, background: settings.theme === 'dark' ? '#111d2e' : '#fff', border: `1px solid ${settings.theme === 'dark' ? '#1a2840' : '#e2e8f0'}`}}>
          <h3 style={{color: settings.theme === 'dark' ? '#fff' : '#1e293b', marginTop: 0}}>🅰️ Kích thước chữ</h3>
          <div style={css.optionRow}>
            <button onClick={() => onUpdate({ ...settings, fontSize: 'small' })} 
              style={css.btn(settings.fontSize === 'small', '#00d4a8')}>Nhỏ</button>
            <button onClick={() => onUpdate({ ...settings, fontSize: 'medium' })} 
              style={css.btn(settings.fontSize === 'medium', '#00d4a8')}>Vừa</button>
            <button onClick={() => onUpdate({ ...settings, fontSize: 'large' })} 
              style={css.btn(settings.fontSize === 'large', '#00d4a8')}>Lớn</button>
          </div>
        </div>
      </div>

      <div style={{marginTop: 40, color: '#64748b', fontSize: 12}}>
        💡 Gợi ý: Chế độ Tối giúp bảo vệ mắt khi làm việc ban đêm, Chế độ Sáng phù hợp khi làm việc nơi có ánh sáng mạnh.
      </div>
    </div>
  );
};

const css: any = {
  container: { padding: '40px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 },
  card: { padding: 30, borderRadius: 20 },
  optionRow: { display: 'flex', gap: 10, marginTop: 20 },
  btn: (active: boolean, color: string) => ({
    flex: 1, padding: '15px', border: active ? `2px solid ${color}` : '1px solid #64748b40',
    borderRadius: 12, background: active ? `${color}15` : 'none',
    color: active ? color : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s'
  })
};