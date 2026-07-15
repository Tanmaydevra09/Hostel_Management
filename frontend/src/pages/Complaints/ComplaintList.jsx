import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '../../utils/formatters';
import { complaintsAPI, studentsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, X, MessageSquareWarning, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const priorityColor = { Low:'gray', Medium:'warning', High:'danger', Critical:'danger' };
const statusColor   = { Pending:'warning', 'In Progress':'info', Resolved:'success', Closed:'gray' };

function ComplaintModal({ complaint, students, canManage, onClose, onSave }) {
  const isEdit = !!complaint;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    student_id:'', category:'Other', description:'', priority:'Medium',
    status:'Pending', assigned_to:'', resolution_notes:'',
    ...(complaint || {})
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) await complaintsAPI.update(complaint.id, form);
      else        await complaintsAPI.create(form);
      toast.success(`Complaint ${isEdit ? 'updated' : 'submitted'}!`);
      onSave();
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? 'Update Complaint' : 'Submit Complaint'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {!isEdit && (
              <div className="form-group">
                <label className="form-label">Student *</label>
                <select className="form-control" value={form.student_id} onChange={e=>set('student_id',e.target.value)} required>
                  <option value="">Select Student</option>
                  {students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.student_id})</option>)}
                </select>
              </div>
            )}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={form.category} onChange={e=>set('category',e.target.value)}>
                  {['Electricity','Plumbing','WiFi','Cleaning','Furniture','Security','Other'].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-control" value={form.priority} onChange={e=>set('priority',e.target.value)} disabled={!canManage}>
                  {['Low','Medium','High','Critical'].map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-control" value={form.description} onChange={e=>set('description',e.target.value)} rows={3} required placeholder="Describe the issue in detail..." />
            </div>
            {isEdit && canManage && (
              <>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={form.status} onChange={e=>set('status',e.target.value)}>
                      {['Pending','In Progress','Resolved','Closed'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assigned To</label>
                    <input className="form-control" value={form.assigned_to||''} onChange={e=>set('assigned_to',e.target.value)} placeholder="Staff name or department" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Resolution Notes</label>
                  <textarea className="form-control" value={form.resolution_notes||''} onChange={e=>set('resolution_notes',e.target.value)} rows={2} placeholder="Steps taken to resolve..." />
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving…':isEdit?'Update':'Submit'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ComplaintList() {
  const { canManage } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [students, setStudents]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filters, setFilters]       = useState({ status:'', priority:'', category:'' });
  const [modal, setModal]           = useState(null); // null | 'add' | complaint

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await complaintsAPI.getAll({ search, ...filters });
      setComplaints(res.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [search, filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    try {
      await complaintsAPI.delete(id);
      setComplaints(complaints.filter(c => c.id !== id));
      toast.success('Complaint deleted');
    } catch (err) { toast.error('Failed to delete complaint'); }
  };

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    studentsAPI.getAll({ limit: 200 }).then(r => setStudents(r.data.data || [])).catch(()=>{});
  }, []);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Complaints</h2>
          <p className="page-subtitle">{complaints.length} total complaints</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={16}/> Submit Complaint</button>
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <Search size={16} className="search-icon"/>
          <input className="form-control" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {['Pending','In Progress','Resolved','Closed'].map(s => (
          <button key={s} className={`btn btn-sm ${filters.status===s?'btn-primary':'btn-secondary'}`} onClick={() => setFilters(f => ({...f, status: f.status===s?'':s}))}>
            {s}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Student</th><th>Category</th><th>Description</th><th>Priority</th><th>Status</th><th>Assigned To</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="loading-overlay"><div className="spinner"/></div></td></tr>
            ) : complaints.length===0 ? (
              <tr><td colSpan={8}><div className="empty-state"><MessageSquareWarning size={36}/><h4>No complaints</h4><p>All clear! No complaints found.</p></div></td></tr>
            ) : complaints.map(c => (
              <tr key={c.id}>
                <td>
                  <div className="font-semibold">{c.student_name}</div>
                  <div className="text-xs text-muted">{c.student_code} {c.room_number ? `• Room ${c.block}-${c.room_number}` : ''}</div>
                </td>
                <td>{c.category}</td>
                <td><span className="truncate" style={{display:'block',maxWidth:200}}>{c.description}</span></td>
                <td><span className={`badge badge-${priorityColor[c.priority]}`}>{c.priority}</span></td>
                <td><span className={`badge badge-${statusColor[c.status]}`}>{c.status}</span></td>
                <td>{c.assigned_to || <span className="text-muted">Unassigned</span>}</td>
                <td className="text-sm">{formatDate(c.submitted_at)}</td>
                <td>
                  {canManage && (
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(c)}><Pencil size={14}/></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{color:'var(--danger)'}} onClick={() => handleDelete(c.id)}><Trash2 size={14}/></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <ComplaintModal
          complaint={modal === 'add' ? null : modal}
          students={students}
          canManage={canManage}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
