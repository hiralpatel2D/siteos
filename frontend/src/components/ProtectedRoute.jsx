import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, module, action = 'view' }) {
  const { user, loading, can } = useAuth();
  if (loading) return <div className="p-8 text-center text-sm text-gray-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (module && !can(module, action)) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-700 font-medium">You don't have permission to view this page.</p>
        <p className="text-sm text-gray-500 mt-1">Ask a Super Admin or Admin to grant access from Roles & Permissions.</p>
      </div>
    );
  }
  return children;
}
