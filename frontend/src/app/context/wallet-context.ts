import { createContext } from 'react';

export type WalletContextValue = {
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

export const WalletContext = createContext<WalletContextValue | undefined>(undefined);
