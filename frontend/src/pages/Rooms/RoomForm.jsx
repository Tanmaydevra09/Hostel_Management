import { useState } from 'react';
import { roomsAPI } from '../../api';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoomForm({ room, prefilledData, onClose, onSave }) {
  const isEdit = !!room;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    room_number: '',
    block: prefilledData?.block || 'A',
    floor: 0,
    capacity: 2,
    room_type: 'Double',
    is_ac: false,
    gender: prefilledData?.gender || 'Male',
    monthly_rent: 5000,
    amenities: 'Common Washroom',
    ...(room || {})
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.room_number || !form.capacity) {
      toast.error('Room number and capacity are required');
      return;
    }
    
    setLoading(true);
    try {
      if (isEdit) await roomsAPI.update(room.id, form);
      else        await roomsAPI.create(form);
      toast.success(`Room ${isEdit ? 'updated' : 'added'} successfully!`);
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Room' : 'Add New Room'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <h4 className="section-label">Basic Information</h4>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Room Number *</label>
                <input className="form-control" value={form.room_number} onChange={e => set('room_number', e.target.value)} placeholder="e.g. 101" required />
              </div>
              
              <div className="form-group">
                <label className="form-label">Block</label>
                <input className="form-control" value={form.block} onChange={e => set('block', e.target.value.toUpperCase())} placeholder="e.g. A" maxLength={5} disabled={!!prefilledData?.block && !isEdit} />
              </div>

              <div className="form-group">
                <label className="form-label">Floor</label>
                <input type="number" className="form-control" value={form.floor} onChange={e => set('floor', parseInt(e.target.value) || 0)} min="0" />
              </div>
              
              <div className="form-group">
                <label className="form-label">Gender (Hostel Type)</label>
                <select className="form-control" value={form.gender} onChange={e => set('gender', e.target.value)} disabled={!!prefilledData?.gender && !isEdit}>
                  <option value="Male">Boys Hostel</option>
                  <option value="Female">Girls Hostel</option>
                  <option value="Any">Co-ed / Any</option>
                </select>
              </div>
            </div>

            <h4 className="section-label">Features & Capacity</h4>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select className="form-control" value={form.room_type} onChange={e => set('room_type', e.target.value)}>
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Triple">Triple</option>
                  <option value="Dormitory (4)">Dormitory (4 Beds)</option>
                  <option value="Dormitory (6)">Dormitory (6 Beds)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Total Beds (Capacity) *</label>
                <input type="number" className="form-control" value={form.capacity} onChange={e => set('capacity', parseInt(e.target.value) || 1)} min="1" required />
              </div>

              <div className="form-group">
                <label className="form-label">AC / Non-AC</label>
                <select className="form-control" value={form.is_ac ? "true" : "false"} onChange={e => set('is_ac', e.target.value === "true")}>
                  <option value="false">Non-AC</option>
                  <option value="true">AC Room</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amenities / Washroom</label>
                <select className="form-control" value={form.amenities} onChange={e => set('amenities', e.target.value)}>
                  <option value="Common Washroom">Common Washroom</option>
                  <option value="Attached Washroom">Attached Washroom</option>
                </select>
              </div>
            </div>

            <h4 className="section-label">Pricing</h4>
            <div className="form-group w-1/2">
              <label className="form-label">Monthly Rent (₹)</label>
              <input type="number" className="form-control" value={form.monthly_rent} onChange={e => set('monthly_rent', parseInt(e.target.value) || 0)} min="0" />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Update Room' : 'Add Room')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
