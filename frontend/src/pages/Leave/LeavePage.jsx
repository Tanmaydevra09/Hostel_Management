import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '../../utils/formatters';
import { leaveAPI, studentsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Plus, X, CheckCircle, XCircle, CalendarOff } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColor = { Pending:'warning', Approved:'success', Rejected:'danger' };

function LeaveModal({ students, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ student_id:'', from_date:'', to_date:'', reason:'', leave_type:'Personal' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_id||!form.from_date||!form.to_date||!form.reason) { toast.error('All fields required'); return; }
    setLoading(true);
    try { await leaveAPI.create(form); toast.success('Leave request submitted!'); onSave(); }
    catch(err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Submit Leave Request</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Student *</label>
              <select className="form-control" value={form.student_id} onChange={e=>set('student_id',e.target.value)} required>
                <option value="">Select Student</option>
                {students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.student_id})</option>)}
              </select>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">From Date *</label>
                <input type="date" className="form-control" value={form.from_date} onChange={e=>set('from_date',e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">To Date *</label>
                <input type="date" className="form-control" value={form.to_date} onChange={e=>set('to_date',e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Leave Type</label>
              <select className="form-control" value={form.leave_type} onChange={e=>set('leave_type',e.target.value)}>
                {['Home Visit','Medical','Personal','Other'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Reason *</label>
              <textarea className="form-control" value={form.reason} onChange={e=>set('reason',e.target.value)} rows={3} required placeholder="Describe reason for leave…" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Submitting…':'Submit Request'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewModal({ leave, onClose, onSave }) {
  const [form, setForm] = useState({ status:'Approved', review_remarks:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await leaveAPI.review(leave.id, form); toast.success(`Leave ${form.status.toLowerCase()}!`); onSave(); }
    catch(err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-sm">
        <div className="modal-header">
          <h3>Review Leave Request</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="card" style={{padding:'12px 16px',background:'var(--surface)',marginBottom:12}}>
              <div className="font-semibold">{leave.student_name}</div>
              <div className="text-sm text-muted">{formatDate(leave.from_date)} → {formatDate(leave.to_date)}</div>
              <div className="text-sm" style={{marginTop:6}}>{leave.reason}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Decision</label>
              <div className="flex gap-3">
                {['Approved','Rejected'].map(s=>(
                  <button type="button" key={s}
                    className={`btn flex-1 ${form.status===s?(s==='Approved'?'btn-success':'btn-danger'):'btn-secondary'}`}
                    onClick={() => setForm(f=>({...f,status:s}))}>
                    {s==='Approved'?<CheckCircle size={15}/>:<XCircle size={15}/>} {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Remarks (optional)</label>
              <textarea className="form-control" value={form.review_remarks} onChange={e=>setForm(f=>({...f,review_remarks:e.target.value}))} rows={2} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving…':'Confirm'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeavePage() {
  const { canManage } = useAuth();
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [reviewing, setReviewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaveAPI.getAll({ status: statusFilter });
      setRequests(res.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    studentsAPI.getAll({ limit: 200 }).then(r=>setStudents(r.data.data||[])).catch(()=>{});
  }, []);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Leave Management</h2>
          <p className="page-subtitle">{requests.length} requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16}/> Request Leave</button>
      </div>

      <div className="filters-row">
        {['','Pending','Approved','Rejected'].map(s => (
          <button key={s||'all'} className={`btn btn-sm ${statusFilter===s?'btn-primary':'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
            {s||'All'}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Student</th><th>Leave Type</th><th>From</th><th>To</th><th>Duration</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="loading-overlay"><div className="spinner"/></div></td></tr>
            ) : requests.length===0 ? (
              <tr><td colSpan={8}><div className="empty-state"><CalendarOff size={36}/><h4>No leave requests</h4></div></td></tr>
            ) : requests.map(r => {
              const days = Math.ceil((new Date(r.to_date)-new Date(r.from_date))/(1000*60*60*24))+1;
              return (
                <tr key={r.id}>
                  <td>
                    <div className="font-semibold">{r.student_name}</div>
                    <div className="text-xs text-muted">{r.student_code}</div>
                  </td>
                  <td><span className="badge badge-info">{r.leave_type}</span></td>
                  <td className="text-sm">{formatDate(r.from_date)}</td>
                  <td className="text-sm">{formatDate(r.to_date)}</td>
                  <td className="font-semibold">{days} day{days!==1?'s':''}</td>
                  <td><span className="truncate" style={{display:'block',maxWidth:180}}>{r.reason}</span></td>
                  <td><span className={`badge badge-${statusColor[r.status]}`}>{r.status}</span></td>
                  <td>
                    {canManage && r.status==='Pending' && (
                      <button className="btn btn-primary btn-sm" onClick={() => setReviewing(r)}>Review</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && <LeaveModal students={students} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); load(); }} />}
      {reviewing && <ReviewModal leave={reviewing} onClose={() => setReviewing(null)} onSave={() => { setReviewing(null); load(); }} />}
    </div>
  );
}
