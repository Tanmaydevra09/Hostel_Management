import { useState, useEffect } from 'react';
import { formatDate } from '../../utils/formatters';
import { studentPortalAPI } from '../../api';
import { CreditCard, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentPortalAPI.getFees()
      .then(res => setFees(res.data.data))
      .catch(() => toast.error('Failed to load fees'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div className="page-container animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Fees</h1>
          <p className="page-subtitle">View your fee history and pending dues.</p>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount</th>
                <th>Fine</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fees.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4">No fee records found.</td></tr>
              ) : fees.map(f => (
                <tr key={f.id}>
                  <td>{f.month_year}</td>
                  <td className="font-semibold">₹{Number(f.amount).toLocaleString()}</td>
                  <td className="text-danger">₹{Number(f.fine_amount || 0).toLocaleString()}</td>
                  <td>{formatDate(f.due_date)}</td>
                  <td>
                    <span className={`badge badge-${f.status==='Paid'?'success':f.status==='Pending'?'warning':'danger'}`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
