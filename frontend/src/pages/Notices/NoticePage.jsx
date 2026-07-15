import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '../../utils/formatters';
import { noticesAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Pencil, Trash2, X, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const categoryColor = { General:'primary', Fee:'warning', Maintenance:'info', Rules:'danger', Event:'success', Emergency:'danger' };

function NoticeModal({ notice, onClose, onSave }) {
  const isEdit = !!notice;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title:'', content:'', category:'General', target_audience:'All', expires_at:'',
    ...(notice || {})
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title||!form.content) { toast.error('Title and content required'); return; }
    setLoading(true);
    try {
      if (isEdit) await noticesAPI.update(notice.id, form);
      else        await noticesAPI.create(form);
      toast.success(`Notice ${isEdit?'updated':'posted'}!`);
      onSave();
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit?'Edit Notice':'Post Notice'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-control" value={form.title} onChange={e=>set('title',e.target.value)} required placeholder="Notice title" />
            </div>
            <div className="form-group">
              <label className="form-label">Content *</label>
              <textarea className="form-control" value={form.content} onChange={e=>set('content',e.target.value)} rows={5} required />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={form.category} onChange={e=>set('category',e.target.value)}>
                  {Object.keys(categoryColor).map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select className="form-control" value={form.target_audience} onChange={e=>set('target_audience',e.target.value)}>
                  {['All','Students','Wardens'].map(a=><option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Expires On (optional)</label>
                <input type="date" className="form-control" value={form.expires_at?.split('T')[0]||''} onChange={e=>set('expires_at',e.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving…':isEdit?'Update':'Post Notice'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NoticePage() {
  const { canManage, isAdmin } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await noticesAPI.getAll({ category, active_only: 'false' });
      setNotices(res.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    try { await noticesAPI.delete(id); toast.success('Notice deleted'); setDeleting(null); load(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h2 className="page-title">Notice Board</h2><p className="page-subtitle">{notices.length} notices</p></div>
        {canManage && <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={16}/> Post Notice</button>}
      </div>

      <div className="filters-row">
        <select className="form-control" style={{width:160}} value={category} onChange={e=>setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {Object.keys(categoryColor).map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <div className="loading-overlay"><div className="spinner"/></div>
      : notices.length===0 ? <div className="empty-state"><Bell size={40}/><h4>No notices</h4><p>No notices have been posted yet.</p></div>
      : (
        <div className="notices-grid">
          {notices.map(n => (
            <div key={n.id} className="card notice-card">
              <div className="notice-header">
                <span className={`badge badge-${categoryColor[n.category]||'gray'}`}>{n.category}</span>
                <span className="badge badge-gray">{n.target_audience}</span>
              </div>
              <h3 className="notice-title">{n.title}</h3>
              <p className="notice-content">{n.content}</p>
              <div className="notice-footer">
                <span className="text-xs text-muted">
                  By {n.posted_by} • {formatDistanceToNow(new Date(n.created_at), {addSuffix:true})}
                </span>
                {n.expires_at && (
                  <span className={`text-xs ${new Date(n.expires_at) < new Date() ? 'text-danger' : 'text-muted'}`}>
                    Expires: {formatDate(n.expires_at)}
                  </span>
                )}
                {canManage && (
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(n)}><Pencil size={13}/></button>
                    {isAdmin && (
                      <button className="btn btn-ghost btn-icon btn-sm" style={{color:'var(--danger)'}} title="Delete" onClick={() => setDeleting(n)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <NoticeModal notice={modal==='add'?null:modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}
      {deleting && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header"><h3>Delete Notice</h3><button className="btn btn-ghost btn-icon" onClick={() => setDeleting(null)}><X size={18}/></button></div>
            <div className="modal-body"><p>Delete notice "<strong>{deleting.title}</strong>"? This cannot be undone.</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleting.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .notices-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
        .notice-card { display: flex; flex-direction: column; gap: 10px; }
        .notice-header { display: flex; gap: 8px; align-items: center; }
        .notice-title { font-size: 1rem; font-weight: 700; }
        .notice-content { font-size: 0.875rem; color: var(--text-secondary); flex: 1; }
        .notice-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
      `}</style>
    </div>
  );
}
