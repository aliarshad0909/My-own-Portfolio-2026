/**
 * EIP-1193 wallet connection.
 *
 * Read-only: this asks for the account list and the chain id and nothing else.
 * It never requests a signature, never submits a transaction and never asks
 * for a private key or seed phrase — a block explorer has no business doing
 * any of those things.
 *
 * If no injected provider exists, that is reported as a fact rather than
 * papered over with a fake "connected" state.
 */

export type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, handler: (...args: never[]) => void): void;
  removeListener?(event: string, handler: (...args: never[]) => void): void;
  isMetaMask?: boolean;
};

export type WalletState =
  | { status: "unsupported"; reason: string }
  | { status: "available" }
  | { status: "connecting" }
  | { status: "connected"; accounts: string[]; chainId: number }
  | { status: "rejected"; reason: string }
  | { status: "error"; reason: string };

/** EIP-1193 error codes a wallet actually returns. */
export const WALLET_ERRORS: Record<number, string> = {
  4001: "You rejected the connection request in your wallet.",
  4100: "The wallet has not authorised this account.",
  4200: "Your wallet does not support this request.",
  4900: "Your wallet is disconnected from all chains.",
  4901: "Your wallet is not connected to the requested chain.",
  "-32002": "A connection request is already open — check your wallet window.",
} as unknown as Record<number, string>;

export function detectProvider(root: { ethereum?: Eip1193Provider } = globalThis as never): Eip1193Provider | null {
  const provider = root?.ethereum;
  return provider && typeof provider.request === "function" ? provider : null;
}

export function describeAbsence(): string {
  return "No EIP-1193 wallet is injected into this page. Install a browser wallet such as MetaMask, Rabby or Frame, then reload.";
}

export function walletErrorMessage(err: unknown): string {
  const code = (err as { code?: number })?.code;
  if (code !== undefined && WALLET_ERRORS[code]) return WALLET_ERRORS[code];
  const message = (err as { message?: string })?.message;
  return message ? `The wallet returned: ${message}` : "The wallet returned an error with no message.";
}

export async function connect(provider: Eip1193Provider): Promise<WalletState> {
  try {
    const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return { status: "error", reason: "The wallet returned no accounts." };
    }
    const chainIdHex = (await provider.request({ method: "eth_chainId" })) as string;
    const chainId = Number.parseInt(String(chainIdHex), 16);
    if (!Number.isFinite(chainId)) return { status: "error", reason: `The wallet reported an unreadable chain id: ${chainIdHex}` };
    return { status: "connected", accounts, chainId };
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code === 4001) return { status: "rejected", reason: WALLET_ERRORS[4001] };
    return { status: "error", reason: walletErrorMessage(err) };
  }
}

/** Already-authorised accounts, without prompting. Returns [] when none. */
export async function silentAccounts(provider: Eip1193Provider): Promise<string[]> {
  try {
    const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum mainnet",
  10: "OP Mainnet",
  137: "Polygon",
  8453: "Base",
  11155111: "Sepolia testnet",
  17000: "Holesky testnet",
  84532: "Base Sepolia testnet",
};

export const chainName = (id: number): string => CHAIN_NAMES[id] ?? `Chain ${id}`;

export const isTestnet = (id: number): boolean => [11155111, 17000, 84532, 5, 80002].includes(id);
