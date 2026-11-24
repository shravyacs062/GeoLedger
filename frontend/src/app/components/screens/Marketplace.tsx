import { useEffect, useMemo, useState } from 'react';
import { MapPin, Send, Store, X } from 'lucide-react';
import { Layout } from '../Layout';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { api, type MarketplaceListing, type Property } from '../../../services/api';
import { useAuth } from '../../context/useAuth';

const rupees = (amount: number) => `₹${Number(amount).toLocaleString('en-IN')}`;
const PAGE_SIZE = 12;

export function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [catalog, setCatalog] = useState<MarketplaceListing[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('');
  const [landType, setLandType] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ property_id: '', title: '', asking_price: '', description: '' });

  const load = async () => {
    try {
      setListings(await api.marketplace.list({ query, district, land_type: landType, sort }));
      setNotice('');
    } catch {
      setNotice('Could not load marketplace listings. Please retry.');
    }
  };

  useEffect(() => { api.marketplace.list().then(setCatalog).catch(() => setCatalog([])); }, []);
  useEffect(() => {
    const debounce = window.setTimeout(() => { void load(); }, 180);
    return () => window.clearTimeout(debounce);
  }, [query, district, landType, sort]);
  useEffect(() => { setPage(1); }, [query, district, landType, sort]);
  useEffect(() => { api.properties.list().then(setProperties).catch(() => setProperties([])); }, []);

  const districts = useMemo(() => Array.from(new Set(catalog.map(x => x.district).filter(Boolean))).sort(), [catalog]);
  const types = useMemo(() => Array.from(new Set(catalog.map(x => x.land_type).filter(Boolean))).sort(), [catalog]);
  const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const visibleListings = useMemo(() => listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [listings, page]);

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const sendInterest = async (id: string) => {
    try {
      const result = await api.marketplace.interest(id, message[id] || 'I would like to arrange a viewing and discuss this property.');
      setNotice(result.notice);
    } catch (e: any) {
      setNotice(e?.response?.data?.message || 'Unable to send interest.');
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.marketplace.create({ ...form, asking_price: Number(form.asking_price) });
      setShowForm(false);
      setForm({ property_id: '', title: '', asking_price: '', description: '' });
      setNotice('Listing created. It remains a marketplace listing, not a legal transfer.');
      void load();
    } catch (e: any) {
      setNotice(e?.response?.data?.message || 'Unable to create listing.');
    }
  };

  return <Layout><div className="mx-auto max-w-7xl space-y-7 p-4 lg:p-8">
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#0F766E]">Karnataka property portal</p><h1 className="mt-2 text-3xl font-semibold text-[#0F172A]">Property marketplace</h1><p className="mt-2 max-w-2xl text-[#64748B]">Compare available listings, then contact the seller. A marketplace listing never transfers legal ownership.</p></div>
      {user && <Button className="bg-[#0F766E] hover:bg-[#115E59]" onClick={() => setShowForm(!showForm)}>{showForm ? <X className="mr-2 h-4 w-4" /> : <Store className="mr-2 h-4 w-4" />}{showForm ? 'Close form' : 'List my property'}</Button>}
    </header>
    {!user && <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Browsing is public. To protect seller privacy, listing creation and interest requests use the project’s existing account and wallet verification.</p>}
    {notice && <div role="status" className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">{notice}</div>}
    {showForm && <Card><CardHeader><CardTitle>Create a listing</CardTitle><CardDescription>Only a property recorded against your connected account can be listed. Legal transfer remains separate.</CardDescription></CardHeader><CardContent><form onSubmit={create} className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Registered property</Label><select required value={form.property_id} onChange={e => setForm({ ...form, property_id: e.target.value })}><option value="">Select your property</option>{properties.map(p => <option key={p.property_id} value={p.property_id}>{p.survey_number} — {p.village || p.district}</option>)}</select></div><div className="space-y-2"><Label>Listing title</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Corner residential site" /></div><div className="space-y-2"><Label>Asking price (₹)</Label><Input required min="1" type="number" value={form.asking_price} onChange={e => setForm({ ...form, asking_price: e.target.value })} /></div><div className="space-y-2 md:col-span-2"><Label>Description</Label><textarea required minLength={10} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe access, suitable use and viewing availability." /></div><div><Button className="bg-[#0F766E]">Publish listing</Button></div></form></CardContent></Card>}
    <Card className="border-slate-200"><CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_165px_155px_155px]"><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search survey number, place or property type" /><select value={district} onChange={e => setDistrict(e.target.value)}><option value="">All districts</option>{districts.map(x => <option key={x}>{x}</option>)}</select><select value={landType} onChange={e => setLandType(e.target.value)}><option value="">All types</option>{types.map(x => <option key={x}>{x}</option>)}</select><select className="max-w-full" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort listings"><option value="newest">Newest</option><option value="price_asc">Price: low first</option><option value="price_desc">Price: high first</option><option value="area_desc">Largest area</option></select></CardContent></Card>
    <p className="text-sm text-slate-500">{listings.length} active {listings.length === 1 ? 'listing' : 'listings'} shown{listings.length > PAGE_SIZE ? ` · Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, listings.length)}` : ''}</p>
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{visibleListings.map(x => <Card key={x.id} className="group flex min-h-[420px] flex-col overflow-hidden border-slate-200 bg-white"><div className="h-2 bg-gradient-to-r from-teal-600 to-cyan-400" /><CardHeader className="pb-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><CardDescription className="mb-2 flex items-center gap-1 text-sm"><MapPin className="h-4 w-4 shrink-0 text-teal-700" />{[x.taluk, x.district].filter(Boolean).join(', ')}</CardDescription><CardTitle className="text-xl leading-tight">{x.title}</CardTitle></div>{x.is_demo && <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Demo listing</span>}</div><div className="mt-4"><span className="text-xs font-medium uppercase tracking-wide text-slate-500">Asking price</span><p className="mt-1 text-2xl font-bold tracking-tight text-[#0F766E]">{rupees(x.asking_price)}</p></div></CardHeader><CardContent className="flex flex-1 flex-col gap-4"><div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-sm"><div className="border-b border-r border-slate-200 p-3"><span className="block text-xs text-slate-500">Survey number</span><b className="mt-1 block font-mono text-[13px]">{x.survey_number}</b></div><div className="border-b border-slate-200 p-3"><span className="block text-xs text-slate-500">Land area</span><b className="mt-1 block">{x.area} {x.area_unit}</b></div><div className="border-r border-slate-200 p-3"><span className="block text-xs text-slate-500">Property type</span><b className="mt-1 block">{x.land_type}</b></div><div className="p-3"><span className="block text-xs text-slate-500">Locality</span><b className="mt-1 block truncate">{x.village || x.district}</b></div></div><p className="text-sm leading-6 text-slate-600">{x.description}</p>{user && <div className="mt-auto border-t border-slate-200 pt-4"><Label className="text-xs font-semibold uppercase tracking-wide">Contact seller</Label><div className="mt-2 flex gap-2"><Input value={message[x.id] || ''} onChange={e => setMessage({ ...message, [x.id]: e.target.value })} placeholder="Request a viewing" /><Button size="sm" aria-label={`Send interest for ${x.title}`} onClick={() => void sendInterest(x.id)}><Send className="h-4 w-4" /></Button></div></div>}</CardContent></Card>)}</div>
    {listings.length > PAGE_SIZE && <nav aria-label="Marketplace pages" className="flex items-center justify-center gap-3"><Button variant="outline" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={page === 1}>Previous</Button><span className="text-sm text-slate-600">Page {page} of {totalPages}</span><Button variant="outline" onClick={() => setPage(current => Math.min(totalPages, current + 1))} disabled={page === totalPages}>Next</Button></nav>}
    {!listings.length && <Card><CardContent className="p-10 text-center text-slate-500">No active listings match these filters. Clear a filter or try another place.</CardContent></Card>}
  </div></Layout>;
}
