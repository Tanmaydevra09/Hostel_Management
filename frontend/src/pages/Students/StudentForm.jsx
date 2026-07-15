import { useState, useEffect } from 'react';
import { studentsAPI, roomsAPI } from '../../api';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const COURSES = ['B.Tech','B.Sc','B.Com','BCA','MCA','MBA','M.Tech','M.Sc'];

export default function StudentForm({ student, onClose, onSave }) {
  const isEdit = !!student;
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    student_id: '', name: '', age: '', gender: '', date_of_birth: '', blood_group: '',
    aadhaar_number: '', phone: '', email: '', address: '', course: '', department: '',
    year: '', room_id: '', emergency_contact_name: '', emergency_contact_phone: '',
    parent_name: '', parent_phone: '', admission_date: '', status: 'Active',
    ...(student || {})
  });

  useEffect(() => {
    roomsAPI.getAll({ availability: 'available' })
      .then(r => setRooms(r.data.data || []))
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_id || !form.name || !form.email || !form.phone) { 
      toast.error('Student ID, Name, Email, and Phone are required'); 
      return; 
    }
    if (!/^\d{10}$/.test(form.phone)) {
      toast.error('Phone number must contain exactly 10 digits.');
      return;
    }
    if (form.date_of_birth) {
      const birthDate = new Date(form.date_of_birth);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) calculatedAge--;
      if (calculatedAge < 17) {
        toast.error('Student must be at least 17 years old.');
        return;
      }
    }
    setLoading(true);
    try {
      if (isEdit) await studentsAPI.update(student.id, form);
      else        await studentsAPI.create(form);
      toast.success(`Student ${isEdit ? 'updated' : 'added'} successfully!`);
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Student' : 'Add New Student'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Basic Info */}
            <h4 className="section-label">Basic Information</h4>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Student ID *</label>
                <input className="form-control" value={form.student_id} onChange={e => set('student_id', e.target.value)} placeholder="e.g. HMS001" required />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select 
                  className="form-control" 
                  value={form.gender} 
                  onChange={e => {
                    set('gender', e.target.value);
                    set('room_id', ''); // Reset room selection if gender changes
                  }}
                >
                  <option value="">Select Gender</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={form.date_of_birth?.split('T')[0] || ''} 
                  onChange={e => set('date_of_birth', e.target.value)} 
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 17)).toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-control" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Aadhaar Number</label>
                <input className="form-control" value={form.aadhaar_number} onChange={e => set('aadhaar_number', e.target.value)} placeholder="12-digit Aadhaar" maxLength={12} />
              </div>
            </div>

            {/* Contact */}
            <h4 className="section-label">Contact Details</h4>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" pattern="\d{10}" maxLength={10} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-control" value={form.email} onChange={e => set('email', e.target.value)} placeholder="student@example.com" required />
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label className="form-label">Address</label>
                <textarea className="form-control" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Permanent address" rows={2} />
              </div>
            </div>

            {/* Academic */}
            <h4 className="section-label">Academic Details</h4>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Course</label>
                <select className="form-control" value={form.course} onChange={e => set('course', e.target.value)}>
                  <option value="">Select Course</option>
                  {COURSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-control" value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Computer Science" />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <select className="form-control" value={form.year} onChange={e => set('year', e.target.value)}>
                  <option value="">Select Year</option>
                  {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>

            {/* Room + Status */}
            <h4 className="section-label">Room & Status</h4>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Room Assignment</label>
                <select className="form-control" value={form.room_id} onChange={e => set('room_id', e.target.value)}>
                  <option value="">Not Assigned</option>
                  {student?.room_id && <option value={student.room_id}>{student.block}-{student.room_number} (current)</option>}
                  {rooms
                    .filter(r => r.id !== student?.room_id)
                    .filter(r => !form.gender || form.gender === 'Other' || r.gender === form.gender)
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        {r.block}-{r.room_number} ({r.gender === 'Male' ? 'Boys' : 'Girls'} Hostel, {r.room_type}, {r.available_beds} beds free)
                      </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Admission Date</label>
                <input type="date" className="form-control" value={form.admission_date?.split('T')[0] || ''} onChange={e => set('admission_date', e.target.value)} />
              </div>
              {isEdit && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option>Active</option><option>Inactive</option><option>Left</option>
                  </select>
                </div>
              )}
            </div>

            {/* Parent/Emergency */}
            <h4 className="section-label">Parent & Emergency Contact</h4>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Parent Name</label>
                <input className="form-control" value={form.parent_name} onChange={e => set('parent_name', e.target.value)} placeholder="Parent's full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Parent Phone</label>
                <input className="form-control" value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} placeholder="Parent's mobile" />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact Name</label>
                <input className="form-control" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact Phone</label>
                <input className="form-control" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
