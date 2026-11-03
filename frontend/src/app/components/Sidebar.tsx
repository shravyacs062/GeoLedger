import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Building2,
  Search,
  FileText,
  ClipboardList,
  Shield,
  ArrowLeftRight,
  Map,
  Bell,
  User,
  LogOut,
  Users,
  Calculator,
  LayoutDashboard,
} from 'lucide-react';
<<<<<<< Updated upstream
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { shortenAddress } from '../../services/wallet';
import { api } from '../../services/api';
=======
import { useWallet } from '../context/useWallet';
import { shortenAddress } from '../../services/wallet';
import { useAuth } from '../context/useAuth';
>>>>>>> Stashed changes

const userNav = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Building2, label: 'My Properties', path: '/properties' },
  { icon: Search, label: 'Property Search', path: '/search' },
  { icon: FileText, label: 'Register Property', path: '/register' },
  { icon: ArrowLeftRight, label: 'Ownership Transfer', path: '/transfer' },
  { icon: Users, label: 'Inheritance Transfer', path: '/inheritance' },
  { icon: ClipboardList, label: 'Applications', path: '/applications' },
  { icon: Calculator, label: 'Land Valuation', path: '/valuation' },
  { icon: Shield, label: 'Verify Documents', path: '/verify' },
  { icon: Map, label: 'GIS Map', path: '/map' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const adminNav = [
  { icon: LayoutDashboard, label: 'Admin Dashboard', path: '/admin' },
  { icon: ClipboardList, label: 'All Applications', path: '/applications' },
  { icon: Building2, label: 'Properties', path: '/properties' },
  { icon: Shield, label: 'Document Review', path: '/verify' },
  { icon: Users, label: 'User Management', path: '/admin/users' },
  { icon: Calculator, label: 'Valuation Params', path: '/valuation' },
  { icon: ArrowLeftRight, label: 'Transactions', path: '/transactions' },
  { icon: Map, label: 'GIS Map', path: '/map' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { address, disconnect, chainName, isLocalNetwork } = useWallet();
<<<<<<< Updated upstream
  const { user, isAdmin, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = isAdmin ? adminNav : userNav;

  useEffect(() => {
    api.notifications.list()
      .then((items) => setUnreadCount((items || []).filter((n: any) => !n.is_read).length))
      .catch(() => setUnreadCount(0));
  }, [location.pathname]);
=======
  const { user, logout } = useAuth();
>>>>>>> Stashed changes

  const isItemActive = (path: string) => {
    if (path === '/dashboard' || path === '/admin') return location.pathname === path;
    if (path === '/register') return location.pathname === '/register' || location.pathname === '/applications/new';
    if (path === '/properties') return location.pathname.startsWith('/properties');
    if (path === '/applications') return location.pathname.startsWith('/applications') || location.pathname.startsWith('/admin/applications');
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0F172A] text-white flex flex-col">
      <div className="p-6 border-b border-[#334155]">
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0F766E] rounded-lg flex items-center justify-center">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-semibold">GeoLedger</h1>
            <p className="text-xs text-[#64748B]">{isAdmin ? 'Admin Portal' : 'Land Registry'}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#0F766E] text-white'
                  : 'text-[#E2E8F0] hover:bg-[#334155]'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm flex-1">{item.label}</span>
              {item.path === '/notifications' && unreadCount > 0 && (
                <span className="ml-auto text-[10px] font-semibold bg-[#F59E0B] text-white rounded-full min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#334155] space-y-2">
        <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#334155]">
          <div className="w-10 h-10 bg-[#334155] rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
<<<<<<< Updated upstream
            <p className="text-sm font-medium truncate">{user?.full_name || user?.email || 'Account'}</p>
            <p className={`text-xs truncate ${isLocalNetwork ? 'text-[#5EEAD4]' : 'text-[#FBBF24]'}`}>
              {address ? shortenAddress(address) : chainName}
            </p>
=======
            <p className="text-sm font-medium truncate">{user?.name || 'Account'}</p>
            <p className="text-xs truncate text-[#94A3B8]">{user?.email}</p>
            {address && <p className={`text-xs truncate ${isLocalNetwork ? 'text-[#5EEAD4]' : 'text-[#FBBF24]'}`}>
              {shortenAddress(address)} · {chainName}
            </p>}
>>>>>>> Stashed changes
          </div>
        </Link>
        <button
          type="button"
          onClick={async () => {
<<<<<<< Updated upstream
            await disconnect();
            await logout();
            navigate(isAdmin ? '/admin/login' : '/login');
=======
            await logout();
            await disconnect().catch(() => undefined);
            navigate('/login');
>>>>>>> Stashed changes
          }}
          className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-[#E2E8F0] hover:bg-[#334155]"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
