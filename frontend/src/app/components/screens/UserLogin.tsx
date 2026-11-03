import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Map, AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { isAxiosError } from 'axios';

import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../context/useAuth';

export function UserLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, register, isAuthenticated, hasChecked } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  useEffect(() => {
    if (hasChecked && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [from, hasChecked, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginUser(email, password);
      } else {
        await register({ email, password, name: fullName });
      }
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message || err.message
        : err instanceof Error ? err.message : undefined;
      setError(message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_50%_0%,#ccfbf1_0%,#f6f8fb_48%)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-800 text-white shadow-lg shadow-teal-900/20">
            <Map className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">GeoLedger</h1>
          <p className="text-[#64748B]">Citizen / Property Owner Login</p>
        </div>

        <Card className="rounded-2xl border-white/80 bg-white/90 shadow-xl shadow-slate-900/[0.06] backdrop-blur">
          <CardHeader>
            <CardTitle className="text-[#0F172A]">
              {mode === 'login' ? 'User Login' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-[#64748B]">
              {mode === 'login'
                ? 'Sign in to manage properties, applications, and transfers.'
                : 'Register a new citizen account to submit land applications.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} />
              </div>

              {error && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] mt-0.5" />
                  <p className="text-sm text-[#991B1B]">{error}</p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-[#0F766E] shadow-sm shadow-teal-900/15 hover:bg-[#0F766E]/90">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : mode === 'register' ? <UserPlus className="w-4 h-4 mr-2" /> : null}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-[#64748B]">
              {mode === 'login' ? (
                <button type="button" className="text-[#0F766E] hover:underline" onClick={() => setMode('register')}>
                  Need an account? Register
                </button>
              ) : (
                <button type="button" className="text-[#0F766E] hover:underline" onClick={() => setMode('login')}>
                  Already registered? Sign in
                </button>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#E2E8F0] text-center space-y-2">
              <Link to="/admin/login" className="block text-sm text-[#64748B] hover:text-[#0F766E]">
                Admin login →
              </Link>
              <Link to="/" className="block text-sm text-[#64748B] hover:text-[#0F766E]">
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
