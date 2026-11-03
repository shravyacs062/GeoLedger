import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Loader2, Map } from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../context/AuthContext';

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAdmin, isAuthenticated, isAdmin, hasChecked } = useAuth();
  const [email, setEmail] = useState('admin@geoledger.local');
  const [password, setPassword] = useState('Admin@12345');
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
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0F766E] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">GeoLedger Admin</h1>
          <p className="text-[#94A3B8]">Registrar & Administrator Portal</p>
        </div>

        <Card className="border-[#334155] bg-[#1E293B] shadow-xl">
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

              <Button type="submit" disabled={loading} className="w-full bg-[#0F766E] hover:bg-[#0F766E]/90 h-11">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign in as Admin
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#334155] text-center space-y-2">
              <Link to="/login" className="block text-sm text-[#94A3B8] hover:text-[#5EEAD4]">
                ← Citizen / User login
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
