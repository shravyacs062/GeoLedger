import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronUp, FileText, Home, LayoutDashboard, LogOut, MoreHorizontal, Search, User } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '../context/useAuth';
import { useWallet } from '../context/useWallet';

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { disconnect } = useWallet();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = user?.role === 'admin'
    ? [
      { icon: LayoutDashboard, label: 'Admin', path: '/admin' },
      { icon: FileText, label: 'Applications', path: '/applications' },
      { icon: User, label: 'Users', path: '/admin/users' },
      { icon: Bell, label: 'Alerts', path: '/notifications' },
    ]
    : [
      { icon: Home, label: 'Home', path: '/dashboard' },
      { icon: FileText, label: 'Applications', path: '/applications' },
      { icon: Search, label: 'Search', path: '/search' },
      { icon: Bell, label: 'Alerts', path: '/notifications' },
    ];
  const moreItems = user?.role === 'admin'
    ? [
      { label: 'Properties', path: '/properties' },
      { label: 'Document Review', path: '/verify' },
      { label: 'Valuation Parameters', path: '/valuation' },
      { label: 'Profile', path: '/profile' },
    ]
    : [
      { label: 'My Properties', path: '/properties' },
      { label: 'Register Property', path: '/register' },
      { label: 'Ownership Transfer', path: '/transfer' },
      { label: 'Inheritance Transfer', path: '/inheritance' },
      { label: 'Land Valuation', path: '/valuation' },
      { label: 'Verify Documents', path: '/verify' },
      { label: 'GIS Map', path: '/map' },
      { label: 'Profile', path: '/profile' },
    ];

  const signOut = async () => {
    await logout();
    await disconnect();
    navigate(user?.role === 'admin' ? '/admin/login' : '/login');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E2E8F0]/80 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      {moreOpen && (
        <div className="absolute bottom-16 right-2 max-h-[60vh] w-56 overflow-y-auto rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-xl">
          {moreItems.map(({ label, path }) => (
            <Link key={path} to={path} onClick={() => setMoreOpen(false)} className={`block rounded-lg px-3 py-2.5 text-sm ${location.pathname === path || location.pathname.startsWith(`${path}/`) ? 'bg-teal-50 font-medium text-[#0F766E]' : 'text-[#334155] hover:bg-slate-50'}`}>
              {label}
            </Link>
          ))}
          <button type="button" onClick={() => void signOut()} className="mt-1 flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm text-[#64748B]">
            <LogOut className="h-4 w-4" />Sign out
          </button>
        </div>
      )}
      <div className="flex h-16 items-center justify-around">
        {items.map(({ icon: Icon, label, path }) => (
          <Link key={path} to={path} onClick={() => setMoreOpen(false)} className={`flex flex-col items-center gap-1 px-2 py-2 ${location.pathname === path ? 'text-[#0F766E]' : 'text-[#64748B]'}`}>
            <Icon className="h-5 w-5" /><span className="text-xs">{label}</span>
          </Link>
        ))}
        <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)} className={`flex flex-col items-center gap-1 px-2 py-2 ${moreOpen ? 'text-[#0F766E]' : 'text-[#64748B]'}`}>
          {moreOpen ? <ChevronUp className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}<span className="text-xs">More</span>
        </button>
      </div>
    </nav>
  );
}
