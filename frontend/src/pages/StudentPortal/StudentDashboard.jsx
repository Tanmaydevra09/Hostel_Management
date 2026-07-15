import { useEffect, useState } from 'react';
import { formatDate } from '../../utils/formatters';
import { studentPortalAPI } from '../../api';
import {
  Building2, User, CreditCard, Bell, Users, Calendar,
  AlertTriangle, FileText, ArrowUpRight, MapPin,
  BookOpen, Phone, Heart, CheckCircle, Clock, Wrench, FileDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

const statusBadge = (status) => {
  const map = {
    Paid: 'success', Pending: 'warning', Overdue: 'danger', Partial: 'info',
    Resolved: 'success', 'In Progress': 'info', Closed: 'gray',
    Approved: 'success', Rejected: 'danger'
  };
  return <span className={`badge badge-${map[status] || 'gray'}`}>{status}</span>;
};

const MiniStat = ({ icon: Icon, value, label, color, bg }) => (
  <div style={{
    background: bg || 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    textAlign: 'center',
    transition: 'var(--transition)',
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: color ? `${color}18` : 'var(--primary-light)',
      color: color || 'var(--primary-dark)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 10px',
    }}>
      <Icon size={18} />
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
  </div>
);

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    studentPortalAPI.getDashboard()
      .then(res => setData(res.data.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-overlay"><div className="spinner" style={{ width: 44, height: 44 }} /></div>;
  if (error) return <div className="empty-state"><AlertTriangle size={40} /><h4>Error</h4><p>{error}</p></div>;
  if (!data) return <div className="empty-state"><h4>No data available</h4></div>;

  const { profile, roommates, feeSummary, recentFees, attendanceSummary, leaveSummary, complaintSummary, recentLeaves, recentComplaints, notices } = data;

  let presentDays = 0, totalDays = 0;
  attendanceSummary?.forEach(item => {
    totalDays += item.count;
    if (item.status === 'Present') presentDays += item.count;
  });
  const attendancePct = totalDays === 0 ? 0 : Math.round((presentDays / totalDays) * 100);
  const attendanceStr = totalDays === 0 ? 'N/A' : `${attendancePct}%`;

  const getSummaryCount = (summary, status) => summary?.find(s => s.status === status)?.count || 0;

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Welcome Hero ────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1B1D22 0%, #2A2D35 60%, #1a2a1f 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* background glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 80% 50%, rgba(95,203,141,0.15) 0%, transparent 60%)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #5FCB8D, #4AB87A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, color: 'white',
            border: '3px solid rgba(255,255,255,0.15)',
            flexShrink: 0,
          }}>
            {profile?.photo_path
              ? <img src={profile.photo_path} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : profile?.name?.charAt(0)
            }
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Welcome back
            </p>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', marginBottom: 6 }}>
              {profile?.name}
            </h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: 'rgba(95,203,141,0.2)', color: '#5FCB8D' }}>ID: {profile?.student_id}</span>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>{profile?.email}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 1, flexShrink: 0 }}>
          <Link to="/settings" className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
            Edit Profile
          </Link>
        </div>
      </div>

      {/* ── Top Stat Cards ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div className="stat-card info">
          <div className="stat-card-icon" style={{ background: '#A9C5FF', color: 'white' }}>
            <Calendar size={22} />
          </div>
          <div className="stat-card-body">
            <div className="stat-card-value">{attendanceStr}</div>
            <div className="stat-card-label">Attendance</div>
            <div className="text-xs text-muted" style={{ marginTop: 3 }}>{presentDays}/{totalDays} days</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-card-icon" style={{ background: '#5FCB8D', color: 'white' }}>
            <CreditCard size={22} />
          </div>
          <div className="stat-card-body">
            <div className="stat-card-value">₹{Number(feeSummary?.total_paid || 0).toLocaleString()}</div>
            <div className="stat-card-label">Fees Paid</div>
            <div className="text-xs text-muted" style={{ marginTop: 3 }}>Total paid</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-card-icon" style={{ background: '#F6B545', color: 'white' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-card-body">
            <div className="stat-card-value">₹{Number(feeSummary?.total_pending || 0).toLocaleString()}</div>
            <div className="stat-card-label">Pending Dues</div>
            <div className="text-xs text-muted" style={{ marginTop: 3 }}>Outstanding</div>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column ──────────────────────── */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* LEFT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

          {/* My Accommodation */}
          {profile?.room_number && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', background: 'var(--primary-dark)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={20} color="white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'white' }}>{profile.block}-{profile.room_number}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{profile.hostel_gender === 'Female' ? 'Girls Hostel' : 'Boys Hostel'}</div>
                  </div>
                </div>
                <div>
                   <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>Occupied</span>
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 24px', marginBottom: 24 }}>
                  <div className="info-row" style={{flexDirection:'column', alignItems:'flex-start', gap:4}}>
                    <span className="info-row-label text-xs">Floor</span>
                    <span className="info-row-value font-semibold">{profile.floor}</span>
                  </div>
                  <div className="info-row" style={{flexDirection:'column', alignItems:'flex-start', gap:4}}>
                    <span className="info-row-label text-xs">Room Type</span>
                    <span className="info-row-value font-semibold">{profile.room_type}</span>
                  </div>
                  <div className="info-row" style={{flexDirection:'column', alignItems:'flex-start', gap:4}}>
                    <span className="info-row-label text-xs">Sharing Capacity</span>
                    <span className="info-row-value font-semibold">{profile.capacity} Sharing</span>
                  </div>
                  <div className="info-row" style={{flexDirection:'column', alignItems:'flex-start', gap:4}}>
                    <span className="info-row-label text-xs">Air Conditioning</span>
                    <span className="info-row-value font-semibold">{profile.is_ac ? 'AC' : 'Non-AC'}</span>
                  </div>
                  <div className="info-row" style={{flexDirection:'column', alignItems:'flex-start', gap:4}}>
                    <span className="info-row-label text-xs">Washroom</span>
                    <span className="info-row-value font-semibold">{profile.washroom_type || 'Attached'}</span>
                  </div>
                  <div className="info-row" style={{flexDirection:'column', alignItems:'flex-start', gap:4}}>
                    <span className="info-row-label text-xs">Monthly Rent</span>
                    <span className="info-row-value font-semibold">₹{Number(profile.monthly_rent || 0).toLocaleString()}</span>
                  </div>
                  <div className="info-row" style={{flexDirection:'column', alignItems:'flex-start', gap:4}}>
                    <span className="info-row-label text-xs">Maintenance Status</span>
                    <span className="info-row-value font-semibold text-success">{profile.maintenance_status || 'Good'}</span>
                  </div>
                </div>

                <div className="divider" style={{ margin: '0 0 20px 0' }} />

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                     <h4 className="font-semibold text-sm m-0">Current Occupancy</h4>
                     <span className="text-sm font-semibold">{profile.current_occupancy || 1} / {profile.capacity} Students</span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div className="progress-bar-fill" style={{ width: `${((profile.current_occupancy || 1) / profile.capacity) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
                  </div>
                </div>



                <div style={{ marginBottom: 24 }}>
                  <h4 className="font-semibold text-sm m-0" style={{ marginBottom: 12 }}>Current Roommates</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Array.from({ length: profile.capacity }).map((_, i) => {
                      const isMe = i === 0;
                      const rm = isMe ? profile : (roommates?.[i - 1]);
                      if (rm) {
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: isMe ? 'rgba(95,203,141,0.08)' : 'var(--surface)', borderRadius: 8, border: isMe ? '1px solid rgba(95,203,141,0.3)' : '1px solid var(--border)' }}>
                            <div className="avatar avatar-sm" style={{ background: isMe ? 'var(--primary)' : 'var(--bg-color)', color: isMe ? 'white' : 'var(--text)' }}>{rm.name?.charAt(0)}</div>
                            <div style={{ flex: 1 }}>
                              <div className="font-semibold text-sm flex items-center gap-2">
                                {rm.name} 
                                {isMe && <span className="badge badge-primary" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>You</span>}
                              </div>
                              <div className="text-xs text-muted">{rm.course || rm.phone || 'Student'}</div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-color)', borderRadius: 8, border: '1px dashed var(--border)', opacity: 0.7 }}>
                            <div className="avatar avatar-sm" style={{ background: 'transparent', border: '1px dashed var(--text-muted)', color: 'var(--text-muted)' }}>?</div>
                            <div className="text-sm font-semibold text-muted">Vacant</div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Profile Details */}
          <div className="card">
            <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
              <User size={18} color="var(--primary-dark)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Profile Details</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { label: 'Phone',         value: profile?.phone,                         icon: Phone },
                { label: 'Course / Year', value: `${profile?.course} (Year ${profile?.year})`, icon: BookOpen },
                { label: 'Department',    value: profile?.department,                    icon: FileText },
                { label: 'Blood Group',   value: profile?.blood_group,                   icon: Heart },
                { label: 'Address',       value: profile?.address,                       icon: MapPin },
              ].filter(r => r.value).map((row, i) => (
                <div key={i} className="info-row">
                  <span className="info-row-label">{row.label}</span>
                  <span className="info-row-value">{row.value || '—'}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 12 }}>Emergency Contacts</div>
              {[
                { label: 'Parent Name',  value: profile?.parent_name },
                { label: 'Parent Phone', value: profile?.parent_phone },
                { label: 'Emergency',    value: profile?.emergency_contact_phone },
              ].map((row, i) => (
                <div key={i} className="info-row">
                  <span className="info-row-label">{row.label}</span>
                  <span className="info-row-value">{row.value || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Summary */}
          <div className="card">
            <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
              <FileText size={18} color="var(--primary-dark)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Activity Summary</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <MiniStat icon={CheckCircle} value={getSummaryCount(leaveSummary, 'Approved')} label="Approved Leaves" color="#5FCB8D" />
              <MiniStat icon={Clock}       value={getSummaryCount(leaveSummary, 'Pending')}  label="Pending Leaves" color="#F6B545" />
              <MiniStat icon={CheckCircle} value={getSummaryCount(complaintSummary, 'Resolved')} label="Resolved Complaints"  color="#5FCB8D" />
              <MiniStat icon={AlertTriangle} value={getSummaryCount(complaintSummary, 'Pending')} label="Open Complaints"     color="#F16C6C" />
            </div>
          </div>


        </div>

        {/* RIGHT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

          {/* Payment History */}
          <div className="card">
            <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
              <div className="flex items-center gap-2">
                <CreditCard size={18} color="var(--primary-dark)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Payment History</h3>
              </div>
              <Link to="/fees" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', gap: 4 }}>
                View all <ArrowUpRight size={12} />
              </Link>
            </div>
            {!recentFees?.length ? (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <CreditCard size={28} />
                <h4>No fee records</h4>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fee</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFees.map(f => (
                      <tr key={f.id}>
                        <td>
                          <div className="font-medium" style={{ fontSize: '0.875rem' }}>{f.title}</div>
                          <div className="text-xs text-muted">Due: {formatDate(f.due_date)}</div>
                        </td>
                        <td style={{ fontWeight: 700 }}>₹{Number(f.amount).toLocaleString()}</td>
                        <td>{statusBadge(f.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Latest Notices */}
          <div className="card">
            <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
              <div className="flex items-center gap-2">
                <Bell size={18} color="var(--primary-dark)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Latest Notices</h3>
              </div>
              <Link to="/notices" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', gap: 4 }}>
                View all <ArrowUpRight size={12} />
              </Link>
            </div>
            {!notices?.length ? (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <Bell size={28} />
                <h4>No active notices</h4>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notices.map(n => (
                  <div key={n.id} style={{
                    padding: '14px 16px',
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    transition: 'var(--transition)',
                  }}>
                    <div className="flex justify-between items-start" style={{ marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary-dark)' }}>{n.title}</div>
                      <span className="badge badge-info">{n.category}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }} className="line-clamp-2">{n.content}</p>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
                      {formatDate(n.created_at)} · {n.posted_by}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
