import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login berhasil! Selamat datang.');
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-primary-800 to-primary-700 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-navy-dark to-primary-800 px-8 py-8 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-white text-2xl font-bold">Admin Login</h1>
            <p className="text-blue-200 text-sm mt-1">SIG Mitigasi Bencana Bandar Lampung</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            {error && (
              <div className="alert-error flex items-center gap-2 mb-5 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@sigbandar.go.id"
                    className="form-input !pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input !pl-10 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Masuk...</>
                ) : (
                  <><ShieldAlert className="w-4 h-4" />Masuk ke Admin Panel</>
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
              <div className="font-semibold text-slate-600 mb-2">Demo Credentials:</div>
              <div>📧 superadmin@sigbandar.go.id</div>
              <div>🔐 admin123</div>
            </div>
          </div>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          © 2024 BPBD Kota Bandar Lampung — Sistem Terlindungi
        </p>
      </div>
    </div>
  );
}
