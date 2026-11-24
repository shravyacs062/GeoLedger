import { Link, Navigate, useLocation } from 'react-router-dom';
import { Loader2, Wallet } from 'lucide-react';

import { useAuth } from '../context/useAuth';
import { useWallet } from '../context/useWallet';
import { Button } from './ui/button';
import { sameAddress } from '../../services/wallet';

export function RequireWallet({ children, role }: { children: React.ReactNode; role?: 'user' | 'admin' }) {
  const location = useLocation();
  const { user, hasChecked } = useAuth();
  const { address } = useWallet();

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

  // Administrators retain their separate portal flow. User-facing registry
  // actions require a verified, currently connected MetaMask account.
  const walletReady = user.role === 'admin' || Boolean(
    user.wallet_address && address && sameAddress(user.wallet_address, address),
  );
  if (!walletReady && location.pathname !== '/profile') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-[#0F766E]"><Wallet className="h-6 w-6" /></span>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Link MetaMask to continue</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Connect the wallet you control and sign the one-time verification message. This protects property registration and transfer actions.</p>
          <Button asChild className="mt-5 bg-[#0F766E]"><Link to="/profile">Connect and verify wallet</Link></Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
