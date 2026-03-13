import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ theme }: any) => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: theme.bg,
      zIndex: 9999,
      color: theme.primary
    }}>
      <Loader2 size={48} className="animate-spin" />
      <p style={{ marginTop: '1rem', fontWeight: 600, color: theme.textMuted }}>Đang tải dữ liệu...</p>
      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
