import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api } from '../../services/api';
import {
  LOCAL_CHAIN_ID,
  chainLabel,
  formatWalletError,
  getAccounts,
  getBalanceEth,
  getChainId,
  getEthereum,
  isMetaMaskInstalled,
  requestAccounts,
  revokeWalletPermissions,
  switchToLocalNetwork,
  walletSession,
} from '../../services/wallet';

type WalletContextValue = {
  address: string | null;
  chainId: number | null;
  chainName: string;
  balanceEth: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  hasChecked: boolean;
  error: string | null;
  hasMetaMask: boolean;
  isLocalNetwork: boolean;
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
  switchToLocal: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balanceEth, setBalanceEth] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);

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
      try {
        await switchToLocalNetwork();
      } catch (networkError) {
        console.warn('Could not switch MetaMask to Hardhat Localhost', networkError);
      }
      await refresh(nextAddress);
      walletSession.markConnected();
      void api.auth.register(nextAddress);
      return nextAddress;
    } catch (err) {
      const message = formatWalletError(err);
      setError(message);
      throw new Error(message);
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

  const switchToLocal = useCallback(async () => {
    setError(null);
    try {
      await switchToLocalNetwork();
      if (address) {
        await refresh(address);
      } else {
        setChainId(await getChainId());
      }
    } catch (err) {
      const message = formatWalletError(err);
      setError(message);
      throw new Error(message);
    }
  }, [address, refresh]);

  useEffect(() => {
    setHasMetaMask(isMetaMaskInstalled());

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
      void api.auth.register(accounts[0]);
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
      isLocalNetwork: chainId === LOCAL_CHAIN_ID,
      connect,
      disconnect,
      switchToLocal,
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
      switchToLocal,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used inside WalletProvider');
  }
  return context;
}
