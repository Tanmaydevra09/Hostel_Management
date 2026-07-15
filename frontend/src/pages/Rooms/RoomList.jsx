import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { roomsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Pencil, Trash2, X, Building, Users, ChevronRight, ChevronLeft, Settings, Droplet, Wind, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import RoomForm from './RoomForm';

const statusColor = { Good: 'success', 'Needs Maintenance': 'warning', 'Under Maintenance': 'danger' };

export default function RoomList() {
  const { canManage, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [view, setView] = useState('hostels'); // 'hostels' | 'blocks' | 'rooms'
  const [selectedHostel, setSelectedHostel] = useState(null); // 'Male' or 'Female'
  const [selectedBlock, setSelectedBlock] = useState(null); // 'A', 'B', etc.
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [prefilledData, setPrefilledData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomsAPI.getAll({});
      setRooms(res.data.data || []);
    } catch { 
      toast.error('Failed to load rooms'); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derived Data
  const boysRooms = useMemo(() => rooms.filter(r => r.gender === 'Male'), [rooms]);
  const girlsRooms = useMemo(() => rooms.filter(r => r.gender === 'Female'), [rooms]);

  const getHostelStats = (hostelRooms) => {
    const totalCapacity = hostelRooms.reduce((acc, r) => acc + r.capacity, 0);
    const occupied = hostelRooms.reduce((acc, r) => acc + r.current_occupancy, 0);
    const maintenance = hostelRooms.filter(r => r.maintenance_status !== 'Good').length;
    return {
      rooms: hostelRooms.length,
      capacity: totalCapacity,
      occupied,
      vacant: totalCapacity - occupied,
      maintenance
    };
  };

  const getBlocksForHostel = (hostelRooms) => {
    const blocksMap = {};
    hostelRooms.forEach(r => {
      if (!blocksMap[r.block]) blocksMap[r.block] = [];
      blocksMap[r.block].push(r);
    });
    
    return Object.keys(blocksMap).sort().map(b => {
      const bRooms = blocksMap[b];
      const stats = getHostelStats(bRooms);
      
      // Determine block properties from first room
      const firstRoom = bRooms[0] || {};
      const washroom = firstRoom.amenities?.includes('Attached') ? 'Attached Washroom' : 'Common Washroom';
      const isAC = firstRoom.is_ac;
      const sharing = firstRoom.capacity;
      
      const monthlyRevenue = bRooms.reduce((acc, r) => acc + (r.current_occupancy * Number(r.monthly_rent)), 0);

      return {
        id: b,
        name: `Block ${b}`,
        rooms: bRooms,
        stats,
        washroom,
        isAC,
        sharing,
        monthlyRevenue
      };
    });
  };

  const handleHostelSelect = (gender) => {
    setSelectedHostel(gender);
    setView('blocks');
  };

  const handleBlockSelect = (blockId) => {
    setSelectedBlock(blockId);
    setView('rooms');
  };

  const handleBack = () => {
    if (view === 'rooms') setView('blocks');
    else if (view === 'blocks') {
      setView('hostels');
      setSelectedHostel(null);
    }
  };

  const handleStatusUpdate = async (room, newStatus, e) => {
    e.stopPropagation();
    try {
      await roomsAPI.update(room.id, { ...room, maintenance_status: newStatus });
      setRooms(rooms.map(r => r.id === room.id ? { ...r, maintenance_status: newStatus } : r));
      setOpenDropdown(null);
      toast.success('Room status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteRoom = async (room, e) => {
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to delete Room ${room.block}-${room.room_number}?`)) return;
    try {
      await roomsAPI.delete(room.id);
      setRooms(rooms.filter(r => r.id !== room.id));
      toast.success('Room deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  // ── RENDERERS ─────────────────────────────────────────────────────────────

  const renderHostelsView = () => {
    const boysStats = getHostelStats(boysRooms);
    const girlsStats = getHostelStats(girlsRooms);

    return (
      <div className="hostels-grid animate-fade">
        <div 
          className="card hover-card cursor-pointer"
          onClick={() => handleHostelSelect('Male')}
          style={{ borderColor: 'transparent' }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="icon-box" style={{ background: '#DBEAFE', color: '#2563EB' }}>
              <Building size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Boys Hostel</h2>
              <p className="text-secondary">Blocks A to F</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="stat-box">
              <div className="text-sm text-secondary mb-1">Total Capacity</div>
              <div className="text-xl font-bold">{boysStats.capacity}</div>
            </div>
            <div className="stat-box">
              <div className="text-sm text-secondary mb-1">Occupied Beds</div>
              <div className="text-xl font-bold text-success">{boysStats.occupied}</div>
            </div>
          </div>
          <button className="btn btn-primary w-full flex justify-center items-center gap-2">
            View Blocks <ChevronRight size={16} />
          </button>
        </div>

        <div 
          className="card hover-card cursor-pointer"
          onClick={() => handleHostelSelect('Female')}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="icon-box" style={{ background: '#FCE7F3', color: '#DB2777' }}>
              <Building size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Girls Hostel</h2>
              <p className="text-secondary">Blocks G to L</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="stat-box">
              <div className="text-sm text-secondary mb-1">Total Capacity</div>
              <div className="text-xl font-bold">{girlsStats.capacity}</div>
            </div>
            <div className="stat-box">
              <div className="text-sm text-secondary mb-1">Occupied Beds</div>
              <div className="text-xl font-bold text-success">{girlsStats.occupied}</div>
            </div>
          </div>
          <button className="btn btn-primary w-full flex justify-center items-center gap-2" style={{ background: 'linear-gradient(135deg, #EC4899, #BE185D)', boxShadow: '0 2px 8px rgba(236,72,153,0.35)' }}>
            View Blocks <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderBlocksView = () => {
    const isBoys = selectedHostel === 'Male';
    const blocks = getBlocksForHostel(isBoys ? boysRooms : girlsRooms);

    return (
      <div className="animate-fade pb-10">
        <div className="mb-6 flex items-center gap-3">
          <button className="btn btn-ghost btn-icon" onClick={handleBack}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold">{isBoys ? 'Boys Hostel' : 'Girls Hostel'} Blocks</h2>
            <p className="text-secondary">Select a block to view its rooms</p>
          </div>
        </div>

        <div className="blocks-grid">
          {blocks.map(b => {
            const occPct = (b.stats.occupied / b.stats.capacity) * 100 || 0;
            return (
              <div key={b.id} className="card hover-card cursor-pointer" onClick={() => handleBlockSelect(b.id)}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{b.name}</h3>
                  <span className="badge badge-primary">{b.stats.rooms} Rooms</span>
                </div>

                <div className="flex items-center gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
                  {b.isAC ? <span className="badge badge-info"><Wind size={12}/> AC</span> : <span className="badge" style={{ background: '#E5E7EB', color: '#374151' }}>Non-AC</span>}
                  <span className="badge" style={{ background: '#F3E8FF', color: '#6B21A8' }}>
                    <Droplet size={12} style={{ marginRight: 4 }}/> {b.washroom}
                  </span>
                  <span className="badge" style={{ background: '#FFEDD5', color: '#C2410C' }}>
                    <Users size={12} style={{ marginRight: 4 }}/> {b.sharing} Sharing
                  </span>
                </div>

                <div className="stat-box mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-secondary">Occupancy ({Math.round(occPct)}%)</span>
                    <span className="font-bold">{b.stats.occupied} / {b.stats.capacity}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${occPct >= 100 ? 'bg-danger' : occPct >= 80 ? 'bg-warning' : 'bg-success'}`}
                      style={{ width: `${occPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2 text-secondary">
                    <span>{b.stats.vacant} Vacant</span>
                    <span>{b.stats.maintenance > 0 ? <span className="text-danger font-bold">{b.stats.maintenance} Issue(s)</span> : 'All Good'}</span>
                  </div>
                </div>

                <button className="btn btn-secondary w-full">View Rooms</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRoomsView = () => {
    const isBoys = selectedHostel === 'Male';
    const allBlocks = getBlocksForHostel(isBoys ? boysRooms : girlsRooms);
    const block = allBlocks.find(b => b.id === selectedBlock);
    if (!block) return null;

    return (
      <div className="animate-fade pb-10">
        <div className="page-header" style={{ alignItems: 'center' }}>
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost btn-icon" onClick={handleBack}>
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                {block.name}
              </h2>
              <p className="text-secondary">{isBoys ? 'Boys Hostel' : 'Girls Hostel'} • Property Management</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2" style={{ flex: '1 1 300px', justifyContent: 'flex-end' }}>
            <div className="search-bar" style={{ flex: '1 1 200px', maxWidth: '300px' }}>
              <Search size={16} className="search-icon" />
              <input className="form-control" style={{ width: '100%', minWidth: 0 }} placeholder="Search room number..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {isAdmin && (
              <button 
                className="btn btn-primary flex-shrink-0" 
                onClick={() => {
                  setPrefilledData({ block: selectedBlock, gender: isBoys ? 'Male' : 'Female' });
                  setEditing(null);
                  setShowForm(true);
                }}
              >
                <Plus size={16} /> Add Room
              </button>
            )}
          </div>
        </div>

        {/* Block Summary Strip */}
        <div className="summary-strip mb-6">
          <div className="card p-4 flex flex-col justify-center">
            <span className="text-sm text-secondary">Occupancy</span>
            <span className="text-xl font-bold">{Math.round((block.stats.occupied / block.stats.capacity)*100)}%</span>
          </div>
          <div className="card p-4 flex flex-col justify-center">
            <span className="text-sm text-secondary">Capacity</span>
            <span className="text-xl font-bold">{block.stats.capacity}</span>
          </div>
          <div className="card p-4 flex flex-col justify-center">
            <span className="text-sm text-secondary">Occupied</span>
            <span className="text-xl font-bold text-success">{block.stats.occupied}</span>
          </div>
          <div className="card p-4 flex flex-col justify-center">
            <span className="text-sm text-secondary">Vacant</span>
            <span className="text-xl font-bold text-warning">{block.stats.vacant}</span>
          </div>
          <div className="card p-4 flex flex-col justify-center" style={{ borderLeft: '4px solid var(--primary)' }}>
            <span className="text-sm text-secondary">Est. Monthly Revenue</span>
            <span className="text-xl font-bold text-primary-color">₹{block.monthlyRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="rooms-grid">
          {block.rooms.filter(r => 
            search === '' || r.room_number.toLowerCase().includes(search.toLowerCase()) || r.room_type.toLowerCase().includes(search.toLowerCase())
          ).map(r => {
            const occPct = (r.current_occupancy / r.capacity) * 100;
            const washroom = r.amenities?.includes('Attached') ? 'Attached Washroom' : 'Common Washroom';

            return (
              <div key={r.id} className="card flex flex-col" style={{ padding: '20px' }}>
                <div className="mb-4">
                  <h3 className="text-xl font-bold">{r.block}-{r.room_number}</h3>
                  <div className="text-sm text-secondary mt-1">{isBoys ? 'Boys Hostel' : 'Girls Hostel'} • Block {r.block}</div>
                </div>

                <div className="section-label" style={{ marginTop: 0 }}>Configuration</div>
                <div className="info-row">
                  <span className="info-row-label">Air Conditioning</span>
                  <span className="info-row-value">{r.is_ac ? 'AC Room' : 'Non-AC'}</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label">Washroom</span>
                  <span className="info-row-value">{washroom}</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label">Room Type</span>
                  <span className="info-row-value">{r.room_type} ({r.capacity} Sharing)</span>
                </div>

                <div className="section-label">Occupancy</div>
                <div className="info-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                  <span className="info-row-label">{r.current_occupancy === r.capacity ? 'Full' : 'Available'}</span>
                  <span className="info-row-value">{r.current_occupancy} / {r.capacity} Students</span>
                </div>
                <div className="progress-bar mt-2 mb-4">
                  <div 
                    className={`progress-fill ${occPct >= 100 ? 'bg-danger' : occPct >= 80 ? 'bg-warning' : 'bg-success'}`}
                    style={{ width: `${occPct}%` }}
                  />
                </div>

                <div className="section-label">Details</div>
                <div className="info-row">
                  <span className="info-row-label">Monthly Rent</span>
                  <span className="info-row-value text-primary-color text-lg">₹{Number(r.monthly_rent).toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <span className="info-row-label">Maintenance</span>
                  <span className="info-row-value">
                  {canManage ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <span 
                        className={`badge badge-${statusColor[r.maintenance_status]} cursor-pointer`}
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === r.id ? null : r.id); }}
                      >
                        {r.maintenance_status}
                      </span>
                      {openDropdown === r.id && (
                        <div style={{
                          position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: '8px', boxShadow: 'var(--shadow-md)', zIndex: 10,
                          minWidth: '160px', overflow: 'hidden', textAlign: 'left'
                        }}>
                          {['Good', 'Needs Maintenance', 'Under Maintenance'].map(status => (
                            <div 
                              key={status}
                              onClick={(e) => handleStatusUpdate(r, status, e)}
                              style={{
                                padding: '8px 12px', fontSize: '0.875rem', cursor: 'pointer',
                                background: r.maintenance_status === status ? 'var(--hover)' : 'transparent',
                                color: 'var(--text)', fontWeight: 'normal'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = r.maintenance_status === status ? 'var(--hover)' : 'transparent'}
                            >
                              {status}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className={`badge badge-${statusColor[r.maintenance_status]}`}>{r.maintenance_status}</span>
                  )}
                  </span>
                </div>

                <div style={{ flexGrow: 1 }} />
                <div className="flex justify-between items-center" style={{ paddingTop: '16px', marginTop: '20px', borderTop: '1px solid var(--border)' }}>
                  <Link to={`/rooms/${r.id}`} className="btn btn-primary flex items-center justify-center gap-2" style={{ flex: 1 }}>
                    <Eye size={16}/> View Details
                  </Link>
                  <div className="flex gap-2" style={{ marginLeft: '12px' }}>
                    {isAdmin && (
                      <>
                        <button className="btn btn-secondary btn-icon" title="Edit Room" onClick={() => { setEditing(r); setShowForm(true); }}><Pencil size={16}/></button>
                        <button className="btn btn-secondary btn-icon" title="Delete Room" style={{color:'var(--danger)'}} onClick={(e) => handleDeleteRoom(r, e)}><Trash2 size={16}/></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Property Management</h2>
          <p className="page-subtitle">Manage Hostels, Blocks, and Rooms</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner"/></div>
      ) : (
        <>
          {view === 'hostels' && renderHostelsView()}
          {view === 'blocks' && renderBlocksView()}
          {view === 'rooms' && renderRoomsView()}
        </>
      )}

      {showForm && (
        <RoomForm
          room={editing}
          prefilledData={prefilledData}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}

      <style>{`
        .hostels-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .blocks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
        .rooms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
        .summary-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
        
        .hover-card { transition: all 0.3s ease; }
        .hover-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--primary); }
        
        .icon-box { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-box { padding: 16px; border-radius: 12px; background: var(--surface); }
        
        .bg-success { background: var(--success) !important; }
        .bg-warning { background: var(--warning) !important; }
        .bg-danger { background: var(--danger) !important; }
        
        .cursor-pointer { cursor: pointer; }
        .pb-10 { padding-bottom: 40px; }
        .mb-6 { margin-bottom: 24px; }
      `}</style>
    </div>
  );
}
