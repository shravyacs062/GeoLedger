<<<<<<< Updated upstream
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
=======
import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCircle2, Clock, FileText, RefreshCw } from 'lucide-react';
import { Layout } from '../Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { api } from '../../../services/api';

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  application_id?: string;
  created_at: string;
};

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    try {
      setNotifications(await api.notifications.list());
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.notifications.list().then((items) => {
      if (active) setNotifications(items);
    }).catch((err) => {
      if (active) setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to load notifications.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const markRead = async (id: string) => {
    setBusy(id);
    try {
      await api.notifications.markRead(id);
      setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to update notification.');
    } finally {
      setBusy('');
    }
  };

  const unreadCount = notifications.filter((item) => !item.read).length;
  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <div><h1 className="text-3xl font-semibold text-[#0F172A]">Notifications</h1><p className="mt-1 text-[#64748B]">{unreadCount} unread</p></div>
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
        </div>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <Card>
          <CardHeader><CardTitle>Activity updates</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="py-8 text-center text-sm text-[#64748B]">Loading notifications…</p>
              : notifications.length === 0 ? <div className="py-10 text-center"><Bell className="mx-auto mb-3 h-9 w-9 text-[#94A3B8]" /><p className="text-sm text-[#64748B]">No notifications yet.</p></div>
                : <div className="divide-y">
                  {notifications.map((item) => <article key={item.id} className={`flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between ${item.read ? '' : 'bg-[#F0FDFA]'}`}>
                    <div className="flex gap-3">
                      {item.title.toLowerCase().includes('document')
                        ? <FileText className="mt-1 h-5 w-5 shrink-0 text-[#0F766E]" />
                        : item.title.toLowerCase().includes('approved')
                          ? <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-green-700" />
                          : <Bell className="mt-1 h-5 w-5 shrink-0 text-[#0F766E]" />}
                      <div><h2 className="font-medium text-[#0F172A]">{item.title}</h2><p className="mt-1 text-sm text-[#475569]">{item.message}</p>
                        <p className="mt-2 flex items-center gap-1 text-xs text-[#64748B]"><Clock className="h-3 w-3" />{new Date(item.created_at).toLocaleString()}</p>
                        {item.application_id && <p className="mt-1 break-all font-mono text-xs text-[#64748B]">Application {item.application_id}</p>}
                      </div>
                    </div>
                    {!item.read && <Button size="sm" variant="outline" disabled={busy === item.id} onClick={() => void markRead(item.id)}>Mark as read</Button>}
                  </article>)}
                </div>}
          </CardContent>
        </Card>
>>>>>>> Stashed changes
      </div>
    </Layout>
  );
}
