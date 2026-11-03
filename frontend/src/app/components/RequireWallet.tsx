import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useAuth } from '../context/useAuth';

export function RequireWallet({ children, role }: { children: React.ReactNode; role?: 'user' | 'admin' }) {
  const location = useLocation();
  const { user, hasChecked } = useAuth();

  if (!hasChecked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#64748B]">
          <Loader2 className="w-5 h-5 animate-spin text-[#0F766E]" />
          Checking your session…
        </div>
      </div>
    );
  }

  if (!user || (role && user.role !== role)) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
