import { useEffect, useState } from 'react';
import { Layout } from '../Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Bell, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { api } from '../../../services/api';

export function Notifications() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.notifications.list();
      setItems(data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await api.notifications.markRead(id);
    await load();
  };

  const markAll = async () => {
    await api.notifications.markAllRead();
    await load();
  };

  const unread = items.filter((n) => !n.is_read);

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#0F172A]">Notifications</h1>
            <p className="text-[#64748B]">Application, document, and transfer updates</p>
          </div>
          <Button variant="outline" onClick={markAll} disabled={!unread.length}>
            Mark all read
          </Button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-[#64748B]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        )}
        {error && <p className="text-sm text-[#DC2626]">{error}</p>}

        {!loading && items.length === 0 && (
          <Card className="border-[#E2E8F0]">
            <CardContent className="py-12 text-center text-[#64748B]">
              <Bell className="w-8 h-8 mx-auto mb-3 opacity-40" />
              No notifications yet.
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {items.map((n) => (
            <Card key={n.id} className={`border-[#E2E8F0] ${n.is_read ? 'opacity-70' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {n.is_read ? (
                      <CheckCircle2 className="w-5 h-5 text-[#16A34A] mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-[#0F766E] mt-0.5" />
                    )}
                    <div>
                      <CardTitle className="text-base">{n.title}</CardTitle>
                      <CardDescription>{n.message}</CardDescription>
                      <p className="text-xs text-[#94A3B8] mt-1">{n.created_at}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!n.is_read && <Badge>Unread</Badge>}
                    {!n.is_read && (
                      <Button size="sm" variant="outline" onClick={() => markRead(n.id)}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
