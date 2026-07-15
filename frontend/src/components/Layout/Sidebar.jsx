import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, DoorOpen, CreditCard,
  MessageSquareWarning, UserCheck, CalendarCheck2,
  CalendarOff, Bell, FileBarChart, Settings, LogOut,
  Building2, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import { useState } from 'react';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard,       label: 'Dashboard',   roles: ['admin','warden','student'] },
  { to: '/students',    icon: Users,                  label: 'Students',    roles: ['admin','warden'] },
  { to: '/rooms',       icon: DoorOpen,               label: 'Rooms',       roles: ['admin','warden'] },
  { to: '/fees',        icon: CreditCard,             label: 'Fees',        roles: ['admin','warden','student'] },
  { to: '/complaints',  icon: MessageSquareWarning,   label: 'Complaints',  roles: ['admin','warden','student'] },
  { to: '/visitors',    icon: UserCheck,              label: 'Visitors',    roles: ['admin','warden'] },
  { to: '/attendance',  icon: CalendarCheck2,         label: 'Attendance',  roles: ['admin','warden'] },
  { to: '/leave',       icon: CalendarOff,            label: 'Leave',       roles: ['admin','warden','student'] },
  { to: '/notices',     icon: Bell,                   label: 'Notices',     roles: ['admin','warden','student'] },
  { to: '/reports',     icon: FileBarChart,           label: 'Reports',     roles: ['admin','warden'] },
  { to: '/settings',    icon: Settings,               label: 'Settings',    roles: ['admin','warden','student'] },
  { to: '/audit-logs',  icon: Activity,               label: 'Audit Logs',  roles: ['admin'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const filtered = navItems.filter(item => item.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Building2 size={20} />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <span className="brand-title">Hostel Hub</span>
            <span className="brand-subtitle">Management System</span>
          </div>
        )}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      {!collapsed && <span className="sidebar-section-label">Main Menu</span>}
      <nav className="sidebar-nav">
        {filtered.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={collapsed ? label : undefined}
          >
            <span className="sidebar-link-icon"><Icon size={18} /></span>
            {!collapsed && <span className="sidebar-link-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.full_name}</span>
              <span className="sidebar-user-role">{user?.role}</span>
            </div>
          )}
        </div>
        <button className="sidebar-logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
