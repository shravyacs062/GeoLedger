import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { User, Wallet, Mail, Phone, Loader2, AlertCircle } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { shortenAddress } from '../../../services/wallet';

export function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, logout, isAdmin } = useAuth();
  const {
    address,
    chainName,
    balanceEth,
    isLocalNetwork,
    isConnected,
    connect,
    disconnect,
    switchToLocal,
  } = useWallet();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [walletAddress, setWalletAddress] = useState(user?.wallet_address || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(user?.full_name || '');
    setPhone(user?.phone || '');
    setWalletAddress(user?.wallet_address || address || '');
  }, [user, address]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile({
        full_name: fullName,
        phone,
        wallet_address: walletAddress || undefined,
      });
      setMessage('Profile saved successfully');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">Profile Settings</h1>
          <p className="text-[#64748B]">Manage your account information and linked wallet</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="text-[#0F172A]">Account Information</CardTitle>
                <CardDescription className="text-[#64748B]">
                  Role: {user?.role || 'USER'}{isAdmin ? ' (Administrator)' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-[#0F766E]/10 rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-[#0F766E]" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2 border-[#E2E8F0]" />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                    <Input id="email" type="email" value={user?.email || ''} disabled className="pl-10 border-[#E2E8F0] bg-[#F8FAFC]" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 border-[#E2E8F0]" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="wallet">Linked Wallet Address</Label>
                  <Input
                    id="wallet"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="mt-2 border-[#E2E8F0] font-mono text-sm"
                  />
                </div>

                {error && (
                  <div className="flex gap-2 text-sm text-[#991B1B]">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
                {message && <p className="text-sm text-[#16A34A]">{message}</p>}

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSave} disabled={saving} className="bg-[#0F766E] hover:bg-[#0F766E]/90">
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#E2E8F0]"
                    onClick={() => {
                      setFullName(user?.full_name || '');
                      setPhone(user?.phone || '');
                      setWalletAddress(user?.wallet_address || '');
                      setMessage(null);
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="text-[#0F172A]">MetaMask Wallet</CardTitle>
                <CardDescription className="text-[#64748B]">Connect for on-chain ownership identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-[#F8FAFC] rounded-lg p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#0F766E] rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0F172A]">
                      {isConnected && address ? shortenAddress(address) : 'Not connected'}
                    </p>
                    <p className={`text-sm ${isLocalNetwork ? 'text-[#0F766E]' : 'text-[#B45309]'}`}>
                      {chainName}{balanceEth ? ` · ${Number(balanceEth).toFixed(4)} ETH` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isConnected ? (
                    <Button onClick={() => connect()} className="bg-[#0F766E] hover:bg-[#0F766E]/90">
                      Connect MetaMask
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => disconnect()}>Disconnect Wallet</Button>
                  )}
                  <Button variant="outline" onClick={() => switchToLocal()}>Switch to Hardhat</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle>Session</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600"
                  onClick={async () => {
                    await disconnect();
                    await logout();
                    navigate(isAdmin ? '/admin/login' : '/login');
                  }}
                >
                  Log out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
