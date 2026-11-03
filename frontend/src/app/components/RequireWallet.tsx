import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useWallet } from '../context/WalletContext';

export function RequireWallet({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isConnected, hasChecked } = useWallet();

  if (!hasChecked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#64748B]">
          <Loader2 className="w-5 h-5 animate-spin text-[#0F766E]" />
          Checking MetaMask session…
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
