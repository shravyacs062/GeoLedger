import { useEffect, useState } from 'react';
import { AlertCircle, Bell, CheckCircle2 } from 'lucide-react';

import { api } from '../../../services/api';
import { Layout } from '../Layout';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  application_id?: string;
};

export function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.notifications.list().then((result) => {
      if (active) setItems(result);
    }).catch((reason) => {
      if (active) setError(reason?.response?.data?.message || 'Unable to load notifications.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const markRead = async (id: string) => {
    setBusy(id);
    setError('');
    try {
      const updated = await api.notifications.markRead(id);
      setItems((current) => current.map((item) => item.id === id ? { ...item, ...updated, is_read: true } : item));
    } catch (reason) {
      setError((reason as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to update notification.');
    } finally {
      setBusy('');
    }
  };

  const markAllRead = async () => {
    setBusy('all');
    setError('');
    try {
      await api.notifications.markAllRead();
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    } catch (reason) {
      setError((reason as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to update notifications.');
    } finally {
      setBusy('');
    }
  };

  const unread = items.filter((item) => !item.is_read).length;
  return (
    <Layout>
      <main className="mx-auto max-w-4xl space-y-6 p-4 lg:p-8">
        <header className="flex items-center justify-between gap-4">
          <div><h1 className="text-3xl font-semibold text-[#0F172A]">Notifications</h1><p className="text-sm text-[#64748B]">{unread} unread updates</p></div>
          <Button variant="outline" disabled={!unread || busy === 'all'} onClick={() => void markAllRead()}>Mark all read</Button>
        </header>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <Card>
          <CardHeader><CardTitle>Activity updates</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="py-8 text-center text-sm text-[#64748B]">Loading notifications…</p>
              : items.length === 0 ? <div className="py-10 text-center text-sm text-[#64748B]"><Bell className="mx-auto mb-3 h-8 w-8" />No notifications yet.</div>
                : <div className="divide-y">{items.map((item) => (
                  <article key={item.id} className="flex flex-col justify-between gap-3 py-5 sm:flex-row sm:items-start">
                    <div className="flex gap-3">
                      {item.is_read ? <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-green-700" /> : <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-[#0F766E]" />}
                      <div><h2 className="font-medium">{item.title}</h2><p className="mt-1 text-sm text-[#475569]">{item.message}</p><time className="mt-2 block text-xs text-[#64748B]">{new Date(item.created_at).toLocaleString()}</time></div>
                    </div>
                    {!item.is_read && <Button size="sm" variant="outline" disabled={busy === item.id} onClick={() => void markRead(item.id)}>Mark read</Button>}
                  </article>
                ))}</div>}
          </CardContent>
        </Card>
      </main>
    </Layout>
  );
}
