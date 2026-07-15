import { useEffect, useState } from 'react';
import { dashboardAPI, auditAPI } from '../api';
import { Link } from 'react-router-dom';
import {
  Users, DoorOpen, CreditCard, MessageSquareWarning,
  CalendarOff, TrendingUp, Home, AlertCircle,
  TrendingDown, Minus, ArrowUpRight, Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import './Dashboard.css';

const statCards = (stats) => [
  {
    icon: Users, label: 'Total Students', value: stats?.totalStudents ?? '—',
    color: 'primary', iconBg: '#5FCB8D', iconColor: 'white',
    sub: 'Registered residents', to: '/students',
    trend: 'Currently active', trendUp: null,
  },
  {
    icon: Home, label: 'Total Rooms', value: stats?.totalRooms ?? '—',
    color: 'info', iconBg: '#A9C5FF', iconColor: 'white',
    sub: `${stats?.occupancyRate ?? 0}% occupancy rate`, to: '/rooms',
    trend: `${stats?.occupiedRooms ?? 0} occupied`, trendUp: null,
  },
  {
    icon: TrendingUp, label: 'Total Revenue', value: `₹${((stats?.totalRevenue || 0)/1000).toFixed(0)}k`,
    color: 'success', iconBg: '#5FCB8D', iconColor: 'white',
    sub: 'Fees collected', to: '/reports',
    trend: `₹${(stats?.totalRevenue || 0).toLocaleString()} total`, trendUp: true,
  },
  {
    icon: CreditCard, label: 'Pending Fees', value: stats?.pendingFees ?? '—',
    color: 'warning', iconBg: '#F6B545', iconColor: 'white',
    sub: `₹${(stats?.totalPendingAmount || 0).toLocaleString()} outstanding`, to: '/fees?status=Pending',
    trend: 'Requires attention', trendUp: false,
  },
  {
    icon: DoorOpen, label: 'Vacant Rooms', value: stats?.vacantRooms ?? '—',
    color: 'accent', iconBg: '#A9C5FF', iconColor: 'white',
    sub: 'Available for allocation', to: '/rooms?availability=available',
    trend: null, trendUp: null,
  },
  {
    icon: MessageSquareWarning, label: 'Open Complaints', value: stats?.pendingComplaints ?? '—',
    color: 'danger', iconBg: '#F16C6C', iconColor: 'white',
    sub: 'Needs resolution', to: '/complaints?status=Pending',
    trend: 'Unresolved', trendUp: false,
  },
  {
    icon: CalendarOff, label: 'Leave Requests', value: stats?.pendingLeave ?? '—',
    color: 'warning', iconBg: '#F6B545', iconColor: 'white',
    sub: 'Awaiting approval', to: '/leave?status=Pending',
    trend: null, trendUp: null,
  },
  {
    icon: DoorOpen, label: 'Occupied Rooms', value: stats?.occupiedRooms ?? '—',
    color: 'success', iconBg: '#5FCB8D', iconColor: 'white',
    sub: `${stats?.occupancyRate ?? 0}% of total rooms`, to: '/rooms',
    trend: null, trendUp: null,
  },
];

const statusBadge = (status) => {
  const map = {
    Paid: 'success', Pending: 'warning', Overdue: 'danger', Partial: 'info',
    Resolved: 'success', 'In Progress': 'info', Closed: 'gray',
    Active: 'success', Inactive: 'warning', Left: 'danger',
  };
  return <span className={`badge badge-${map[status] || 'gray'}`}>{status}</span>;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="card" style={{ padding: '12px 16px', minWidth: 140, boxShadow: 'var(--shadow-md)' }}>
        <p className="text-xs text-muted font-semibold" style={{ marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
          ₹{Number(payload[0].value).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats]     = useState(null);
  const [activity, setActivity] = useState({});
  const [revenue, setRevenue] = useState([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.getStats(),
      dashboardAPI.getRecentActivity(),
      dashboardAPI.getMonthlyRevenue(),
      auditAPI.getLogs({ limit: 5 })
    ]).then(([s, a, r, logRes]) => {
      setStats(s.data.stats);
      setActivity(a.data);
      setRevenue(r.data.data || []);
      setRecentAuditLogs(logRes.data.data || []);
    }).finally(() => setLoading(false));
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
              {c.trend && (
                <div className={`stat-card-trend ${c.trendUp === true ? 'trend-up' : c.trendUp === false ? 'trend-down' : 'trend-neutral'}`}>
                  {c.trendUp === true  && <TrendingUp size={12} />}
                  {c.trendUp === false && <TrendingDown size={12} />}
                  {c.trendUp === null  && <Minus size={12} />}
                  {c.trend}
                </div>
              )}
            </div>
            <ArrowUpRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, alignSelf: 'flex-start' }} />
          </Link>
        ))}
      </div>

      {/* ── Chart + Recent Admissions ────────────── */}
      <div className="dashboard-row">
        {/* Revenue Chart */}
        <div className="card dashboard-chart-card">
          <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 2 }}>Revenue Overview</h3>
              <p className="text-sm text-muted">Monthly fee collection by gender</p>
            </div>
          </div>
          {revenue.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={32} />
              <h4>No data yet</h4>
              <p>Revenue appears once fees are paid</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenue} barSize={30} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#9CA3AF', fontSize: 12, fontFamily: 'Inter' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'Inter' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(95,203,141,0.06)' }} />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                  {revenue.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === revenue.length - 1 ? '#5FCB8D' : '#D1F0E2'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Admissions */}
        <div className="card dashboard-recent-card">
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Admissions</h3>
            <Link to="/students" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', gap: 4 }}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {!activity.recentStudents?.length ? (
            <div className="empty-state">
              <Users size={28} />
              <h4>No students yet</h4>
            </div>
          ) : (
            <div className="recent-list">
              {activity.recentStudents.map(s => (
                <Link key={s.id} to={`/students/${s.id}`} className="recent-item">
                  <div className="avatar avatar-sm">{s.name?.charAt(0)}</div>
                  <div className="recent-item-body">
                    <div className="recent-item-name">{s.name}</div>
                    <div className="recent-item-sub">{s.course} · {s.department}</div>
                  </div>
                  <span className="badge badge-primary">{s.student_id}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Fees + Complaints ─────────────── */}
      <div className="dashboard-row">
        <div className="card" style={{ flex: 1, minWidth: 0 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Fee Payments</h3>
            <Link to="/fees" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', gap: 4 }}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="table-container" style={{ borderRadius: 'var(--radius-md)' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Month</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activity.recentFees?.length ? activity.recentFees.map(f => (
                  <tr key={f.id}>
                    <td>
                      <div className="font-semibold" style={{ fontSize: '0.875rem' }}>{f.student_name}</div>
                      <div className="text-xs text-muted">{f.student_code}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success-dark)' }}>₹{Number(f.amount).toLocaleString()}</td>
                    <td className="text-sm">{f.month_year || '—'}</td>
                    <td>{statusBadge(f.status)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4}><div className="empty-state" style={{ padding: '32px 20px' }}><CreditCard size={28} /><h4>No fee records</h4></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 0 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Complaints</h3>
            <Link to="/complaints" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', gap: 4 }}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="table-container" style={{ borderRadius: 'var(--radius-md)' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activity.recentComplaints?.length ? activity.recentComplaints.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="font-semibold" style={{ fontSize: '0.875rem' }}>{c.student_name}</div>
                      <div className="text-xs text-muted">{c.student_code}</div>
                    </td>
                    <td className="text-sm">{c.category}</td>
                    <td>
                      <span className={`badge badge-${c.priority === 'Critical' || c.priority === 'High' ? 'danger' : c.priority === 'Medium' ? 'warning' : 'gray'}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td>{statusBadge(c.status)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4}><div className="empty-state" style={{ padding: '32px 20px' }}><MessageSquareWarning size={28} /><h4>No complaints</h4></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Bottom Row ───────────────── */}
      <div className="quick-stats-row" style={{ marginTop: 24, marginBottom: 24 }}>
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

      {/* ── Recent System Activity (Audit) ─────────────── */}
      <div className="dashboard-row" style={{ marginTop: 24 }}>
        <div className="card" style={{ flex: 1, minWidth: 0 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent System Activity</h3>
            <Link to="/audit-logs" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', gap: 4 }}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="table-container" style={{ borderRadius: 'var(--radius-md)' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Description</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentAuditLogs?.length ? recentAuditLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div className="font-semibold" style={{ fontSize: '0.875rem' }}>{log.user_name}</div>
                      <div className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>{log.role}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${
                        log.action.toLowerCase() === 'create' ? 'success' : 
                        log.action.toLowerCase() === 'update' ? 'info' : 
                        log.action.toLowerCase() === 'delete' ? 'danger' : 'gray'
                      }`}>{log.action}</span>
                    </td>
                    <td className="text-sm font-medium">{log.module}</td>
                    <td className="text-sm text-muted" style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.description}
                    </td>
                    <td className="text-xs text-muted">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5}><div className="empty-state" style={{ padding: '32px 20px' }}><Activity size={28} /><h4>No recent activity</h4></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
