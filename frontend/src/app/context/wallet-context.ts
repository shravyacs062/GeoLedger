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
  isTargetNetwork: boolean;
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
  switchToTarget: () => Promise<void>;
};

export const WalletContext = createContext<WalletContextValue | undefined>(undefined);
