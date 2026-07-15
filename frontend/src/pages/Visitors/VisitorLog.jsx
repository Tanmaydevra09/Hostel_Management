import { useState, useEffect, useCallback } from 'react';
import { visitorsAPI, studentsAPI } from '../../api';
import { Plus, Search, LogOut, X, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/formatters';

function VisitorModal({ students, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    student_id:'', visitor_name:'', relation:'', phone:'',
    id_proof_type:'Aadhaar', id_proof_number:'', purpose:'', approved_by:''
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_id||!form.visitor_name) { toast.error('Student and visitor name required'); return; }
    setLoading(true);
    try {
      await visitorsAPI.create(form);
      toast.success('Visitor checked in!');
      onSave();
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Visitor Check-In</h3>
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
                <label className="form-label">Visitor Name *</label>
                <input className="form-control" value={form.visitor_name} onChange={e=>set('visitor_name',e.target.value)} required placeholder="Full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Relation</label>
                <input className="form-control" value={form.relation} onChange={e=>set('relation',e.target.value)} placeholder="Father, Mother, Friend…" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={e=>set('phone',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">ID Proof Type</label>
                <select className="form-control" value={form.id_proof_type} onChange={e=>set('id_proof_type',e.target.value)}>
                  {['Aadhaar','Voter ID','Passport','Driving License','Other'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">ID Proof Number</label>
                <input className="form-control" value={form.id_proof_number} onChange={e=>set('id_proof_number',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Approved By</label>
                <input className="form-control" value={form.approved_by} onChange={e=>set('approved_by',e.target.value)} placeholder="Warden name" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Purpose</label>
              <textarea className="form-control" value={form.purpose} onChange={e=>set('purpose',e.target.value)} rows={2} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving…':'Check In'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VisitorLog() {
  const [visitors, setVisitors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await visitorsAPI.getAll({ active_only: activeOnly ? 'true' : '' });
      setVisitors(res.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [activeOnly]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    studentsAPI.getAll({ limit: 200 }).then(r => setStudents(r.data.data || [])).catch(()=>{});
  }, []);

  const checkout = async (id) => {
    try { await visitorsAPI.checkout(id); toast.success('Visitor checked out'); load(); }
    catch { toast.error('Failed'); }
  };

  const filtered = visitors.filter(v =>
    !search || v.visitor_name?.toLowerCase().includes(search.toLowerCase()) || v.student_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Visitor Log</h2>
          <p className="page-subtitle">{visitors.length} visitor records</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16}/> Check In Visitor</button>
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <Search size={16} className="search-icon"/>
          <input className="form-control" placeholder="Search visitor or student…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <label className="flex items-center gap-2" style={{cursor:'pointer',fontSize:'0.875rem'}}>
          <input type="checkbox" checked={activeOnly} onChange={e=>setActiveOnly(e.target.checked)} />
          Active Visitors Only
        </label>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Visitor</th><th>Student</th><th>Relation</th><th>Phone</th><th>ID Proof</th><th>Check In</th><th>Check Out</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="loading-overlay"><div className="spinner"/></div></td></tr>
            ) : filtered.length===0 ? (
              <tr><td colSpan={8}><div className="empty-state"><UserCheck size={36}/><h4>No visitors</h4></div></td></tr>
            ) : filtered.map(v => (
              <tr key={v.id}>
                <td><div className="font-semibold">{v.visitor_name}</div></td>
                <td>
                  <div>{v.student_name}</div>
                  <div className="text-xs text-muted">{v.student_code} • Room {v.room_number}</div>
                </td>
                <td>{v.relation||'—'}</td>
                <td>{v.phone||'—'}</td>
                <td><div>{v.id_proof_type}</div><div className="text-xs text-muted">{v.id_proof_number}</div></td>
                <td className="text-sm">{formatDateTime(v.check_in)}</td>
                <td className="text-sm">
                  {v.check_out ? formatDateTime(v.check_out) : <span className="badge badge-warning">Active</span>}
                </td>
                <td>
                  {!v.check_out && (
                    <button className="btn btn-secondary btn-sm" onClick={() => checkout(v.id)}>
                      <LogOut size={13}/> Check Out
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && <VisitorModal students={students} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); load(); }} />}
    </div>
  );
}
