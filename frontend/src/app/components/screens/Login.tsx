import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Map, Wallet, Shield, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useWallet } from '../../context/WalletContext';
import { shortenAddress } from '../../../services/wallet';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { connect, isConnecting, error, hasMetaMask, isConnected, address, hasChecked } = useWallet();
  const [localError, setLocalError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  useEffect(() => {
    if (hasChecked && isConnected) {
      navigate(from, { replace: true });
    }
  }, [from, hasChecked, isConnected, navigate]);

  const handleConnect = async () => {
    setLocalError(null);
    if (!hasMetaMask) {
      window.open('https://metamask.io/download/', '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      await connect();
      navigate(from, { replace: true });
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0F766E] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Map className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">GeoLedger</h1>
          <p className="text-[#64748B]">Secure Land Registry</p>
        </div>

        <Card className="border-[#E2E8F0] shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#0F172A]">Connect MetaMask</CardTitle>
            <CardDescription className="text-[#64748B]">
              Approve the connection in your MetaMask extension. GeoLedger uses your wallet address as your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-[#0F766E] hover:bg-[#0F766E]/90 h-14"
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <Wallet className="w-5 h-5 mr-3" />
              )}
              {hasMetaMask ? (isConnecting ? 'Waiting for MetaMask…' : 'Connect with MetaMask') : 'Install MetaMask'}
            </Button>

            {!hasMetaMask && (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-[#0F766E] hover:underline"
              >
                Get MetaMask for Chrome, Firefox, or Brave
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {isConnected && address && (
              <p className="text-center text-sm text-[#16A34A] font-mono">
                Connected {shortenAddress(address)}
              </p>
            )}

            {displayError && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#991B1B]">{displayError}</p>
              </div>
            )}

            <div className="bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-lg p-4 flex gap-3">
              <Shield className="w-5 h-5 text-[#38BDF8] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#0F172A]">What MetaMask will ask</p>
                <p className="text-xs text-[#64748B] mt-1">
                  Connect this site, then add or switch to Hardhat Localhost (chain 31337, RPC http://127.0.0.1:8545)
                  so on-chain registration can reach your local node.
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-[#64748B] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#64748B]">
                For local demos, import a Hardhat account into MetaMask (account #0 is the default registrar).
                Your private key never leaves the extension.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-[#64748B] hover:text-[#0F766E]">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
