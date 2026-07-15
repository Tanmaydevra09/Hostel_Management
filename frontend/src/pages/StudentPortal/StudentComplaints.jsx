import { useState, useEffect } from 'react';
import { formatDate } from '../../utils/formatters';
import { studentPortalAPI } from '../../api';
import toast from 'react-hot-toast';

export default function StudentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: 'Other', description: '', priority: 'Medium' });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = () => {
    studentPortalAPI.getComplaints()
      .then(res => setComplaints(res.data.data))
      .catch(() => toast.error('Failed to load complaints'))
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description) return toast.error('Description is required');
    try {
      await studentPortalAPI.createComplaint(form);
      toast.success('Complaint submitted successfully');
      setForm({ category: 'Other', description: '', priority: 'Medium' });
      fetchComplaints();
    } catch (err) {
      toast.error('Failed to submit complaint');
    }
  };

  const statusBadge = (s) => {
    const c = s==='Resolved'?'success':s==='In Progress'?'info':s==='Pending'?'warning':'gray';
    return <span className={`badge badge-${c}`}>{s}</span>;
  };

  return (
    <div className="page-container animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Complaints</h1>
          <p className="page-subtitle">Submit and track your maintenance requests.</p>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="card" style={{ flex: 1 }}>
          <h3 className="text-lg font-semibold mb-4">New Complaint</h3>
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
            <div>
              <label className="form-label">Category</label>
              <select className="form-control" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                {['Electricity', 'Plumbing', 'WiFi', 'Cleaning', 'Furniture', 'Security', 'Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select className="form-control" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the issue..." />
            </div>
            <button type="submit" className="btn btn-primary w-full">Submit Complaint</button>
          </form>
        </div>

        <div className="card" style={{ flex: 2 }}>
          <h3 className="text-lg font-semibold mb-4">History</h3>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Date</th><th>Category</th><th>Priority</th><th>Status</th></tr></thead>
              <tbody>
                {complaints.length === 0 ? <tr><td colSpan={4} className="text-center py-4">No complaints found.</td></tr> : complaints.map(c => (
                  <tr key={c.id}>
                    <td>{formatDate(c.submitted_at)}</td>
                    <td>{c.category}</td>
                    <td>
                      <span className={`badge badge-${c.priority==='Critical'||c.priority==='High'?'danger':c.priority==='Medium'?'warning':'gray'}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td>{statusBadge(c.status)}</td>
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
