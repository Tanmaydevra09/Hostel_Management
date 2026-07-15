import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '../../utils/formatters';
import { feesAPI, studentsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Download, CheckCircle, X, CreditCard, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  const map = { Paid: 'success', Pending: 'warning', Overdue: 'danger', Partial: 'info' };
  return <span className={`badge badge-${map[s]||'gray'}`}>{s}</span>;
};

function FeeForm({ fee, onClose, onSave }) {
  const isEdit = !!fee;
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [form, setForm] = useState({
    student_id:'', amount:'', due_date:'', fee_type:'Hostel Fee', month_year:'', remarks:'',
    ...(fee ? {
      ...fee,
      due_date: fee.due_date ? fee.due_date.split('T')[0] : ''
    } : {})
  });
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  useEffect(() => {
    studentsAPI.getAll({ status: 'Active', limit: 200 })
      .then(r => setStudents(r.data.data || [])).catch(()=>{});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_id || !form.amount) { toast.error('Student and amount required'); return; }
    setLoading(true);
    try {
      if (isEdit) await feesAPI.update(fee.id, form);
      else await feesAPI.create(form);
      toast.success(`Fee record ${isEdit ? 'updated' : 'created'}!`);
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Fee Record' : 'Add Fee Record'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Student *</label>
              <select className="form-control" value={form.student_id} onChange={e => set('student_id', e.target.value)} required disabled={isEdit}>
                <option value="">Select Student</option>
                {isEdit && <option value={form.student_id}>{form.student_name} ({form.student_code})</option>}
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.student_id})</option>)}
              </select>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input type="number" className="form-control" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="e.g. 8500" required min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Fee Type</label>
                <select className="form-control" value={form.fee_type} onChange={e => set('fee_type', e.target.value)}>
                  {['Hostel Fee','Mess Fee','Electricity','Maintenance','Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-control" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Month/Year (e.g. 07-2024)</label>
                <input className="form-control" value={form.month_year} onChange={e => set('month_year', e.target.value)} placeholder="MM-YYYY" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea className="form-control" value={form.remarks} onChange={e => set('remarks', e.target.value)} rows={2} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : (isEdit ? 'Update Fee Record' : 'Create Fee Record')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MarkPaidModal({ fee, onClose, onSave }) {
  const [form, setForm] = useState({ payment_mode:'Cash', transaction_id:'', fine_amount:'' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await feesAPI.markAsPaid(fee.id, form);
      toast.success('Fee marked as paid!');
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-sm">
        <div className="modal-header">
          <h3>Mark as Paid</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="text-secondary text-sm" style={{marginBottom:16}}>
              Recording payment for <strong>{fee.student_name}</strong> — ₹{Number(fee.amount).toLocaleString()}
            </p>
            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select className="form-control" value={form.payment_mode} onChange={e => set('payment_mode', e.target.value)}>
                {['Cash','Online','Cheque','DD'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Transaction ID (optional)</label>
              <input className="form-control" value={form.transaction_id} onChange={e => set('transaction_id', e.target.value)} placeholder="For online payments" />
            </div>
            <div className="form-group">
              <label className="form-label">Fine Amount (₹)</label>
              <input type="number" className="form-control" value={form.fine_amount} onChange={e => set('fine_amount', e.target.value)} placeholder="0" min="0" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading}>{loading ? 'Saving…' : 'Confirm Payment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FeeList() {
  const { canManage } = useAuth();
  const [fees, setFees]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filters, setFilters]   = useState({ status:'', fee_type:'' });
  const [total, setTotal]       = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [paying, setPaying]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feesAPI.getAll({ search, ...filters });
      setFees(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load fees'); }
    finally { setLoading(false); }
  }, [search, filters]);

  useEffect(() => { load(); }, [load]);

  const downloadReceipt = async (fee) => {
    try {
      const res = await feesAPI.downloadReceipt(fee.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url;
      a.download = `receipt_${fee.student_code}_${fee.month_year||fee.id}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Receipt generation failed'); }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Fee Management</h2>
          <p className="page-subtitle">{total} records total</p>
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16}/> Add Fee Record</button>}
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <Search size={16} className="search-icon"/>
          <input className="form-control" placeholder="Search student name or ID…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="form-control" style={{width:140}} value={filters.status} onChange={e => setFilters({...filters, status:e.target.value})}>
          <option value="">All Status</option>
          {['Pending','Paid','Overdue','Partial'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="form-control" style={{width:160}} value={filters.fee_type} onChange={e => setFilters({...filters, fee_type:e.target.value})}>
          <option value="">All Types</option>
          {['Hostel Fee','Mess Fee','Electricity','Maintenance','Other'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th><th>Fee Type</th><th>Month</th><th>Amount</th>
              <th>Fine</th><th>Due Date</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="loading-overlay"><div className="spinner"/></div></td></tr>
            ) : fees.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><CreditCard size={36}/><h4>No fee records</h4></div></td></tr>
            ) : fees.map(f => (
              <tr key={f.id}>
                <td>
                  <div className="font-semibold">{f.student_name}</div>
                  <div className="text-xs text-muted">{f.student_code}</div>
                </td>
                <td>{f.fee_type}</td>
                <td>{f.month_year || '—'}</td>
                <td className="font-semibold">₹{Number(f.amount).toLocaleString()}</td>
                <td className={f.computed_fine > 0 ? 'text-danger font-semibold' : 'text-muted'}>
                  {f.computed_fine > 0 ? `₹${f.computed_fine}` : '—'}
                </td>
                <td>
                  {f.due_date ? (
                    <span className={new Date(f.due_date) < new Date() && f.status !== 'Paid' ? 'text-danger text-sm' : 'text-sm'}>
                      {formatDate(f.due_date)}
                    </span>
                  ) : '—'}
                </td>
                <td>{statusBadge(f.status)}</td>
                <td>
                  <div className="flex gap-2">
                    {canManage && f.status !== 'Paid' && (
                      <button className="btn btn-success btn-sm" onClick={() => setPaying(f)} title="Mark Paid">
                        <CheckCircle size={13}/> Pay
                      </button>
                    )}
                    {canManage && f.status !== 'Paid' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(f); setShowForm(true); }} title="Edit Fee">
                        Edit
                      </button>
                    )}
                    {f.status === 'Paid' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => downloadReceipt(f)}>
                        <Download size={13}/> Receipt
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && <FeeForm fee={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSave={() => { setShowForm(false); setEditing(null); load(); }} />}
      {paying && <MarkPaidModal fee={paying} onClose={() => setPaying(null)} onSave={() => { setPaying(null); load(); }} />}
    </div>
  );
}
