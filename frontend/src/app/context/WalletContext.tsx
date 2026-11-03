import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  TARGET_CHAIN_ID,
  chainLabel,
  formatWalletError,
  getAccounts,
  getBalanceEth,
  getChainId,
  getEthereum,
  isMetaMaskInstalled,
  requestAccounts,
  revokeWalletPermissions,
  switchToTargetNetwork,
  walletSession,
} from '../../services/wallet';
import { WalletContext, type WalletContextValue } from './wallet-context';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balanceEth, setBalanceEth] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMetaMask] = useState(() => isMetaMaskInstalled());

  const refresh = useCallback(async (nextAddress: string) => {
    setAddress(nextAddress);
    try {
      const nextChainId = await getChainId();
      setChainId(nextChainId);
    } catch {
      setChainId(null);
    }
    try {
      const balance = await getBalanceEth(nextAddress);
      setBalanceEth(balance);
    } catch {
      setBalanceEth(null);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const nextAddress = await requestAccounts();
      await refresh(nextAddress);
      walletSession.markConnected();
      return nextAddress;
    } catch (err) {
      const message = formatWalletError(err);
      setError(message);
      throw new Error(message, { cause: err });
    } finally {
      setIsConnecting(false);
      setHasChecked(true);
    }
  }, [refresh]);

  const disconnect = useCallback(async () => {
    await revokeWalletPermissions();
    walletSession.clear();
    setAddress(null);
    setChainId(null);
    setBalanceEth(null);
    setError(null);
  }, []);

  const switchToTarget = useCallback(async () => {
    setError(null);
    try {
      await switchToTargetNetwork();
      if (address) {
        await refresh(address);
      } else {
        setChainId(await getChainId());
      }
    } catch (err) {
      const message = formatWalletError(err);
      setError(message);
    }
  }, [address, refresh]);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        if (!walletSession.wasConnected()) return;
        const accounts = await getAccounts();
        if (cancelled) return;
        if (accounts[0]) {
          await refresh(accounts[0]);
        } else {
          walletSession.clear();
        }
      } catch {
        walletSession.clear();
      } finally {
        if (!cancelled) setHasChecked(true);
      }
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    const onAccountsChanged = (...args: unknown[]) => {
      const accounts = (args[0] as string[]) || [];
      if (!accounts.length) {
        walletSession.clear();
        setAddress(null);
        setChainId(null);
        setBalanceEth(null);
        return;
      }
      walletSession.markConnected();
      void refresh(accounts[0]);
    };

    const onChainChanged = () => {
      const current = address;
      if (current) {
        void refresh(current);
        return;
      }
      void getAccounts().then((accounts) => {
        if (accounts[0]) void refresh(accounts[0]);
      });
    };

    ethereum.on('accountsChanged', onAccountsChanged);
    ethereum.on('chainChanged', onChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', onAccountsChanged);
      ethereum.removeListener('chainChanged', onChainChanged);
    };
  }, [address, refresh]);

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      chainId,
      chainName: chainLabel(chainId),
      balanceEth,
      isConnecting,
      isConnected: Boolean(address),
      hasChecked,
      error,
      hasMetaMask,
      isTargetNetwork: chainId === TARGET_CHAIN_ID,
      connect,
      disconnect,
      switchToTarget,
    }),
    [
      address,
      balanceEth,
      chainId,
      connect,
      disconnect,
      error,
      hasChecked,
      hasMetaMask,
      isConnecting,
      switchToTarget,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
