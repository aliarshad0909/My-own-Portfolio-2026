/**
 * A JSON-RPC 2.0 client for EVM nodes.
 *
 * The transport is injected so the client can be tested without a network and
 * so the UI can run against fixtures. Every failure mode an explorer actually
 * meets is mapped to a typed result rather than a thrown string: a node that
 * is unreachable, a node that returns an RPC error, a node that returns
 * nonsense, and a request that times out all look different to the caller,
 * because the user needs to be told which one happened.
 */

export type RpcRequest = { jsonrpc: "2.0"; id: number; method: string; params: unknown[] };

export type Transport = (body: RpcRequest[], signal: AbortSignal) => Promise<unknown>;

export type RpcFailure =
  | { kind: "unreachable"; detail: string }
  | { kind: "timeout"; detail: string }
  | { kind: "rpc-error"; code: number; detail: string }
  | { kind: "malformed"; detail: string }
  | { kind: "not-found"; detail: string };

export type RpcResult<T> = { ok: true; value: T } | { ok: false; error: RpcFailure };

export const NETWORKS = [
  { id: "sepolia", label: "Sepolia", chainId: 11155111, url: "https://rpc.sepolia.org", currency: "SepoliaETH", explorer: "https://sepolia.etherscan.io" },
  { id: "holesky", label: "Holesky", chainId: 17000, url: "https://ethereum-holesky-rpc.publicnode.com", currency: "HoleskyETH", explorer: "https://holesky.etherscan.io" },
  { id: "base-sepolia", label: "Base Sepolia", chainId: 84532, url: "https://sepolia.base.org", currency: "ETH", explorer: "https://sepolia.basescan.org" },
] as const;

export type NetworkId = (typeof NETWORKS)[number]["id"];

export const networkById = (id: string) => NETWORKS.find((n) => n.id === id);

/** The default transport: a real HTTP POST. */
export function httpTransport(url: string): Transport {
  return async (body, signal) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    return response.json();
  };
}

export class RpcClient {
  #transport: Transport;
  #timeoutMs: number;
  #nextId = 1;
  /** Every call made, for the request log the UI shows. */
  readonly log: { method: string; params: unknown[]; at: number; outcome: string; ms: number }[] = [];

  constructor(transport: Transport, timeoutMs = 8000) {
    this.#transport = transport;
    this.#timeoutMs = timeoutMs;
  }

  async call<T>(method: string, params: unknown[] = []): Promise<RpcResult<T>> {
    const started = Date.now();
    const request: RpcRequest = { jsonrpc: "2.0", id: this.#nextId++, method, params };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.#timeoutMs);

    const record = (outcome: string) => {
      this.log.unshift({ method, params, at: started, outcome, ms: Date.now() - started });
      if (this.log.length > 25) this.log.length = 25;
    };

    let raw: unknown;
    try {
      raw = await this.#transport([request], controller.signal);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const timedOut = controller.signal.aborted || /abort/i.test(message);
      record(timedOut ? "timeout" : "unreachable");
      return {
        ok: false,
        error: timedOut
          ? { kind: "timeout", detail: `No response within ${this.#timeoutMs}ms.` }
          : { kind: "unreachable", detail: message },
      };
    } finally {
      clearTimeout(timer);
    }

    const envelope = Array.isArray(raw) ? raw[0] : raw;
    if (!envelope || typeof envelope !== "object") {
      record("malformed");
      return { ok: false, error: { kind: "malformed", detail: "The node did not return a JSON-RPC object." } };
    }

    const body = envelope as { error?: { code?: number; message?: string }; result?: unknown };
    if (body.error) {
      record(`rpc-error ${body.error.code ?? "?"}`);
      return { ok: false, error: { kind: "rpc-error", code: body.error.code ?? 0, detail: body.error.message ?? "Unspecified RPC error." } };
    }
    if (body.result === undefined) {
      record("malformed");
      return { ok: false, error: { kind: "malformed", detail: "The response carried neither a result nor an error." } };
    }
    if (body.result === null) {
      record("not-found");
      return { ok: false, error: { kind: "not-found", detail: "The node returned null — that item does not exist on this chain." } };
    }

    record("ok");
    return { ok: true, value: body.result as T };
  }

  chainId = () => this.call<string>("eth_chainId");
  blockNumber = () => this.call<string>("eth_blockNumber");
  getBalance = (address: string, block = "latest") => this.call<string>("eth_getBalance", [address, block]);
  getTransactionCount = (address: string, block = "latest") => this.call<string>("eth_getTransactionCount", [address, block]);
  getCode = (address: string, block = "latest") => this.call<string>("eth_getCode", [address, block]);
  getBlockByNumber = (block: string, withTransactions = true) => this.call<RawBlock>("eth_getBlockByNumber", [block, withTransactions]);
  getBlockByHash = (hash: string, withTransactions = true) => this.call<RawBlock>("eth_getBlockByHash", [hash, withTransactions]);
  getTransactionByHash = (hash: string) => this.call<RawTransaction>("eth_getTransactionByHash", [hash]);
  getTransactionReceipt = (hash: string) => this.call<RawReceipt>("eth_getTransactionReceipt", [hash]);
  gasPrice = () => this.call<string>("eth_gasPrice");
}

/* Shapes as the node returns them: every quantity is a hex string. */

export type RawTransaction = {
  hash: string; blockNumber: string | null; blockHash: string | null; transactionIndex: string | null;
  from: string; to: string | null; value: string; gas: string; gasPrice?: string;
  maxFeePerGas?: string; maxPriorityFeePerGas?: string; nonce: string; input: string; type?: string;
};

export type RawBlock = {
  number: string; hash: string; parentHash: string; timestamp: string;
  gasUsed: string; gasLimit: string; baseFeePerGas?: string; miner: string;
  transactions: RawTransaction[] | string[]; size?: string;
};

export type RawReceipt = {
  transactionHash: string; status: string; gasUsed: string; effectiveGasPrice?: string;
  contractAddress: string | null; logs: { address: string; topics: string[]; data: string }[];
};

export const failureMessage = (error: RpcFailure): string => {
  switch (error.kind) {
    case "unreachable": return `Could not reach the node: ${error.detail}`;
    case "timeout": return error.detail;
    case "rpc-error": return `The node refused the request (code ${error.code}): ${error.detail}`;
    case "malformed": return error.detail;
    case "not-found": return error.detail;
  }
};
