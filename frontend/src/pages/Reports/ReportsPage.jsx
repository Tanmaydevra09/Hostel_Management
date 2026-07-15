import { useState } from 'react';
import { reportsAPI } from '../../api';
import { FileBarChart, Download, Users, CreditCard, AlertCircle, Loader2, BarChart3, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

const downloadBlob = (data, filename) => {
  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

function ReportCard({ icon: Icon, title, description, color, bg, onDownload, loading }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20, transition: 'all var(--transition)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{
          width: 56, height: 56,
          borderRadius: 'var(--radius-md)',
          background: bg,
          color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={26} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>{title}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>
        </div>
      </div>
      <button
        className="btn btn-primary w-full"
        style={{ justifyContent: 'center', gap: 8 }}
        onClick={onDownload}
        disabled={loading}
      >
        {loading
          ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
          : <><Download size={15} /> Download PDF</>
        }
      </button>
    </div>
  );
}

export default function ReportsPage() {
  const [loading, setLoading] = useState({});
  const setL = (key, val) => setLoading(l => ({ ...l, [key]: val }));

  const downloadStudents = async () => {
    setL('students', true);
    try {
      const res = await reportsAPI.students({ status: 'Active' });
      downloadBlob(res.data, 'students_report.pdf');
      toast.success('Students report downloaded!');
    } catch { toast.error('Failed to generate report'); }
    finally { setL('students', false); }
  };

  const downloadFees = async () => {
    setL('fees', true);
    try {
      const res = await reportsAPI.fees({});
      downloadBlob(res.data, 'fees_report.pdf');
      toast.success('Fees report downloaded!');
    } catch { toast.error('Failed to generate report'); }
    finally { setL('fees', false); }
  };

  const downloadPendingFees = async () => {
    setL('pending', true);
    try {
      const res = await reportsAPI.fees({ status: 'Overdue' });
      downloadBlob(res.data, 'overdue_fees_report.pdf');
      toast.success('Overdue fees report downloaded!');
    } catch { toast.error('Failed to generate report'); }
    finally { setL('pending', false); }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Reports</h2>
          <p className="page-subtitle">Generate and download professional PDF reports</p>
        </div>
      </div>

      {/* Info banner */}
      <div style={{
        background: 'rgba(95,203,141,0.08)',
        border: '1px solid rgba(95,203,141,0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 28,
      }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(95,203,141,0.15)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileBarChart size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2 }}>Professional PDF Reports</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            All reports include branding, summary cards, proper formatting, page numbers, and auto page breaks for long tables.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        <ReportCard
          icon={Users}
          title="Student Report"
          description="Complete list of all active students with room, course, department, phone, and contact details. Includes summary statistics."
          color="#2D8A5A"
          bg="rgba(95,203,141,0.12)"
          onDownload={downloadStudents}
          loading={loading.students}
        />
        <ReportCard
          icon={CreditCard}
          title="Fee Collection Report"
          description="All fee records with payment status, amounts collected, outstanding dues, and payment mode breakdown."
          color="#4A7FCC"
          bg="rgba(169,197,255,0.15)"
          onDownload={downloadFees}
          loading={loading.fees}
        />
        <ReportCard
          icon={AlertCircle}
          title="Overdue Fees Report"
          description="Students with overdue fee payments. Perfect for sending reminders and follow-up notices to residents."
          color="#C94A4A"
          bg="rgba(241,108,108,0.10)"
          onDownload={downloadPendingFees}
          loading={loading.pending}
        />
      </div>
    </div>
  );
}
