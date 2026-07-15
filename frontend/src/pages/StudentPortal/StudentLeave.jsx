import { useState, useEffect } from 'react';
import { formatDate } from '../../utils/formatters';
import { studentPortalAPI } from '../../api';
import toast from 'react-hot-toast';

export default function StudentLeave() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ from_date: '', to_date: '', reason: '', leave_type: 'Personal' });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = () => {
    studentPortalAPI.getLeaves()
      .then(res => setLeaves(res.data.data))
      .catch(() => toast.error('Failed to load leaves'))
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.from_date || !form.to_date || !form.reason) return toast.error('Please fill all fields');
    if (new Date(form.from_date) > new Date(form.to_date)) return toast.error('From date cannot be after To date');
    
    try {
      await studentPortalAPI.createLeave(form);
      toast.success('Leave applied successfully');
      setForm({ from_date: '', to_date: '', reason: '', leave_type: 'Personal' });
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to apply for leave');
    }
  };

  const statusBadge = (s) => {
    const c = s==='Approved'?'success':s==='Rejected'?'danger':'warning';
    return <span className={`badge badge-${c}`}>{s}</span>;
  };

  return (
    <div className="page-container animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Leaves</h1>
          <p className="page-subtitle">Apply for leave and track approvals.</p>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="card" style={{ flex: 1 }}>
          <h3 className="text-lg font-semibold mb-4">Apply for Leave</h3>
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
            <div>
              <label className="form-label">Type</label>
              <select className="form-control" value={form.leave_type} onChange={e=>setForm({...form,leave_type:e.target.value})}>
                {['Home Visit', 'Medical', 'Personal', 'Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:16}}>
              <div style={{flex:1}}>
                <label className="form-label">From</label>
                <input type="date" className="form-control" value={form.from_date} onChange={e=>setForm({...form,from_date:e.target.value})} required/>
              </div>
              <div style={{flex:1}}>
                <label className="form-label">To</label>
                <input type="date" className="form-control" value={form.to_date} onChange={e=>setForm({...form,to_date:e.target.value})} required/>
              </div>
            </div>
            <div>
              <label className="form-label">Reason</label>
              <textarea className="form-control" rows={3} value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} required placeholder="Enter valid reason..." />
            </div>
            <button type="submit" className="btn btn-primary w-full">Submit Application</button>
          </form>
        </div>

        <div className="card" style={{ flex: 2 }}>
          <h3 className="text-lg font-semibold mb-4">History</h3>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Applied On</th><th>From</th><th>To</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {leaves.length === 0 ? <tr><td colSpan={5} className="text-center py-4">No leave records.</td></tr> : leaves.map(l => (
                  <tr key={l.id}>
                    <td>{formatDate(l.submitted_at)}</td>
                    <td>{formatDate(l.from_date)}</td>
                    <td>{formatDate(l.to_date)}</td>
                    <td>{l.leave_type}</td>
                    <td>{statusBadge(l.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
