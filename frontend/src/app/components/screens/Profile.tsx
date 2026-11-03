import { useState } from 'react';
import { Mail, User, Wallet } from 'lucide-react';

import { api } from '../../../services/api';
import { shortenAddress, signWalletMessage } from '../../../services/wallet';
import { useAuth } from '../../context/useAuth';
import { useWallet } from '../../context/useWallet';
import { Layout } from '../Layout';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function Profile() {
  const { user, refresh } = useAuth();
  const { address, chainName, connect, hasMetaMask, isConnecting, error: walletError } = useWallet();
  const [name, setName] = useState(user?.name || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const saveName = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.auth.updateProfile({ name });
      await refresh();
      setMessage('Profile updated.');
    } catch (reason) {
      setError((reason as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to save profile.');
    } finally {
      setBusy(false);
    }
  };

  const linkWallet = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const walletAddress = address || await connect();
      const challenge = await api.auth.walletChallenge(walletAddress);
      const signature = await signWalletMessage(walletAddress, challenge.message);
      await api.auth.updateProfile({ wallet_address: walletAddress, signature });
      await refresh();
      setMessage('Wallet ownership verified and linked.');
    } catch (reason) {
      setError((reason as { response?: { data?: { message?: string } } })?.response?.data?.message || (reason as Error).message || 'Unable to verify wallet ownership.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <main className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
        <header><h1 className="text-3xl font-semibold">Profile settings</h1><p className="mt-1 text-sm text-[#64748B]">Manage your account and prove control of a wallet.</p></header>
        {(error || walletError || message) && <p role={error || walletError ? 'alert' : 'status'} className={`rounded-md p-3 text-sm ${error || walletError ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>{error || walletError || message}</p>}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Account</CardTitle><CardDescription>Role: {user?.role}</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div><Label htmlFor="profile-name">Name</Label><Input id="profile-name" className="mt-1" value={name} onChange={(event) => setName(event.target.value)} minLength={2} /></div>
            <div><Label>Email</Label><div className="mt-1 flex items-center gap-2 rounded-md border bg-slate-50 p-2 text-sm"><Mail className="h-4 w-4 text-slate-500" />{user?.email}</div></div>
            <Button onClick={() => void saveName()} disabled={busy || name.trim().length < 2}>Save name</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Wallet</CardTitle><CardDescription>Prove wallet ownership by signing a one-time message. No transaction or gas fee is required.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div><p className="text-xs text-[#64748B]">Linked wallet</p><p className="break-all font-mono text-sm">{user?.wallet_address || 'No wallet linked'}</p></div>
            {address && <p className="text-xs text-[#64748B]">Connected wallet: {shortenAddress(address)} · {chainName}</p>}
            {!hasMetaMask && <p className="text-sm text-[#64748B]">Install MetaMask to link a wallet.</p>}
            <Button variant="outline" onClick={() => void linkWallet()} disabled={busy || isConnecting || !hasMetaMask}>
              <Wallet className="mr-2 h-4 w-4" />{user?.wallet_address ? 'Verify and update wallet' : 'Connect and verify wallet'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </Layout>
  );
}
