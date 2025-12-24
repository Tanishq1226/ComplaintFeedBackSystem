import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from './utils/auth';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ParentGatepassAction from './pages/ParentGatepassAction';
import WardenGatepassAction from './pages/WardenGatepassAction';
import StudentDashboard from './pages/StudentDashboard';
import LibrarianDashboard from './pages/LibrarianDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import WardenDashboard from './pages/WardenDashboard';
import './App.css';

function App() {
  const HomeRedirect = () => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }

    const role = getUserRole();
    if (role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (role === 'librarian') return <Navigate to="/librarian/dashboard" replace />;
    if (role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (role === 'warden') return <Navigate to="/warden/dashboard" replace />;

    return <Navigate to="/login" replace />;
  };

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/gatepass-action" element={<ParentGatepassAction />} />
        <Route path="/warden-action" element={<WardenGatepassAction />} />

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/librarian/dashboard"
          element={
            <ProtectedRoute allowedRoles={['librarian']}>
              <LibrarianDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/warden/dashboard"
          element={
            <ProtectedRoute allowedRoles={['warden']}>
              <WardenDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
      </Routes>
    </Router>
  );
}

export default App;
