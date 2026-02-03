import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn({ email, password });

      if (error) {
        setError(error.message);
        return;
      }

      // Redirect to previous page or dashboard
      navigate(from, { replace: true });
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">
            ReSkin Lab<span className="text-emerald-500">.</span>
          </h1>
          <p className="text-neutral-500 mt-2">Boutique iGaming Production</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-md shadow-sm border border-neutral-200 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">
            Sign in to your account
          </h2>

          {/* Configuration warning */}
          {!isConfigured && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Supabase is not configured. Update your{' '}
                <code className="bg-amber-100 px-1 rounded">.env.local</code> file.
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded border border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors text-neutral-900 placeholder-neutral-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded border border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors text-neutral-900 placeholder-neutral-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isConfigured}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-neutral-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} ReSkin Lab. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
