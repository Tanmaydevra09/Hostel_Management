import { useState, useEffect } from 'react';
import { formatDate } from '../../utils/formatters';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { studentsAPI, feesAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, User, Phone, Mail, Home, Pencil, CreditCard, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentForm from './StudentForm';

const InfoRow = ({ label, value }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    <span className="info-value">{value || '—'}</span>
  </div>
);

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const [student, setStudent] = useState(null);
  const [fees, setFees]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    try {
      const [sRes, fRes] = await Promise.all([
        studentsAPI.getById(id),
        feesAPI.getAll({ student_id: id, limit: 10 }),
      ]);
      setStudent(sRes.data.data);
      setFees(fRes.data.data || []);
    } catch { toast.error('Student not found'); navigate('/students'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (!student) return null;

  const s = student;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/students" className="btn btn-ghost btn-icon"><ArrowLeft size={18} /></Link>
          <div>
            <h2 className="page-title">{s.name}</h2>
            <p className="page-subtitle">{s.student_id} • {s.course} {s.department}</p>
          </div>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            <Pencil size={15} /> Edit Profile
          </button>
        )}
      </div>

      <div className="profile-grid">
        {/* Left: Photo + Quick Info */}
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div className="card" style={{textAlign:'center'}}>
            <div className="avatar avatar-lg" style={{margin:'0 auto 16px',width:80,height:80,fontSize:'2rem'}}>
              {s.name?.charAt(0)}
            </div>
            <h3>{s.name}</h3>
            <p className="text-secondary text-sm">{s.department}</p>
            <div style={{marginTop:12}}>
              <span className={`badge badge-${s.status==='Active'?'success':s.status==='Left'?'danger':'warning'}`}>{s.status}</span>
            </div>
            <div className="divider" style={{margin:'16px 0'}} />
            <div className="quick-info">
              {s.phone && <a href={`tel:${s.phone}`} className="quick-info-item"><Phone size={14}/>{s.phone}</a>}
              {s.email && <a href={`mailto:${s.email}`} className="quick-info-item"><Mail size={14}/>{s.email}</a>}
              {s.room_number && <div className="quick-info-item"><Building2 size={14}/>{s.block}-{s.room_number}</div>}
            </div>
          </div>

          {/* Fee Summary */}
          <div className="card">
            <h4 className="font-semibold" style={{marginBottom:12}}><CreditCard size={16} style={{marginRight:6}} />Fee Summary</h4>
            <div className="fee-summary-row">
              <span className="text-secondary text-sm">Total Paid</span>
              <span className="text-success font-semibold">₹{Number(s.fee_summary?.total_paid||0).toLocaleString()}</span>
            </div>
            <div className="fee-summary-row">
              <span className="text-secondary text-sm">Pending</span>
              <span className="text-warning font-semibold">₹{Number(s.fee_summary?.total_pending||0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div className="card">
            <h4 className="font-semibold" style={{marginBottom:16}}>Personal Details</h4>
            <InfoRow label="Blood Group"     value={s.blood_group} />
            <InfoRow label="Date of Birth"   value={s.date_of_birth ? formatDate(s.date_of_birth) : null} />
            <InfoRow label="Gender"          value={s.gender} />
            <InfoRow label="Aadhaar Number"  value={s.aadhaar_number} />
            <InfoRow label="Admission Date"  value={s.admission_date ? formatDate(s.admission_date) : null} />
            <InfoRow label="Address"         value={s.address} />
          </div>

          <div className="card">
            <h4 className="font-semibold" style={{marginBottom:16}}>Parent & Emergency Contact</h4>
            <InfoRow label="Parent Name"  value={s.parent_name} />
            <InfoRow label="Parent Phone" value={s.parent_phone} />
            <InfoRow label="Emergency Contact" value={s.emergency_contact_name} />
            <InfoRow label="Emergency Phone"   value={s.emergency_contact_phone} />
          </div>

          <div className="card">
            <h4 className="font-semibold" style={{marginBottom:12}}>Recent Fee Records</h4>
            {fees.length === 0 ? <p className="text-muted text-sm">No fee records found.</p> : (
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Month</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {fees.map(f => (
                      <tr key={f.id}>
                        <td>{f.month_year || '—'}</td>
                        <td>{f.fee_type}</td>
                        <td>₹{Number(f.amount).toLocaleString()}</td>
                        <td><span className={`badge badge-${f.status==='Paid'?'success':f.status==='Overdue'?'danger':'warning'}`}>{f.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {editing && <StudentForm student={s} onClose={() => setEditing(false)} onSave={() => { setEditing(false); load(); }} />}

      <style>{`
        .profile-grid { display: grid; grid-template-columns: 280px 1fr; gap: 20px; }
        .quick-info { display: flex; flex-direction: column; gap: 8px; }
        .quick-info-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary); text-decoration: none; }
        .quick-info-item:hover { color: var(--primary); }
        .fee-summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
        .fee-summary-row:last-child { border-bottom: none; }
        .info-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--border); }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 0.82rem; color: var(--text-muted); }
        .info-value { font-size: 0.875rem; font-weight: 500; text-align: right; max-width: 60%; }
        @media (max-width: 900px) { .profile-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
