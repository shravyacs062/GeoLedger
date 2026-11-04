import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight, Bell, Building2, Calculator, ChevronDown, ClipboardList, FileText,
  Home, LogOut, Map, Search, ShieldCheck, User, Users,
} from 'lucide-react';
import { useState } from 'react';

import { shortenAddress } from '../../services/wallet';
import { useAuth } from '../context/useAuth';
import { useWallet } from '../context/useWallet';

const userItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Building2, label: 'My Properties', path: '/properties' },
  { icon: ClipboardList, label: 'Applications', path: '/applications' },
  { icon: Search, label: 'Property Search', path: '/search' },
];

const adminItems = [
  { icon: Home, label: 'Admin Dashboard', path: '/admin' },
  { icon: ClipboardList, label: 'Applications', path: '/applications' },
  { icon: Building2, label: 'Properties', path: '/properties' },
  { icon: ShieldCheck, label: 'Document Review', path: '/verify' },
];

const userMoreItems = [
  { icon: FileText, label: 'Register Property', path: '/register' },
  { icon: ArrowLeftRight, label: 'Ownership Transfer', path: '/transfer' },
  { icon: Users, label: 'Inheritance Transfer', path: '/inheritance' },
  { icon: Calculator, label: 'Land Valuation', path: '/valuation' },
  { icon: ShieldCheck, label: 'Verify Documents', path: '/verify' },
  { icon: Map, label: 'GIS Map', path: '/map' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
];

const adminMoreItems = [
  { icon: Users, label: 'User Management', path: '/admin/users' },
  { icon: Calculator, label: 'Valuation Parameters', path: '/valuation' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { address, chainName, disconnect } = useWallet();
  const admin = user?.role === 'admin';
  const items = admin ? adminItems : userItems;
  const moreItems = admin ? adminMoreItems : userMoreItems;
  const [moreOpenState, setMoreOpenState] = useState<{ pathname: string; open: boolean } | null>(null);

  const active = (path: string) => {
    if (path === '/admin' || path === '/dashboard') return location.pathname === path;
    if (path === '/register') return location.pathname === '/register' || location.pathname === '/applications/new';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const moreOpen = moreOpenState?.pathname === location.pathname
    ? moreOpenState.open
    : moreItems.some(({ path }) => active(path));

  const signOut = async () => {
    await logout();
    await disconnect();
    navigate(admin ? '/admin/login' : '/login');
  };

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-gradient-to-b from-[#111d32] via-[#0F172A] to-[#101827] text-white shadow-[8px_0_30px_rgba(15,23,42,0.08)]">
      <div className="border-b border-white/10 px-6 py-7">
        <Link to={admin ? '/admin' : '/dashboard'} className="flex items-center gap-3">
          <span className="rounded-xl bg-gradient-to-br from-teal-400 to-teal-700 p-2.5 shadow-lg shadow-teal-950/30"><Map className="h-5 w-5" /></span>
          <span><span className="block font-semibold tracking-tight">GeoLedger</span><span className="text-xs text-[#94A3B8]">{admin ? 'Admin Portal' : 'Land Registry'}</span></span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
        {items.map(({ icon: Icon, label, path }) => (
          <Link key={path} to={path} onClick={() => setMoreOpenState({ pathname: location.pathname, open: false })} className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 ${active(path) ? 'bg-teal-700/90 text-white shadow-md shadow-black/10 ring-1 ring-white/10' : 'text-[#CBD5E1] hover:bg-white/[0.07] hover:text-white'}`}>
            <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${active(path) ? 'text-teal-100' : 'text-slate-400 group-hover:text-teal-200'}`} />{label}
          </Link>
        ))}
        <details open={moreOpen} className="pt-2">
          <summary
            onClick={(event) => {
              event.preventDefault();
              setMoreOpenState({ pathname: location.pathname, open: !moreOpen });
            }}
            className="flex cursor-pointer list-none items-center justify-between rounded-xl px-4 py-2.5 text-sm text-[#CBD5E1] hover:bg-white/[0.07] hover:text-white"
          >
            More
            <ChevronDown className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
          </summary>
          <div className="mt-1 space-y-1">
            {moreItems.map(({ icon: Icon, label, path }) => (
              <Link key={path} to={path} onClick={() => setMoreOpenState({ pathname: location.pathname, open: true })} className={`group flex items-center gap-3 rounded-xl px-4 py-2 text-sm transition-colors ${active(path) ? 'bg-teal-700/90 text-white' : 'text-[#CBD5E1] hover:bg-white/[0.07] hover:text-white'}`}>
                <Icon className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-teal-200" />{label}
              </Link>
            ))}
          </div>
        </details>
      </nav>
      <div className="space-y-2 border-t border-white/10 p-4">
        <Link to="/profile" className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.07]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10"><User className="h-5 w-5" /></span>
          <span className="min-w-0"><span className="block truncate text-sm font-medium">{user?.name || user?.email || 'Account'}</span>
            <span className="block truncate text-xs text-[#94A3B8]">{address ? `${shortenAddress(address)} · ${chainName}` : user?.email}</span></span>
        </Link>
        <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-[#CBD5E1] transition-colors hover:bg-white/[0.07] hover:text-white">
          <LogOut className="h-4 w-4" />Sign out
        </button>
      </div>
    </aside>
  );
}
