import { BrowserProvider, formatEther, type Eip1193Provider } from 'ethers';

export const LOCAL_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 31337);
export const LOCAL_RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';
export const LOCAL_CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME || 'Hardhat Localhost';

const SESSION_KEY = 'geoledger.wallet.connected';

export function getEthereum(): EthereumProvider | undefined {
  const eth = window.ethereum;
  if (!eth) return undefined;
  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    return eth.providers.find((provider) => provider.isMetaMask) || eth.providers[0];
  }
  return eth;
}

export function isMetaMaskInstalled(): boolean {
  return Boolean(getEthereum());
}

export function shortenAddress(address: string | null | undefined): string {
  if (!address) return '';
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function sameAddress(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

export function chainLabel(chainId: number | null): string {
  switch (chainId) {
    case 1:
      return 'Ethereum Mainnet';
    case 11155111:
      return 'Sepolia';
    case 137:
      return 'Polygon';
    case 31337:
      return 'Hardhat Localhost';
    default:
      return chainId ? `Chain ${chainId}` : 'Not connected';
  }
}

export function formatWalletError(err: unknown): string {
  const error = err as { code?: number; message?: string };
  if (error?.code === 4001) {
    return 'Connection request was rejected in MetaMask.';
  }
  if (error?.code === -32002) {
    return 'A MetaMask popup is already open. Open the extension and approve it.';
  }
  if (error?.code === 4902) {
    return 'Hardhat Localhost is not in MetaMask yet. Approve adding the network.';
  }
  return error?.message || 'Failed to connect wallet.';
}

export async function requestAccounts(): Promise<string> {
  const ethereum = getEthereum();
  if (!ethereum) {
    throw new Error('MetaMask is not installed. Install it from metamask.io and refresh this page.');
  }
  const accounts = (await ethereum.request({ method: 'eth_requestAccounts' })) as string[];
  if (!accounts?.length) {
    throw new Error('No account was returned from MetaMask.');
  }
  return accounts[0];
}

export async function getAccounts(): Promise<string[]> {
  const ethereum = getEthereum();
  if (!ethereum) return [];
  return (await ethereum.request({ method: 'eth_accounts' })) as string[];
}

export async function getChainId(): Promise<number> {
  const ethereum = getEthereum();
  if (!ethereum) {
    throw new Error('MetaMask is not installed.');
  }
  const hex = (await ethereum.request({ method: 'eth_chainId' })) as string;
  return Number.parseInt(hex, 16);
}

export async function switchToLocalNetwork(): Promise<void> {
  const ethereum = getEthereum();
  if (!ethereum) {
    throw new Error('MetaMask is not installed.');
  }

  const chainIdHex = `0x${LOCAL_CHAIN_ID.toString(16)}`;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (err) {
    const error = err as { code?: number; data?: { originalError?: { code?: number } } };
    const missing = error?.code === 4902 || error?.data?.originalError?.code === 4902;
    if (!missing) throw err;

    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: chainIdHex,
          chainName: LOCAL_CHAIN_NAME,
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: [LOCAL_RPC_URL],
        },
      ],
    });
  }
}

export async function getBalanceEth(address: string): Promise<string> {
  const ethereum = getEthereum();
  if (!ethereum) return '0';
  const provider = new BrowserProvider(ethereum as Eip1193Provider);
  const balance = await provider.getBalance(address);
  const formatted = Number(formatEther(balance));
  if (!Number.isFinite(formatted)) return formatEther(balance);
  return formatted.toFixed(4);
}

export async function revokeWalletPermissions(): Promise<void> {
  const ethereum = getEthereum();
  if (!ethereum) return;
  try {
    await ethereum.request({
      method: 'wallet_revokePermissions',
      params: [{ eth_accounts: {} }],
    });
  } catch {
    // Older MetaMask builds do not support revoke.
  }
}

export const walletSession = {
  markConnected() {
    localStorage.setItem(SESSION_KEY, '1');
  },
  clear() {
    localStorage.removeItem(SESSION_KEY);
  },
  wasConnected() {
    return localStorage.getItem(SESSION_KEY) === '1';
  },
};
