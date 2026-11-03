import { Link } from 'react-router-dom';
import { FileCheck2, Map, ShieldCheck } from 'lucide-react';

import { useAuth } from '../../context/useAuth';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function Landing() {
  const { user } = useAuth();
  const home = user?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <main className="min-h-screen bg-[#F6F8FB] text-[#0F172A]">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur-xl sm:px-10">
        <Link to="/" className="flex items-center gap-3 font-semibold tracking-tight"><span className="rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 p-2.5 text-white shadow-md shadow-teal-900/15"><Map className="h-5 w-5" /></span>GeoLedger</Link>
        <Link to={user ? home : '/login'}><Button className="rounded-xl bg-[#0F766E] shadow-sm shadow-teal-900/15 hover:bg-[#115E59]">{user ? 'Open dashboard' : 'Sign in'}</Button></Link>
      </header>
      <section className="relative isolate mx-auto max-w-7xl overflow-hidden px-5 py-20 text-center sm:py-28">
        <div className="pointer-events-none absolute inset-x-1/4 top-4 -z-10 h-72 rounded-full bg-teal-200/35 blur-3xl" />
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0F766E] shadow-sm"><ShieldCheck className="h-4 w-4" />Transparent property records</p>
        <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-6xl">Secure land records, reviewed by people and traceable on-chain.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#64748B]">Submit property applications, upload required evidence, and track Admin review and blockchain registration in one place.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={user ? home : '/login'}><Button size="lg" className="rounded-xl bg-[#0F766E] shadow-lg shadow-teal-900/15 hover:bg-[#115E59]">{user ? 'Go to dashboard' : 'Create a user account'}</Button></Link>
          <Link to="/admin/login"><Button size="lg" variant="outline" className="rounded-xl border-slate-300 bg-white/75">Admin sign in</Button></Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-20 md:grid-cols-3">
        {[
          { icon: ShieldCheck, title: 'Human-reviewed evidence', text: 'File integrity checks are distinct from Admin review and legal authenticity.' },
          { icon: FileCheck2, title: 'Traceable applications', text: 'Follow required documents and application status from submission through approval.' },
          { icon: Map, title: 'Property records', text: 'View property details, GIS references, and a public verification page.' },
        ].map(({ icon: Icon, title, text }) => <Card key={title} className="rounded-2xl bg-white/90">
          <CardHeader><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50"><Icon className="h-6 w-6 text-[#0F766E]" /></span><CardTitle className="mt-3">{title}</CardTitle></CardHeader>
          <CardContent className="text-sm text-[#64748B]">{text}</CardContent>
        </Card>)}
      </section>
      <footer className="border-t bg-white py-6 text-center text-xs text-[#64748B]">GeoLedger is a registry workflow prototype; a blockchain hash does not establish legal title or document authenticity.</footer>
    </main>
  );
}
