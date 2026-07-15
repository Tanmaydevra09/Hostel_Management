import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '../../utils/formatters';
import { attendanceAPI, studentsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { CalendarCheck2, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Present', 'Absent', 'On Leave', 'Night Out'];
const statusColor = { Present:'success', Absent:'danger', 'On Leave':'warning', 'Night Out':'info' };

export default function AttendancePage() {
  const { canManage } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate]           = useState(today);
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents]   = useState([]);
  const [stats, setStats]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [edits, setEdits]         = useState({}); // student_id -> status

  const loadStudents = async () => {
    const res = await studentsAPI.getAll({ status: 'Active', limit: 200 });
    setStudents(res.data.data || []);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.get({ date });
      setAttendance(res.data.data || []);
      setStats(res.data.stats || {});
      // Build edits map
      const map = {};
      res.data.data?.forEach(a => { map[a.student_id] = a.status; });
      setEdits(map);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { loadStudents(); }, []);
  useEffect(() => { load(); }, [load]);

  const changeDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const records = students.map(s => ({
        student_id: s.id,
        status: edits[s.id] || 'Present',
      }));
      await attendanceAPI.mark({ date, records });
      toast.success('Attendance saved!');
      load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Attendance</h2>
          <p className="page-subtitle">{stats.total||0} marked • {stats.present||0} present • {stats.absent||0} absent</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={saveAttendance} disabled={saving}>
            <Save size={16}/> {saving ? 'Saving…' : 'Save Attendance'}
          </button>
        )}
      </div>

      {/* Date Navigator */}
      <div className="flex items-center gap-3" style={{marginBottom:20}}>
        <button className="btn btn-secondary btn-icon" onClick={() => changeDate(-1)}><ChevronLeft size={18}/></button>
        <input type="date" className="form-control" value={date} onChange={e=>setDate(e.target.value)} style={{width:180}} />
        <button className="btn btn-secondary btn-icon" onClick={() => changeDate(1)} disabled={date >= today}><ChevronRight size={18}/></button>
        <span className="text-secondary text-sm">{formatDate(date)}</span>
      </div>

      {/* Stats Row */}
      <div className="attendance-stats" style={{marginBottom:20}}>
        {Object.entries(statusColor).map(([s,c]) => (
          <div key={s} className="card" style={{padding:'14px 18px',display:'flex',gap:10,alignItems:'center'}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:`var(--${c})`}}/>
            <div>
              <div className="font-semibold">{attendance.filter(a=>a.status===s).length || edits && Object.values(edits).filter(v=>v===s).length || 0}</div>
              <div className="text-xs text-muted">{s}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Student</th><th>Room</th><th>Status</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3}><div className="loading-overlay"><div className="spinner"/></div></td></tr>
            ) : students.length===0 ? (
              <tr><td colSpan={3}><div className="empty-state"><CalendarCheck2 size={36}/><h4>No active students</h4></div></td></tr>
            ) : students.map(s => {
              const status = edits[s.id] || 'Present';
              return (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar avatar-sm">{s.name?.charAt(0)}</div>
                      <div>
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs text-muted">{s.student_id} • {s.course}</div>
                      </div>
                    </div>
                  </td>
                  <td>{s.room_number ? `${s.block}-${s.room_number}` : '—'}</td>
                  <td>
                    {canManage ? (
                      <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map(opt => (
                          <button key={opt}
                            className={`btn btn-sm ${status===opt?`btn-${statusColor[opt]==='success'?'success':statusColor[opt]==='danger'?'danger':statusColor[opt]==='warning'?'secondary':'secondary'}`:'btn-ghost'}`}
                            style={status===opt?{opacity:1}:{opacity:0.5}}
                            onClick={() => setEdits(e=>({...e,[s.id]:opt}))}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className={`badge badge-${statusColor[status]}`}>{status}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        .attendance-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
        @media(max-width:700px){.attendance-stats{grid-template-columns:repeat(2,1fr);}}
      `}</style>
    </div>
  );
}
