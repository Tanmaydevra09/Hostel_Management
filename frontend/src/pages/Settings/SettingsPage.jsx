import { useState, useEffect } from 'react';
import { authAPI, studentPortalAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, User, Shield, Eye, EyeOff, Users, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const [pwdForm, setPwdForm]       = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [showPwd, setShowPwd]       = useState({ cur:false, new:false, con:false });
  const [pwdLoading, setPwdLoading] = useState(false);

  const [userForm, setUserForm]     = useState({ username:'', password:'', role:'admin', full_name:'', email:'', phone:'' });
  const [userLoading, setUserLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({ phone: '', address: '', emergency_contact_name: '', emergency_contact_phone: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  const [usersList, setUsersList] = useState([]);
  const [deletingUser, setDeletingUser] = useState(null);

  const loadUsers = async () => {
    try {
      const res = await authAPI.getUsers();
      setUsersList(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  useEffect(() => {
    if (user?.role === 'student') {
      studentPortalAPI.getDashboard().then(res => {
        const p = res.data.data.profile;
        setProfileForm({
          phone: p.phone || '',
          address: p.address || '',
          emergency_contact_name: p.emergency_contact_name || '',
          emergency_contact_phone: p.emergency_contact_phone || ''
        });
      }).catch(console.error);
    }
  }, [user]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { toast.error('New passwords do not match'); return; }
    if (pwdForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setPwdLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Password changed successfully!');
      setPwdForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch(err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setPwdLoading(false); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.username||!userForm.password||!userForm.full_name) { toast.error('Username, password, and full name required'); return; }
    setUserLoading(true);
    try {
      await authAPI.createUser(userForm);
      toast.success('User account created!');
      setUserForm({ username:'', password:'', role:'admin', full_name:'', email:'', phone:'' });
      if (userForm.role !== 'student') loadUsers();
    } catch(err) { toast.error(err.response?.data?.message || 'Failed to create user'); }
    finally { setUserLoading(false); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await studentPortalAPI.updateProfile(profileForm);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await authAPI.deleteUser(id);
      toast.success('User deleted successfully');
      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const sp = (k) => (e) => setPwdForm(f => ({...f, [k]: e.target.value}));
  const su = (k) => (e) => setUserForm(f => ({...f, [k]: e.target.value}));
  const pr = (k) => (e) => setProfileForm(f => ({...f, [k]: e.target.value}));

  const PwdField = ({ label, fKey, showKey }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{position:'relative'}}>
        <input className="form-control" type={showPwd[showKey]?'text':'password'}
          value={pwdForm[fKey]} onChange={sp(fKey)} style={{paddingRight:42}} placeholder="••••••••" />
        <button type="button" style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',display:'flex'}}
          onClick={() => setShowPwd(s=>({...s,[showKey]:!s[showKey]}))}>
          {showPwd[showKey] ? <EyeOff size={16}/> : <Eye size={16}/>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade" style={{maxWidth:700,margin:'0 auto',display:'flex',flexDirection:'column',gap:24}}>
      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="avatar avatar-lg">{user?.full_name?.charAt(0)}</div>
          <div>
            <h3 style={{marginBottom:4}}>{user?.full_name}</h3>
            <p className="text-secondary text-sm">@{user?.username}</p>
            <span className={`badge badge-${user?.role==='admin'?'danger':user?.role==='warden'?'primary':'success'}`} style={{marginTop:6}}>
              <Shield size={10}/> {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Update Profile (Student Only) */}
      {user?.role === 'student' && (
        <div className="card">
          <div className="flex items-center gap-3" style={{marginBottom:20}}>
            <div className="stat-card-icon" style={{background:'var(--info-light)',color:'var(--info)',borderRadius:'var(--radius-md)',width:40,height:40}}>
              <User size={18}/>
            </div>
            <div>
              <h3 style={{fontSize:'1rem',marginBottom:2}}>Update Profile</h3>
              <p className="text-secondary text-sm">Update your contact and emergency information</p>
            </div>
          </div>
          <form onSubmit={handleUpdateProfile} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={profileForm.phone} onChange={pr('phone')} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-control" value={profileForm.address} onChange={pr('address')} />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact Name</label>
                <input className="form-control" value={profileForm.emergency_contact_name} onChange={pr('emergency_contact_name')} />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact Phone</label>
                <input className="form-control" value={profileForm.emergency_contact_phone} onChange={pr('emergency_contact_phone')} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{alignSelf:'flex-start'}} disabled={profileLoading}>
              {profileLoading ? 'Updating…' : 'Update Profile'}
            </button>
          </form>
        </div>
      )}

      {/* Change Password */}
      <div className="card">
        <div className="flex items-center gap-3" style={{marginBottom:20}}>
          <div className="stat-card-icon" style={{background:'var(--primary-light)',color:'var(--primary)',borderRadius:'var(--radius-md)',width:40,height:40}}>
            <KeyRound size={18}/>
          </div>
          <div>
            <h3 style={{fontSize:'1rem',marginBottom:2}}>Change Password</h3>
            <p className="text-secondary text-sm">Update your account password</p>
          </div>
        </div>
        <form onSubmit={handleChangePassword} style={{display:'flex',flexDirection:'column',gap:14}}>
          <PwdField label="Current Password" fKey="currentPassword" showKey="cur" />
          <PwdField label="New Password" fKey="newPassword" showKey="new" />
          <PwdField label="Confirm New Password" fKey="confirmPassword" showKey="con" />
          <button type="submit" className="btn btn-primary" style={{alignSelf:'flex-start'}} disabled={pwdLoading}>
            {pwdLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Create User (Admin Only) */}
      {isAdmin && (
        <div className="card">
          <div className="flex items-center gap-3" style={{marginBottom:20}}>
            <div className="stat-card-icon" style={{background:'var(--success-light)',color:'var(--success)',borderRadius:'var(--radius-md)',width:40,height:40}}>
              <User size={18}/>
            </div>
            <div>
              <h3 style={{fontSize:'1rem',marginBottom:2}}>Create User Account</h3>
              <p className="text-secondary text-sm">Add a new admin or warden login</p>
            </div>
          </div>
          <form onSubmit={handleCreateUser} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-control" value={userForm.full_name} onChange={su('full_name')} placeholder="Full name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input className="form-control" value={userForm.username} onChange={su('username')} placeholder="Login username" required />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" className="form-control" value={userForm.password} onChange={su('password')} placeholder="Min 6 characters" required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" value={userForm.role} onChange={su('role')}>
                  <option value="admin">Admin</option>
                  <option value="warden">Warden</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={userForm.email} onChange={su('email')} placeholder="user@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={userForm.phone} onChange={su('phone')} placeholder="10-digit mobile" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{alignSelf:'flex-start'}} disabled={userLoading}>
              {userLoading ? 'Creating…' : 'Create Account'}
            </button>
          </form>
        </div>
      )}

      {/* Manage Users (Admin Only) */}
      {isAdmin && (
        <div className="card">
          <div className="flex items-center gap-3" style={{marginBottom:20}}>
            <div className="stat-card-icon" style={{background:'var(--danger-light)',color:'var(--danger)',borderRadius:'var(--radius-md)',width:40,height:40}}>
              <Users size={18}/>
            </div>
            <div>
              <h3 style={{fontSize:'1rem',marginBottom:2}}>User Management</h3>
              <p className="text-secondary text-sm">Manage existing Admins and Wardens</p>
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Email / Phone</th>
                  <th style={{textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.length === 0 ? (
                  <tr><td colSpan="5" className="text-center text-muted py-4">No users found.</td></tr>
                ) : (
                  usersList.map(u => (
                    <tr key={u.id}>
                      <td className="font-semibold">{u.full_name}</td>
                      <td>{u.username}</td>
                      <td>
                        <span className={`badge badge-${u.role === 'admin' ? 'danger' : 'primary'}`}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="text-sm">{u.email || '—'}</div>
                        <div className="text-xs text-muted">{u.phone}</div>
                      </td>
                      <td style={{textAlign:'right'}}>
                        {u.id !== user?.id ? (
                          <button 
                            className="btn btn-ghost btn-icon btn-sm text-danger" 
                            onClick={() => setDeletingUser(u)}
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span className="text-xs text-muted">Current</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deletingUser && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h3>Delete User</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDeletingUser(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to permanently delete <strong>{deletingUser.full_name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletingUser(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDeleteUser(deletingUser.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
