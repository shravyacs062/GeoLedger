import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Button } from './ui/button';
import { useWallet } from '../context/useWallet';
import { TARGET_CHAIN_NAME } from '../../services/wallet';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function Layout({ children, showSidebar = true }: LayoutProps) {
  const { isConnected, isTargetNetwork, chainName, switchToTarget, error, hasMetaMask, isConnecting, connect } = useWallet();

  return (
    <div className="min-h-screen bg-transparent">
      {showSidebar && (
        <>
          <div className="hidden lg:block">
            <Sidebar />
          </div>
          <div className="lg:hidden">
            <MobileNav />
          </div>
        </>
      )}

      <main className={showSidebar ? "lg:pl-64 pb-20 lg:pb-0" : ""}>
        {!isConnected && (
          <div className="flex flex-col gap-2 border-b border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <span>Connect MetaMask and verify it in your profile before submitting a registration or transfer.</span>
            {hasMetaMask ? <Button size="sm" onClick={() => void connect()} disabled={isConnecting} className="bg-[#0F766E]">{isConnecting ? 'Connecting…' : 'Connect MetaMask'}</Button> : <Link to="/profile" className="font-medium underline">Install MetaMask</Link>}
          </div>
        )}
        {isConnected && !isTargetNetwork && (
          <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-4 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-2 flex-1">
              <AlertTriangle className="w-4 h-4 text-[#D97706] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#92400E]">
                MetaMask is on <span className="font-medium">{chainName}</span>. The configured title network is {TARGET_CHAIN_NAME}.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-[#0F766E] hover:bg-[#0F766E]/90"
              onClick={() => void switchToTarget()}
            >
              Switch network
            </Button>
          </div>
        )}
        {error && <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 lg:px-8">{error}</p>}
        {children}
      </main>
    </div>
  );
}
