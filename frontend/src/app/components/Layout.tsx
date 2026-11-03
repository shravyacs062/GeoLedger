import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Button } from './ui/button';
import { useWallet } from '../context/WalletContext';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function Layout({ children, showSidebar = true }: LayoutProps) {
  const { isConnected, isLocalNetwork, chainName, switchToLocal } = useWallet();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
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
        {isConnected && !isLocalNetwork && (
          <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-4 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-2 flex-1">
              <AlertTriangle className="w-4 h-4 text-[#D97706] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#92400E]">
                MetaMask is on <span className="font-medium">{chainName}</span>. Switch to Hardhat Localhost
                (chain 31337) so title registration can reach the local node.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-[#0F766E] hover:bg-[#0F766E]/90"
              onClick={() => void switchToLocal()}
            >
              Switch network
            </Button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
