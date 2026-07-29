import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('superadmin@siteos.app');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/dpr');
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">SiteOS</h1>
        <p className="text-sm text-gray-500 mb-6">Construction Operating System</p>

        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="mt-5 text-xs text-gray-400 border-t border-gray-100 pt-3">
          Demo logins (password: Admin@123)
          <div>superadmin@siteos.app — Super Admin</div>
          <div>admin@siteos.app — Admin</div>
          <div>engineer@siteos.app — Site Engineer</div>
          <div>accounts@siteos.app — Accountant</div>
        </div>
      </form>
    </div>
  );
}
