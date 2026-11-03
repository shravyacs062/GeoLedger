import { useEffect, useState } from 'react';
import { Layout } from '../Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, Users } from 'lucide-react';
import { api } from '../../../services/api';

const ROLES = ['USER', 'ADMIN', 'REGISTRAR'];

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsers(await api.auth.listUsers());
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (userId: string, role: string) => {
    setSavingId(userId);
    try {
      await api.auth.setRole(userId, role);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to update role');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-[#0F172A]">User Management</h1>
          <p className="text-[#64748B]">View accounts and assign USER / ADMIN / REGISTRAR roles</p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-[#64748B]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading users…
          </div>
        )}
        {error && <p className="text-sm text-[#DC2626]">{error}</p>}

        <Card className="border-[#E2E8F0]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> Accounts ({users.length})
            </CardTitle>
            <CardDescription>Seeded demo accounts and registered citizens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#E2E8F0] rounded-lg p-4"
              >
                <div>
                  <p className="font-medium text-[#0F172A]">{u.full_name || 'Unnamed user'}</p>
                  <p className="text-sm text-[#64748B]">{u.email || 'No email (wallet-only)'}</p>
                  <p className="font-mono text-xs text-[#94A3B8] break-all">{u.wallet_address || 'No wallet'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{u.role || 'USER'}</Badge>
                  <select
                    className="h-9 rounded-md border border-[#E2E8F0] px-2 text-sm"
                    value={(u.role || 'USER').toUpperCase()}
                    disabled={savingId === u.id}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {savingId === u.id && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>
              </div>
            ))}
            {!loading && users.length === 0 && (
              <p className="text-sm text-[#64748B]">No users found.</p>
            )}
            <Button variant="outline" onClick={load}>Refresh</Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
