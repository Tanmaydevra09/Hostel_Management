import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/Students/StudentList';
import StudentProfile from './pages/Students/StudentProfile';
import RoomList from './pages/Rooms/RoomList';
import RoomDetails from './pages/Rooms/RoomDetails';
import FeeList from './pages/Fees/FeeList';
import ComplaintList from './pages/Complaints/ComplaintList';
import VisitorLog from './pages/Visitors/VisitorLog';
import AttendancePage from './pages/Attendance/AttendancePage';
import LeavePage from './pages/Leave/LeavePage';
import NoticePage from './pages/Notices/NoticePage';
import ReportsPage from './pages/Reports/ReportsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import AuditLogs from './pages/Settings/AuditLogs';

// Student Portal Pages
import StudentDashboard from './pages/StudentPortal/StudentDashboard';
import StudentFees from './pages/StudentPortal/StudentFees';
import StudentComplaints from './pages/StudentPortal/StudentComplaints';
import StudentLeave from './pages/StudentPortal/StudentLeave';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const RoleRoute = ({ adminComponent: AdminComp, studentComponent: StudentComp }) => {
  const { user } = useAuth();
  if (user?.role === 'student' && StudentComp) return <StudentComp />;
  if (user?.role !== 'student' && AdminComp) return <AdminComp />;
  return <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"   element={<RoleRoute adminComponent={Dashboard} studentComponent={StudentDashboard} />} />
          <Route path="students"    element={<RoleRoute adminComponent={StudentList} />} />
          <Route path="students/:id" element={<RoleRoute adminComponent={StudentProfile} />} />
          <Route path="rooms"       element={<RoleRoute adminComponent={RoomList} />} />
          <Route path="rooms/:id"   element={<RoleRoute adminComponent={RoomDetails} />} />
          <Route path="fees"        element={<RoleRoute adminComponent={FeeList} studentComponent={StudentFees} />} />
          <Route path="complaints"  element={<RoleRoute adminComponent={ComplaintList} studentComponent={StudentComplaints} />} />
          <Route path="visitors"    element={<RoleRoute adminComponent={VisitorLog} />} />
          <Route path="attendance"  element={<RoleRoute adminComponent={AttendancePage} />} />
          <Route path="leave"       element={<RoleRoute adminComponent={LeavePage} studentComponent={StudentLeave} />} />
          <Route path="notices"     element={<NoticePage />} />
          <Route path="reports"     element={<RoleRoute adminComponent={ReportsPage} />} />
          <Route path="settings"    element={<SettingsPage />} />
          <Route path="audit-logs"  element={<RoleRoute adminComponent={AuditLogs} />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
