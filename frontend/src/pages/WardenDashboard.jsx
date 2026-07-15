import { useEffect, useState } from 'react';
import { dashboardAPI } from '../api';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, UserX, DoorOpen, MessageSquareWarning,
  CalendarOff, Wrench, ShieldAlert, UsersRound, Percent, AlertCircle
} from 'lucide-react';
import './Dashboard.css';

const statCards = (stats) => [
  {
    icon: UserCheck, label: 'Present Today', value: stats?.presentToday ?? '—',
    color: 'success', iconBg: '#5FCB8D', iconColor: 'white',
    sub: 'Students in hostel', to: '/attendance',
  },
  {
    icon: UserX, label: 'Absent Today', value: stats?.absentToday ?? '—',
    color: 'danger', iconBg: '#F16C6C', iconColor: 'white',
    sub: 'Marked absent', to: '/attendance',
  },
  {
    icon: UsersRound, label: 'Active Visitors', value: stats?.activeVisitors ?? '—',
    color: 'info', iconBg: '#A9C5FF', iconColor: 'white',
    sub: 'Currently inside', to: '/visitors?active_only=true',
  },
  {
    icon: Percent, label: 'Attendance %', value: `${stats?.attendancePct ?? 0}%`,
    color: 'primary', iconBg: '#5FCB8D', iconColor: 'white',
    sub: 'Overall attendance', to: '/attendance',
  },
  {
    icon: MessageSquareWarning, label: 'Open Complaints', value: stats?.pendingComplaints ?? '—',
    color: 'warning', iconBg: '#F6B545', iconColor: 'white',
    sub: 'Needs resolution', to: '/complaints?status=Pending',
  },
  {
    icon: CalendarOff, label: 'Leave Requests', value: stats?.pendingLeave ?? '—',
    color: 'warning', iconBg: '#F6B545', iconColor: 'white',
    sub: 'Awaiting approval', to: '/leave?status=Pending',
  },
  {
    icon: Wrench, label: 'Maintenance', value: stats?.maintenanceRooms ?? '—',
    color: 'danger', iconBg: '#F16C6C', iconColor: 'white',
    sub: 'Rooms need fixing', to: '/rooms',
  },
  {
    icon: DoorOpen, label: 'Vacant Rooms', value: stats?.vacantRooms ?? '—',
    color: 'accent', iconBg: '#A9C5FF', iconColor: 'white',
    sub: 'Available for allocation', to: '/rooms',
  },
];

export default function WardenDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getWardenStats()
      .then((res) => {
        setStats(res.data.stats);
      })
      .catch(err => console.error("Error fetching warden stats:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-overlay" style={{ minHeight: 400 }}>
      <div className="spinner" style={{ width: 44, height: 44 }} />
    </div>
  );

  const cards = statCards(stats);
  const topCards = cards.slice(0, 4);
  const bottomQuick = cards.slice(4);

  return (
    <div className="dashboard animate-fade">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Warden Operations</h2>
        <p className="text-muted">Overview of daily hostel activities</p>
      </div>
      
      {/* ── Top Stat Cards ──────────────────────── */}
      <div className="stats-grid">
        {topCards.map((c, i) => (
          <Link key={i} to={c.to || '#'} className={`stat-card ${c.color}`} style={{ textDecoration: 'none' }}>
            <div className="stat-card-icon" style={{ background: c.iconBg, color: c.iconColor }}>
              <c.icon size={22} />
            </div>
            <div className="stat-card-body">
              <div className="stat-card-value">{c.value}</div>
              <div className="stat-card-label">{c.label}</div>
              {c.sub && <div className="text-xs text-muted" style={{ marginTop: 3 }}>{c.sub}</div>}
            </div>
          </Link>
        ))}
      </div>

      {/* ── Quick Stats Bottom Row ───────────────── */}
      <div className="quick-stats-row" style={{ marginTop: 24 }}>
        {bottomQuick.map((c, i) => (
          <Link key={i} to={c.to || '#'} className={`stat-card ${c.color}`} style={{ textDecoration: 'none' }}>
            <div className="stat-card-icon" style={{ background: c.iconBg, color: c.iconColor }}>
              <c.icon size={20} />
            </div>
            <div className="stat-card-body">
              <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{c.value}</div>
              <div className="stat-card-label">{c.label}</div>
              {c.sub && <div className="text-xs text-muted" style={{ marginTop: 2 }}>{c.sub}</div>}
            </div>
          </Link>
        ))}
      </div>
      
      {/* ── Today's Tasks ──────────────────────── */}
      <div className="dashboard-row" style={{ marginTop: 24 }}>
        <div className="card" style={{ flex: 1 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Priority Action Items</h3>
          </div>
          <div className="action-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats?.pendingComplaints > 0 && (
              <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 'var(--radius-md)', background: '#FFFBEB', border: '1px solid #FEF3C7' }}>
                <ShieldAlert size={20} color="#D97706" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#92400E' }}>Resolve Complaints</div>
                  <div style={{ fontSize: '0.85rem', color: '#B45309' }}>There are {stats.pendingComplaints} unresolved complaints.</div>
                </div>
                <Link to="/complaints" className="btn btn-sm btn-primary" style={{ background: '#D97706', borderColor: '#D97706' }}>View</Link>
              </div>
            )}
            {stats?.pendingLeave > 0 && (
              <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 'var(--radius-md)', background: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                <CalendarOff size={20} color="#2563EB" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#1E40AF' }}>Approve Leave Requests</div>
                  <div style={{ fontSize: '0.85rem', color: '#1D4ED8' }}>{stats.pendingLeave} students are waiting for leave approval.</div>
                </div>
                <Link to="/leave" className="btn btn-sm btn-primary" style={{ background: '#2563EB', borderColor: '#2563EB' }}>Review</Link>
              </div>
            )}
            {stats?.activeVisitors > 0 && (
              <div className="alert" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 'var(--radius-md)', background: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                <UsersRound size={20} color="#4B5563" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#374151' }}>Monitor Visitors</div>
                  <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>Ensure all {stats.activeVisitors} visitors check out before leaving.</div>
                </div>
                <Link to="/visitors" className="btn btn-sm btn-outline">Log</Link>
              </div>
            )}
            {stats?.pendingComplaints === 0 && stats?.pendingLeave === 0 && (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <AlertCircle size={28} color="#9CA3AF" />
                <h4 style={{ color: '#6B7280', marginTop: 8 }}>All caught up!</h4>
                <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>No pending tasks requiring immediate attention.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
