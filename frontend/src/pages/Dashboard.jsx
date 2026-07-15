import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import WardenDashboard from './WardenDashboard';

export default function DashboardSwitch() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'warden') {
    return <WardenDashboard />;
  }

  return <div>Access Denied.</div>;
}
