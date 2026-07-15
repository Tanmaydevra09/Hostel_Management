import { useState, useEffect } from 'react';
import { auditAPI } from '../../api';
import { Search, Filter, Download, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  
  const [filterOptions, setFilterOptions] = useState({ modules: [], actions: [] });
  
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    module: '',
    action: '',
    startDate: '',
    endDate: ''
  });

  const fetchFilters = async () => {
    try {
      const res = await auditAPI.getFilters();
      setFilterOptions({ modules: res.data.modules, actions: res.data.actions });
    } catch (err) {
      console.error('Failed to fetch audit filters', err);
    }
  };

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await auditAPI.getLogs({
        page,
        limit: pagination.limit,
        ...filters
      });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(logs.map(log => ({
      Timestamp: new Date(log.timestamp).toLocaleString(),
      User: log.user_name,
      Role: log.role,
      Action: log.action,
      Module: log.module,
      RecordID: log.record_id || 'N/A',
      Description: log.description,
      IPAddress: log.ip_address || 'N/A'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");
    XLSX.writeFile(wb, `Audit_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getActionBadgeClass = (action) => {
    switch (action?.toLowerCase()) {
      case 'create': return 'badge-success';
      case 'update': return 'badge-info';
      case 'delete': return 'badge-danger';
      case 'login': return 'badge-primary';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="page-container animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Activity size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }}/> System Audit Logs</h1>
          <p className="page-subtitle">Track and monitor all system activities and data modifications</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={exportToCSV} disabled={logs.length === 0}>
            <Download size={16} /> Export to Excel
          </button>
        </div>
      </div>

      <div className="card filters-card" style={{ marginBottom: 24, padding: 16 }}>
        <div className="filters-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="search-bar" style={{ flex: 1, minWidth: '100%' }}>
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search descriptions, users..." 
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              style={{ width: '100%', minWidth: '0' }}
            />
          </div>
          <div className="search-bar" style={{ flex: 1, minWidth: '100%' }}>
            <Filter size={16} className="search-icon" />
            <select className="form-control" name="module" value={filters.module} onChange={handleFilterChange} style={{ width: '100%', minWidth: '0', paddingLeft: 40 }}>
              <option value="">All Modules</option>
              {filterOptions.modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="search-bar" style={{ flex: 1, minWidth: '100%' }}>
            <Filter size={16} className="search-icon" />
            <select className="form-control" name="action" value={filters.action} onChange={handleFilterChange} style={{ width: '100%', minWidth: '0', paddingLeft: 40 }}>
              <option value="">All Actions</option>
              {filterOptions.actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="search-bar" style={{ flex: 1, minWidth: '100%' }}>
            <Filter size={16} className="search-icon" />
            <select className="form-control" name="role" value={filters.role} onChange={handleFilterChange} style={{ width: '100%', minWidth: '0', paddingLeft: 40 }}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="warden">Warden</option>
              <option value="student">Student</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card table-container">
        {loading ? (
          <div className="loading-overlay" style={{ minHeight: 300 }}>
            <div className="spinner" />
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Description</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? logs.map(log => (
                <tr key={log.id}>
                  <td className="text-sm" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString(undefined, { 
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{log.user_name}</div>
                    <div className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>{log.role}</div>
                  </td>
                  <td>
                    <span className={`badge ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="text-sm font-medium">{log.module}</td>
                  <td className="text-sm text-muted" style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.description}>
                    {log.description}
                  </td>
                  <td className="text-xs text-muted font-mono">{log.ip_address || '—'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <Activity size={32} />
                      <h4>No logs found</h4>
                      <p>Try adjusting your search filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center" style={{ marginTop: 16 }}>
          <div className="text-sm text-muted">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn btn-outline btn-sm" 
              disabled={pagination.page === 1}
              onClick={() => fetchLogs(pagination.page - 1)}
            >
              Previous
            </button>
            <button 
              className="btn btn-outline btn-sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
