import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, BellOff, X, CreditCard, MessageSquareWarning, CalendarOff, Users, User, Info, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { notificationsAPI } from '../../api';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/formatters';
import './Topbar.css';

const routeTitles = {
  '/dashboard':  'Dashboard',
  '/students':   'Students',
  '/rooms':      'Rooms',
  '/fees':       'Fees',
  '/complaints': 'Complaints',
  '/visitors':   'Visitors',
  '/attendance': 'Attendance',
  '/leave':      'Leave',
  '/notices':    'Notices',
  '/reports':    'Reports',
  '/settings':   'Settings',
};

const getNotifDetails = (type) => {
  switch (type) {
    case 'Fee':       return { icon: CreditCard,           color: 'success' };
    case 'Complaint': return { icon: MessageSquareWarning, color: 'warning' };
    case 'Leave':     return { icon: CalendarOff,          color: 'info' };
    case 'Student':   return { icon: Users,                color: 'primary' };
    case 'Visitor':   return { icon: User,                 color: 'primary' };
    default:          return { icon: Info,                 color: 'gray' };
  }
};

export default function Topbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread]       = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs]       = useState([]);

  const title = routeTitles[location.pathname] ||
    (location.pathname.startsWith('/students/') ? 'Student Profile' : 'Hostel Hub');

  useEffect(() => { fetchNotifications(); }, [location.pathname]);

  const fetchNotifications = () => {
    notificationsAPI.getAll()
      .then(res => { setUnread(res.data.unread); setNotifs(res.data.data || []); })
      .catch(() => {});
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setUnread(0);
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const clearAll = async () => {
    try {
      await notificationsAPI.clearAll();
      setUnread(0);
      setNotifs([]);
      toast.success('Notifications cleared');
    } catch { toast.error('Failed to clear notifications'); }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationsAPI.markRead(notif.id);
        setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnread(prev => Math.max(0, prev - 1));
      } catch (err) { console.error('Failed to mark read', err); }
    }
    setShowNotifs(false);
    if (notif.reference_url) navigate(notif.reference_url);
  };

  const initials = user?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-right">
        {/* Notification Bell */}
        <div className="notif-wrapper">
          <button className="topbar-icon-btn" onClick={() => setShowNotifs(true)} title="Notifications">
            <Bell size={18} />
            {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
          </button>
        </div>

        {/* User chip */}
        <div className="topbar-user">
          <div className="avatar avatar-sm">{initials}</div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.full_name}</span>
            <span className="topbar-user-role">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Notification Center Side Panel */}
      {showNotifs && (
        <>
          <div className="topbar-overlay" onClick={() => setShowNotifs(false)} />
          <div className="notif-panel">
            <div className="notif-header">
              <div>
                <span className="notif-header-title">Notifications</span>
                {unread > 0 && (
                  <span className="badge badge-danger" style={{ marginLeft: 8 }}>{unread} new</span>
                )}
              </div>
              <div className="notif-header-actions">
                {unread > 0 && (
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={markAllRead} title="Mark all read">
                    <Check size={16} />
                  </button>
                )}
                {notifs.length > 0 && (
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={clearAll} title="Clear all">
                    <Trash2 size={16} />
                  </button>
                )}
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowNotifs(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="notif-list">
              {notifs.length === 0 ? (
                <div className="notif-empty">
                  <BellOff size={44} />
                  <span>You're all caught up!</span>
                  <p className="text-sm text-muted">No notifications right now</p>
                </div>
              ) : (
                notifs.map(n => {
                  const { icon: Icon, color } = getNotifDetails(n.type);
                  return (
                    <div
                      key={n.id}
                      className={`notif-card ${!n.is_read ? 'unread' : ''}`}
                      onClick={() => handleNotifClick(n)}
                    >
                      <div
                        className="notif-icon-wrapper"
                        style={{ background: `var(--${color}-light)`, color: `var(--${color}-dark)` }}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="notif-content">
                        <div className="notif-card-title">{n.title}</div>
                        <div className="notif-msg">{n.message}</div>
                        <div className="notif-time">{formatDateTime(n.created_at)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
