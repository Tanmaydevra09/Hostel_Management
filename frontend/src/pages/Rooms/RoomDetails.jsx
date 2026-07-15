import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roomsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, Info, Users, Banknote, Activity, PenTool, Zap, Wind, User, AlertCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoomDetails() {
  const { id } = useParams();
  const { canManage, isAdmin } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await roomsAPI.getById(id);
        setRoom(res.data.data);
      } catch (err) {
        toast.error('Failed to load room details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return <div className="loading-overlay"><div className="spinner" /></div>;
  }

  if (!room) {
    return (
      <div className="empty-state">
        <h4>Room not found</h4>
        <Link to="/rooms" className="btn btn-primary mt-4">Back to Rooms</Link>
      </div>
    );
  }

  const occPct = (room.current_occupancy / room.capacity) * 100;
  const washroom = room.amenities?.includes('Attached') ? 'Attached Washroom' : 'Common Washroom';

  return (
    <div className="animate-fade pb-10">
      {/* ── Breadcrumb & Header ────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3">
        <Link to="/rooms" className="btn btn-ghost btn-icon"><ChevronLeft size={20} /></Link>
        <div>
          <h1 className="page-title flex items-center gap-3">
            Room {room.block}-{room.room_number}
            {canManage ? (
              <div style={{ position: 'relative' }}>
                <span 
                  className={`badge badge-${room.maintenance_status === 'Good' ? 'success' : room.maintenance_status === 'Needs Maintenance' ? 'warning' : 'danger'} cursor-pointer`}
                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(!openDropdown); }}
                >
                  {room.maintenance_status}
                </span>
                {openDropdown && (
                  <div style={{
                    position: 'absolute', left: 0, top: '100%', marginTop: '4px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '8px', boxShadow: 'var(--shadow-md)', zIndex: 10,
                    minWidth: '160px', overflow: 'hidden', fontWeight: 'normal', fontSize: '1rem'
                  }}>
                    {['Good', 'Needs Maintenance', 'Under Maintenance'].map(status => (
                      <div 
                        key={status}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await roomsAPI.update(room.id, { ...room, maintenance_status: status });
                            setRoom({...room, maintenance_status: status});
                            setOpenDropdown(false);
                            toast.success('Room maintenance status updated');
                          } catch (err) { toast.error('Failed to update status'); }
                        }}
                        style={{
                          padding: '8px 12px', fontSize: '0.875rem', cursor: 'pointer',
                          background: room.maintenance_status === status ? 'var(--hover)' : 'transparent',
                          color: 'var(--text)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = room.maintenance_status === status ? 'var(--hover)' : 'transparent'}
                      >
                        {status}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className={`badge badge-${room.maintenance_status === 'Good' ? 'success' : room.maintenance_status === 'Needs Maintenance' ? 'warning' : 'danger'}`}>
                {room.maintenance_status}
              </span>
            )}
          </h1>
          <p className="page-subtitle">{room.gender === 'Male' ? 'Boys Hostel' : 'Girls Hostel'} • Block {room.block}</p>
        </div>
      </div>

      <div className="details-grid">
        
        {/* ── Left Column: Room Info ────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <div className="card">
            <h3 className="section-title mb-4"><Info size={18}/> Room Details</h3>
            
            <div className="flex flex-col gap-3">
              <div className="info-row">
                <span className="info-row-label">Type</span>
                <span className="info-row-value">{room.room_type} ({room.capacity} Sharing)</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Floor</span>
                <span className="info-row-value">{room.floor}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">AC / Non-AC</span>
                <span className="info-row-value flex items-center gap-1 justify-end">{room.is_ac ? <><Wind size={14} className="text-info"/> AC</> : 'Non-AC'}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Washroom</span>
                <span className="info-row-value">{washroom}</span>
              </div>
              <div className="info-row" style={{ borderBottom: 'none' }}>
                <span className="info-row-label">Monthly Rent</span>
                <span className="info-row-value text-primary-color">₹{Number(room.monthly_rent).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Occupancy</span>
                <span className="text-sm text-secondary">{room.current_occupancy} / {room.capacity} Beds</span>
              </div>
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${occPct >= 100 ? 'bg-danger' : occPct >= 70 ? 'bg-warning' : 'bg-success'}`} 
                  style={{ width: `${occPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--primary-dark)', color: 'white', borderColor: 'transparent' }}>
            <h3 className="section-title text-inverse mb-2"><Zap size={18}/> Quick Actions</h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>Manage this room and its residents</p>
            <div className="flex flex-col gap-2">
              <Link to="/students" className="btn w-full justify-center" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', display: 'flex' }}>Allocate Student</Link>
              <Link to="/complaints" className="btn w-full justify-center" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', display: 'flex' }}>Raise Maintenance Ticket</Link>
            </div>
          </div>
        </div>

        {/* ── Right Column: Students & Activities ───────────────────────────── */}
        <div className="flex flex-col gap-6">
          
          {/* Current Residents */}
          <div className="card">
            <h3 className="section-title mb-4"><Users size={18}/> Current Residents</h3>
            
            {!room.students || room.students.length === 0 ? (
              <div className="empty-state">
                <User size={32} className="mx-auto mb-2" style={{ opacity: 0.5 }}/>
                <p>No students currently allocated to this room.</p>
              </div>
            ) : (
              <div className="students-grid">
                {room.students.map(s => (
                  <Link to={`/students/${s.id}`} key={s.id} className="student-card">
                    <div className="avatar avatar-md">{s.name.charAt(0)}</div>
                    <div>
                      <div className="font-semibold text-sm">{s.name}</div>
                      <div className="text-xs text-secondary">{s.student_id} • {s.course}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="activity-grid">
            {/* Recent Maintenance */}
            <div className="card">
              <h3 className="section-title mb-4"><PenTool size={18}/> Maintenance</h3>
              <div className="empty-box">
                <p className="text-sm">No active maintenance tickets.</p>
              </div>
            </div>

            {/* Attendance Overview */}
            <div className="card">
              <h3 className="section-title mb-4"><Calendar size={18}/> Attendance Sync</h3>
              <div className="empty-box">
                <p className="text-sm">Attendance module linked.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .details-grid { display: grid; grid-template-columns: 350px 1fr; gap: 24px; }
        .students-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .activity-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 24px; }
        
        .student-card { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: var(--radius-lg); border: 1px solid var(--border); transition: var(--transition); color: inherit; text-decoration: none; }
        .student-card:hover { border-color: var(--primary); background: var(--hover); }
        
        .section-title { font-size: 1.125rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .text-inverse { color: white !important; }
        
        .empty-box { text-align: center; padding: 24px; color: var(--text-secondary); border: 1px dashed var(--border); border-radius: var(--radius-lg); }
        
        .bg-success { background: var(--success) !important; }
        .bg-warning { background: var(--warning) !important; }
        .bg-danger { background: var(--danger) !important; }
        .text-primary-color { color: var(--primary-dark) !important; }
        
        .pb-10 { padding-bottom: 40px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        
        @media (max-width: 900px) {
          .details-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
