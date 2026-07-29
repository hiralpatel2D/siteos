import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DprPage from './pages/DprPage';
import ProjectsPage from './pages/ProjectsPage';
import InventoryPage from './pages/InventoryPage';
import AttendancePage from './pages/AttendancePage';
import InvoicingPage from './pages/InvoicingPage';
import RolesPermissionsPage from './pages/RolesPermissionsPage';
import UsersPage from './pages/UsersPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dpr" replace />} />
            <Route path="/dpr" element={<ProtectedRoute module="dashboard_dpr"><DprPage /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute module="projects"><ProjectsPage /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute module="inventory"><InventoryPage /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute module="attendance"><AttendancePage /></ProtectedRoute>} />
            <Route path="/invoicing" element={<ProtectedRoute module="invoicing"><InvoicingPage /></ProtectedRoute>} />
            <Route path="/roles" element={<ProtectedRoute module="roles_permissions"><RolesPermissionsPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute module="users"><UsersPage /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
