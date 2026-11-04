import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Loader2, Map } from 'lucide-react';
import { isAxiosError } from 'axios';

import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../context/useAuth';

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAdmin, isAuthenticated, isAdmin, hasChecked } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from || '/admin';

  useEffect(() => {
    if (hasChecked && isAuthenticated && isAdmin) {
      navigate(from, { replace: true });
    }
  }, [from, hasChecked, isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginAdmin(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message || err.message
        : err instanceof Error ? err.message : undefined;
      setError(message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,#164e63_0%,#0f172a_55%)] p-4">
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0F766E] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">GeoLedger Admin</h1>
          <p className="mt-1 text-[#94A3B8]">Secure Admin portal</p>
        </div>

        <Card className="border-white/10 bg-[#172338]/90 text-white shadow-2xl shadow-black/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Admin Login</CardTitle>
            <CardDescription className="text-[#94A3B8]">
              Authorized personnel only. Approvals, document review, and registry management.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-[#E2E8F0]">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0F172A] border-[#334155] text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-[#E2E8F0]">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0F172A] border-[#334155] text-white"
                  required
                />
              </div>

              {error && (
                <div className="bg-[#7F1D1D]/40 border border-[#FECACA]/30 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-[#FCA5A5] mt-0.5" />
                  <p className="text-sm text-[#FECACA]">{error}</p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-[#0F766E] shadow-sm shadow-teal-950/20 hover:bg-[#0F766E]/90">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign in as Admin
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#334155] text-center space-y-2">
              <Link to="/login" className="block text-sm text-[#94A3B8] hover:text-[#5EEAD4]">
                ← User login
              </Link>
              <Link to="/" className="inline-flex items-center gap-1 text-sm text-[#64748B] hover:text-[#94A3B8]">
                <Map className="w-3.5 h-3.5" /> Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
