import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Building2, 
  Stethoscope, 
  Factory, 
  Globe, 
  Search, 
  Plus, 
  MoreVertical, 
  CheckCircle2, 
  XCircle,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  ChevronRight,
  Mail,
  User as UserIcon,
  Trash2,
  Edit,
  FileDown
} from 'lucide-react';

export const ModuleCatalog = ({ theme, isMobile, isAdmin }: any) => {
  const [activeMenu, setActiveMenu] = useState('NHAN_VIEN');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING, BLOCKED
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  
  const MENU_GROUPS = [
    {
        title: 'HỆ THỐNG & PHÂN QUYỀN',
        items: [
            { id: 'NHAN_VIEN', label: 'Tài khoản & Nhân sự', icon: <Users size={18}/> },
            { id: 'QUYEN', label: 'Vai trò & Quyền hạn', icon: <ShieldCheck size={18}/> }
        ]
    },
    {
        title: 'DANH MỤC TÀI SẢN',
        items: [
            { id: 'LOAI_TB', label: 'Loại thiết bị', icon: <Stethoscope size={18}/>, table: 'DanhMucThietBi', colName: 'tenThietBi', colCode: 'maThietBi' },
            { id: 'KHOA', label: 'Khoa / Phòng ban', icon: <Building2 size={18}/>, table: 'KhoaPhong', colName: 'tenKhoaPhong', colCode: 'maKhoaPhong' },
            { id: 'HANG', label: 'Hãng sản xuất', icon: <Factory size={18}/>, table: 'HangSanXuat', colName: 'tenHangSanXuat', colCode: 'maHangSanXuat' },
            { id: 'NGUON', label: 'Nguồn gốc / Xuất xứ', icon: <Globe size={18}/>, table: 'NguonGocThietBi', colName: 'tenNguonGoc', colCode: 'maNguonGoc' }
        ]
    }
  ];

  const pendingCount = data.filter(u => u.status === 'PENDING').length;

  const getCurrentConfig = () => {
      const group = MENU_GROUPS.find(g => g.items.find(i => i.id === activeMenu));
      return group?.items.find(i => i.id === activeMenu);
  };

  const fetchData = async () => {
    setLoading(true);
    const config = getCurrentConfig();
    let query;

    if (activeMenu === 'NHAN_VIEN') {
        query = supabase.from('Users').select('*, KhoaPhong(tenKhoaPhong), Roles(roleName)');
    } else if (config?.table) {
        query = supabase.from(config.table).select('*');
    } else {
        setLoading(false); return;
    }
    
    const { data: res } = await query.order('id', { ascending: false });
    setData(res || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeMenu]);

  const handleUserAction = async (userId: string, status: string) => {
    try {
        if(status === 'REJECT') await supabase.from('Users').delete().eq('id', userId);
        else await supabase.from('Users').update({ status }).eq('id', userId);
        alert("Đã cập nhật trạng thái nhân sự!"); fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handleSaveCatalog = async () => {
      const config = getCurrentConfig();
      if(!config) return;

      try {
          const payload: any = {};
          if(config.colName) payload[config.colName] = formData.name;
          if(config.colCode) payload[config.colCode] = formData.code;

          if(!payload[config.colName]) return alert("Vui lòng nhập tên danh mục!");

          if(formData.id) {
              const { error } = await supabase.from(config.table!).update(payload).eq('id', formData.id);
              if(error) throw error;
              alert("Cập nhật thành công!");
          } else {
              const { error } = await supabase.from(config.table!).insert([payload]);
              if(error) throw error;
              alert("Thêm mới thành công!");
          }
          setShowModal(false);
          fetchData();
      } catch (e: any) { alert(e.message); }
  };

  const handleDeleteCatalog = async (id: number) => {
      if(!window.confirm("Bạn có chắc chắn muốn xóa mục này?")) return;
      const config = getCurrentConfig();
      if(!config) return;
      
      try {
          const { error } = await supabase.from(config.table!).delete().eq('id', id);
          if(error) throw error; 
          alert("Đã xóa thành công!");
          fetchData();
      } catch (e: any) {
          if(e.code === '23503') alert("Không thể xóa danh mục này vì đang được sử dụng trong hệ thống!");
          else alert(e.message);
      }
  };

  const filtered = data.filter(i => {
    const config = getCurrentConfig();
    let mSearch = false;
    if(activeMenu === 'NHAN_VIEN') mSearch = JSON.stringify(i).toLowerCase().includes(search.toLowerCase());
    else if(config) {
        mSearch = (i[config.colName!] || '').toLowerCase().includes(search.toLowerCase()) || 
                  (i[config.colCode!] || '').toLowerCase().includes(search.toLowerCase());
    }

    if (activeMenu === 'NHAN_VIEN') {
        if (activeTab === 'PENDING') return mSearch && i.status === 'PENDING';
        if (activeTab === 'BLOCKED') return mSearch && i.status === 'DISABLED';
    }
    return mSearch;
  });

  const handleExport = () => {
    const config = getCurrentConfig();
    const exportData = filtered.map((item, index) => {
        const row: any = { "STT": index + 1 };
        if(activeMenu === 'NHAN_VIEN') {
            row["Họ tên"] = item.fullName;
            row["Email"] = item.email;
            row["Khoa phòng"] = item.KhoaPhong?.tenKhoaPhong;
            row["Vai trò"] = item.Roles?.roleName;
            row["Trạng thái"] = item.status;
        } else if(config) {
            row["Tên danh mục"] = item[config.colName!];
            if(config.colCode) row["Mã danh mục"] = item[config.colCode];
        }
        return row;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${activeMenu}_Export.xlsx`);
  };

  const config = getCurrentConfig();

  return (
    <div style={{...s.mainWrapper, background: theme.bg, color: theme.text}}>
      {/* 1. INNER SIDEBAR (MENU DỌC) */}
      {!isMobile && (
        <div style={{...s.innerSidebar, borderRight: `1px solid ${theme.border}`, background: theme.card}}>
            {MENU_GROUPS.map((group, idx) => (
                <div key={idx} style={{marginBottom: '2rem'}}>
                    <div style={s.groupTitle}>{group.title}</div>
                    {group.items.map(item => (
                        <div key={item.id} onClick={()=>setActiveMenu(item.id)} style={s.menuItem(activeMenu===item.id, theme)}>
                            {item.icon} <span>{item.label}</span>
                            {item.id === 'NHAN_VIEN' && pendingCount > 0 && <div className="badge-pulse">{pendingCount}</div>}
                        </div>
                    ))}
                </div>
            ))}
        </div>
      )}

      {/* 2. CONTENT AREA */}
      <div style={s.contentArea}>
        <div style={s.contentHeader}>
            <div>
                <h2 style={{margin: 0, fontWeight: 800, fontSize: '1.5rem', color: theme.text}}>
                    {activeMenu === 'NHAN_VIEN' ? 'Quản lý Tài khoản & Nhân sự' : config?.label}
                </h2>
                <p style={{color: theme.textMuted, fontSize: '0.9rem', marginTop: 5}}>
                    {activeMenu === 'NHAN_VIEN' ? 'Phân quyền và xét duyệt tài khoản truy cập hệ thống' : 'Quản lý danh mục dùng chung toàn hệ thống'}
                </p>
            </div>
            <div style={s.headerActions}>
                <div style={{...s.searchBox, background: theme.card, borderColor: theme.border}}>
                    <Search size={18} color={theme.textMuted} />
                    <input placeholder="Tìm kiếm..." style={{...s.searchInput, color: theme.text}} onChange={e=>setSearch(e.target.value)} />
                </div>
                <button onClick={handleExport} style={s.exportBtn(theme)} title="Xuất báo cáo"><FileDown size={18}/></button>
                <button onClick={()=>{setFormData({}); setShowModal(true)}} style={{...s.addBtn, background: theme.primary}}>+ Thêm mới</button>
            </div>
        </div>

        {/* SUB TABS FOR USER MANAGEMENT */}
        {activeMenu === 'NHAN_VIEN' && (
            <div style={{...s.tabRow, borderColor: theme.border}}>
                <button onClick={()=>setActiveTab('ALL')} style={s.subTab(activeTab==='ALL', theme)}>Tất cả nhân sự <small style={s.count(activeTab==='ALL', theme)}>{data.length}</small></button>
                <button onClick={()=>setActiveTab('PENDING')} style={s.subTab(activeTab==='PENDING', theme)}>Chờ xét duyệt <small style={s.count(activeTab==='PENDING', theme)}>{pendingCount}</small></button>
                <button onClick={()=>setActiveTab('BLOCKED')} style={s.subTab(activeTab==='BLOCKED', theme)}>Đã khóa <small style={s.count(activeTab==='BLOCKED', theme)}>{data.filter(u=>u.status==='DISABLED').length}</small></button>
            </div>
        )}

        {/* LIST OF CARDS */}
        <div style={s.listGrid}>
            {filtered.map(item => (
                activeMenu === 'NHAN_VIEN' ? (
                    <UserCard key={item.id} user={item} onAction={handleUserAction} theme={theme} />
                ) : (
                    <div key={item.id} className="glass-card" style={{...s.simpleCard, background: theme.card, border: `1px solid ${theme.border}`}}>
                        <div style={{flex: 1}}>
                            <div style={{fontWeight: 700, color: theme.text}}>{item[config?.colName!] || '---'}</div>
                            <div style={{fontSize:'0.8rem', color: theme.textMuted, marginTop: 5}}>
                                {config?.colCode && item[config.colCode] ? item[config.colCode] : `ID: ${item.id}`}
                            </div>
                        </div>
                        <div style={{display:'flex', gap: 10}}>
                            <button onClick={()=>{setFormData({id: item.id, name: item[config?.colName!], code: item[config?.colCode!]}); setShowModal(true)}} style={{...s.iconBtn, color: theme.textMuted}}><Edit size={16}/></button>
                            <button onClick={()=>handleDeleteCatalog(item.id)} style={{...s.iconBtn, color: theme.danger}}><Trash2 size={16}/></button>
                        </div>
                    </div>
                )
            ))}
        </div>
      </div>

      {/* MODAL CATALOG */}
      {showModal && activeMenu !== 'NHAN_VIEN' && (
          <div style={s.overlay}>
              <div style={{...s.modal, background: theme.card, border: `1px solid ${theme.border}`}}>
                  <div style={{padding: '1.5rem', borderBottom:`1px solid ${theme.border}`}}>
                      <h3 style={{margin:0, color: theme.text}}>
                          {formData.id ? 'Cập nhật' : 'Thêm mới'} {config?.label}
                      </h3>
                  </div>
                  <div style={{padding: '1.5rem', display:'flex', flexDirection:'column', gap: '1rem'}}>
                      <div>
                          <label style={{...s.label, color: theme.textMuted}}>Tên danh mục</label>
                          <input style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder={`Nhập tên ${config?.label}...`} />
                      </div>
                      {config?.colCode && (
                          <div>
                              <label style={{...s.label, color: theme.textMuted}}>Mã (nếu có)</label>
                              <input style={{...s.input, background: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.code || ''} onChange={e=>setFormData({...formData, code: e.target.value})} placeholder="VD: KHOA-NOI" />
                          </div>
                      )}
                      <div style={{display:'flex', justifyContent:'flex-end', gap: 10, marginTop: 10}}>
                          <button onClick={()=>setShowModal(false)} style={s.cancelBtn}>Hủy bỏ</button>
                          <button onClick={handleSaveCatalog} style={{...s.saveBtn, background: theme.primary}}>Lưu lại</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .badge-pulse { background: #EF4444; color: #fff; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; margin-left: auto; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
      `}} />
    </div>
  );
};

const UserCard = ({ user, onAction, theme }: any) => {
    const isPending = user.status === 'PENDING';
    const roleColor = user.Roles?.roleName === 'ADMIN' ? '#8B5CF6' : (user.Roles?.roleName === 'GIAM_DOC' ? '#F59E0B' : theme.primary);

    return (
        <div className="glass-card" style={{...s.userCard, borderColor: isPending ? theme.warning : 'transparent', background: isPending ? theme.warning+'10' : theme.card, border: `1px solid ${isPending ? theme.warning : theme.border}`}}>
            <div style={{...s.avatar(user.fullName.charAt(0)), background: theme.bg, color: theme.primary}}>{user.fullName.charAt(0)}</div>
            <div style={{flex: 1}}>
                <div style={{display:'flex', alignItems:'center', gap: 10}}>
                    <b style={{fontSize: '1rem', color: theme.text}}>{user.fullName}</b>
                    {isPending && <span style={{...s.newBadge, background: theme.warning+'20', color: theme.warning}}>ĐĂNG KÝ MỚI</span>}
                </div>
                <div style={{display:'flex', alignItems:'center', gap: 15, color: theme.textMuted, fontSize: '0.85rem', marginTop: 4}}>
                    <span style={{display:'flex', alignItems:'center', gap: 4}}><Mail size={14}/> {user.email || 'no-email@hospital.vn'}</span>
                    <span>• {user.KhoaPhong?.tenKhoaPhong || 'Chưa gán khoa'}</span>
                </div>
            </div>

            <div style={{display:'flex', alignItems:'center', gap: '2rem'}}>
                <div style={{...s.roleBadge, color: roleColor, borderColor: `${roleColor}40`}}>
                    {user.Roles?.roleName || 'NHÂN VIÊN'}
                </div>
                <div style={{display:'flex', alignItems:'center', gap: 8, color: user.status==='ACTIVE'?theme.secondary:theme.textMuted, fontSize:'0.85rem', fontWeight: 700}}>
                    <div style={{width: 8, height: 8, borderRadius: '50%', background: user.status==='ACTIVE'?theme.secondary:theme.textMuted}} />
                    {user.status}
                </div>
                
                {isPending ? (
                    <div style={{display:'flex', gap: 10}}>
                        <button onClick={()=>onAction(user.id, 'REJECT')} style={{...s.rejectBtn, color: theme.textMuted}}>Từ chối</button>
                        <button onClick={()=>onAction(user.id, 'ACTIVE')} style={{...s.approveBtn, background: theme.secondary}}><CheckCircle2 size={16}/> Phê duyệt</button>
                    </div>
                ) : (
                    <button style={s.moreBtn}><MoreVertical size={20} color={theme.textMuted}/></button>
                )}
            </div>
        </div>
    );
};

const s: any = {
  mainWrapper: { display: 'flex', minHeight: '100vh' },
  innerSidebar: { width: '280px', padding: '2.5rem 1.5rem' },
  groupTitle: { fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '1px', marginBottom: '1rem', paddingLeft: '1rem' },
  menuItem: (active: boolean, t: any) => ({ display:'flex', alignItems:'center', gap: 12, padding: '0.8rem 1rem', borderRadius: '12px', cursor:'pointer', transition: '0.3s', background: active ? `${t.primary}15` : 'transparent', color: active ? t.primary : t.textMuted, fontWeight: active ? 700 : 500, fontSize: '0.9rem', marginBottom: 4 }),
  
  contentArea: { flex: 1, padding: '2.5rem 3.5rem' },
  contentHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: '2.5rem' },
  headerActions: { display:'flex', gap: '1rem', alignItems:'center' },
  searchBox: { display:'flex', alignItems:'center', gap: 10, padding: '0 1.25rem', borderRadius: '12px', border: '1px solid', width: '300px' },
  searchInput: { border:'none', outline:'none', flex: 1, padding: '0.8rem 0', fontSize: '0.9rem', background: 'none' },
  addBtn: { border:'none', padding: '0.8rem 1.5rem', borderRadius: '12px', color:'#fff', fontWeight: 700, cursor:'pointer' },
  exportBtn: (t: any) => ({ background: t.card, border: `1px solid ${t.border}`, color: t.textMuted, width: 45, height: 45, borderRadius: '12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }),
  
  tabRow: { display:'flex', gap: '2rem', borderBottom: '1.5px solid', marginBottom: '2rem' },
  subTab: (active: boolean, t: any) => ({ background: 'none', border: 'none', padding: '1rem 0', cursor: 'pointer', fontSize: '0.95rem', fontWeight: active ? 800 : 500, color: active ? t.text : t.textMuted, position:'relative', borderBottom: active ? `3px solid ${t.primary}` : '3px solid transparent' }),
  count: (active: boolean, t: any) => ({ marginLeft: 8, padding: '2px 8px', borderRadius: '6px', background: active ? t.primary+'20' : t.bg, fontSize: '0.75rem', color: active ? t.primary : t.textMuted }),
  
  listGrid: { display:'flex', flexDirection:'column', gap: '1rem' },
  userCard: { display:'flex', alignItems:'center', gap: '1.5rem', padding: '1.25rem 2rem', borderRadius: '20px' },
  avatar: (char: string) => ({ width: 50, height: 50, borderRadius: '50%', display:'flex', justifyContent:'center', alignItems:'center', fontSize: '1.2rem', fontWeight: 800, border: '2px solid transparent' }),
  newBadge: { fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' },
  roleBadge: { padding: '4px 12px', borderRadius: '8px', border: '1.5px solid', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' },
  
  approveBtn: { color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor:'pointer', display:'flex', alignItems:'center', gap: 6 },
  rejectBtn: { background: 'none', border: 'none', fontWeight: 700, cursor:'pointer', padding: '0.6rem 1rem' },
  moreBtn: { background:'none', border:'none', cursor:'pointer' },
  simpleCard: { padding: '1.5rem', borderRadius: '16px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  iconBtn: { border:'none', background:'none', cursor:'pointer', padding: 5 },
  overlay: { position:'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 2000 },
  modal: { width: '100%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden' },
  label: { fontSize: '0.85rem', fontWeight: 700, display:'block', marginBottom: 5 },
  input: { padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  cancelBtn: { padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', background: '#F1F5F9', color: '#64748B', fontWeight: 700, cursor: 'pointer' },
  saveBtn: { padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }
};