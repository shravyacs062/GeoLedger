import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Map, AlertCircle, Loader2, UserPlus } from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../context/AuthContext';

export function UserLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, register, isAuthenticated, hasChecked } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('user@geoledger.local');
  const [password, setPassword] = useState('User@12345');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
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
        await register({ email, password, full_name: fullName, phone });
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0F766E] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Map className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">GeoLedger</h1>
          <p className="text-[#64748B]">Citizen / Property Owner Login</p>
        </div>

        <Card className="border-[#E2E8F0] shadow-lg">
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
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>

              {error && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] mt-0.5" />
                  <p className="text-sm text-[#991B1B]">{error}</p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-[#0F766E] hover:bg-[#0F766E]/90 h-11">
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
                Administrator / Registrar login →
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
