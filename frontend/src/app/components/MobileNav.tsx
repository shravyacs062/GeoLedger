import { Link, useLocation } from 'react-router-dom';
<<<<<<< Updated upstream
import { Home, Search, FileText, Bell, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function MobileNav() {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const navItems = isAdmin
    ? [
        { icon: LayoutDashboard, label: 'Admin', path: '/admin' },
        { icon: FileText, label: 'Apps', path: '/applications' },
        { icon: Search, label: 'Search', path: '/search' },
        { icon: Bell, label: 'Alerts', path: '/notifications' },
        { icon: User, label: 'Profile', path: '/profile' },
      ]
    : [
        { icon: Home, label: 'Home', path: '/dashboard' },
        { icon: Search, label: 'Search', path: '/search' },
        { icon: FileText, label: 'Register', path: '/register' },
        { icon: Bell, label: 'Alerts', path: '/notifications' },
        { icon: User, label: 'Profile', path: '/profile' },
      ];
=======
import { Home, Search, FileText, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/useAuth';

const navItems = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: FileText, label: 'Register', path: '/register' },
  { icon: Bell, label: 'Alerts', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function MobileNav() {
  const location = useLocation();
  const { logout } = useAuth();
>>>>>>> Stashed changes

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 ${
                isActive ? 'text-[#0F766E]' : 'text-[#64748B]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => void logout().then(() => { window.location.href = '/login'; })}
          className="flex flex-col items-center gap-1 px-3 py-2 text-[#64748B]"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs">Sign out</span>
        </button>
      </div>
    </nav>
  );
}
