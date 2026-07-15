import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { studentsAPI, roomsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Eye, Pencil, Trash2, X, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentForm from './StudentForm';

const statusBadge = (s) => {
  const map = { Active: 'success', Inactive: 'warning', Left: 'danger' };
  return <span className={`badge badge-${map[s]||'gray'}`}>{s}</span>;
};

export default function StudentList() {
  const { canManage, isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filters, setFilters]   = useState({ status: '', department: '' });
  const [total, setTotal]       = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [depts, setDepts]       = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentsAPI.getAll({ search, ...filters });
      setStudents(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, [search, filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    studentsAPI.getFilters().then(r => setDepts(r.data.departments || [])).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    try {
      await studentsAPI.delete(id);
      toast.success('Student deleted');
      setDeleting(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleSave = () => { setShowForm(false); setEditing(null); load(); };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Students</h2>
          <p className="page-subtitle">{total} student{total !== 1 ? 's' : ''} registered</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Student
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input className="form-control" placeholder="Search name, ID, email, phone…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{width:150}} value={filters.status}
          onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">All Status</option>
          <option>Active</option><option>Inactive</option><option>Left</option>
        </select>
        <select className="form-control" style={{width:180}} value={filters.department}
          onChange={e => setFilters({...filters, department: e.target.value})}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        {(search || filters.status || filters.department) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilters({ status: '', department: '' }); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th><th>Student ID</th><th>Course / Dept</th>
              <th>Year</th><th>Room</th><th>Phone</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="loading-overlay"><div className="spinner" /></div></td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <UserPlus size={36} /><h4>No students found</h4>
                  <p>{canManage ? 'Add your first student using the button above.' : 'No students match your search.'}</p>
                </div>
              </td></tr>
            ) : students.map(s => (
              <tr key={s.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar avatar-sm">{s.name?.charAt(0)}</div>
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-muted">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-primary">{s.student_id}</span></td>
                <td>
                  <div>{s.course}</div>
                  <div className="text-xs text-muted">{s.department}</div>
                </td>
                <td>{s.year ? `Year ${s.year}` : '—'}</td>
                <td>{s.room_number ? <span className="badge badge-info">{s.block}-{s.room_number}</span> : <span className="text-muted">Not assigned</span>}</td>
                <td>{s.phone || '—'}</td>
                <td>{statusBadge(s.status)}</td>
                <td>
                  <div className="flex gap-2">
                    <Link to={`/students/${s.id}`} className="btn btn-ghost btn-icon btn-sm" title="View"><Eye size={14} /></Link>
                    {canManage && (
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => { setEditing(s); setShowForm(true); }}>
                        <Pencil size={14} />
                      </button>
                    )}
                    {isAdmin && (
                      <button className="btn btn-ghost btn-icon btn-sm" style={{color:'var(--danger)'}} title="Delete" onClick={() => setDeleting(s)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <StudentForm
          student={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirm */}
      {deleting && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h3>Delete Student</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDeleting(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deleting.name}</strong>? This action cannot be undone and will remove all associated records.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleting.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
