import { keccakHex } from "../lib/keccak.ts";
import type { RawBlock, RawReceipt, RawTransaction, RpcRequest, Transport } from "../lib/rpc.ts";

/**
 * A fixture chain, and a JSON-RPC node that serves it.
 *
 * This is NOT a live network. It is a deterministic chain generated from a
 * fixed seed so the explorer has something to render when no node is
 * reachable. The node implements the same JSON-RPC envelope a real node does —
 * including returning `null` for a hash that does not exist and a `-32601`
 * error for a method it does not implement — so the client code path under
 * test is the real one, not a mock that always succeeds.
 */

const SEED = 20260411;
let state = SEED;
const rand = () => {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
};
const reset = () => { state = SEED; };

const hex = (n: bigint | number) => `0x${BigInt(n).toString(16)}`;
const hash32 = (salt: string) => `0x${keccakHex(`ledgerlight:${salt}`)}`;
const address = (salt: string) => `0x${keccakHex(`addr:${salt}`).slice(24, 64)}`;

const ACCOUNTS = Array.from({ length: 14 }, (_, i) => address(`account-${i}`));
const CONTRACTS = Array.from({ length: 4 }, (_, i) => address(`contract-${i}`));
const VALIDATORS = Array.from({ length: 3 }, (_, i) => address(`validator-${i}`));

const SELECTORS = ["0xa9059cbb", "0x095ea7b3", "0x23b872dd", "0x70a08231", "0xd0e30db0"];

export const CHAIN_ID = 11155111; // Sepolia's id, because the fixture mirrors its shape.
/**
 * The head block is anchored to the moment the page loads, so block ages read
 * the way a live chain's would. Everything else about the chain — hashes,
 * transactions, balances — is seeded and identical on every run.
 */
export const BLOCK_TIME_SECONDS = 12;
export const HEAD_TIME = Math.floor(Date.now() / 1000);
export const GENESIS_TIME = HEAD_TIME - 40 * BLOCK_TIME_SECONDS;
export const BLOCK_TIME = BLOCK_TIME_SECONDS;
export const HEAD = 7_412_880;
const DEPTH = 40; // blocks of history the fixture holds

function buildTransaction(blockNumber: number, index: number, blockHash: string): RawTransaction {
  const salt = `${blockNumber}-${index}`;
  const roll = rand();
  const from = ACCOUNTS[Math.floor(rand() * ACCOUNTS.length)];
  const isCreation = roll > 0.97;
  const isCall = !isCreation && roll > 0.55;
  const to = isCreation ? null : isCall ? CONTRACTS[Math.floor(rand() * CONTRACTS.length)] : ACCOUNTS[Math.floor(rand() * ACCOUNTS.length)];

  const input = isCreation
    ? `0x60806040${keccakHex(`code:${salt}`).repeat(2)}`
    : isCall
      ? `${SELECTORS[Math.floor(rand() * SELECTORS.length)]}${"0".repeat(24)}${ACCOUNTS[Math.floor(rand() * ACCOUNTS.length)].slice(2)}${BigInt(Math.floor(rand() * 5000) + 1).toString(16).padStart(64, "0")}`
      : "0x";

  const value = isCall || isCreation ? 0n : BigInt(Math.floor(rand() * 4_000_000)) * 10n ** 12n;
  const type = roll > 0.2 ? "0x2" : "0x0";
  const priority = BigInt(Math.floor(rand() * 2_000_000_000) + 100_000_000);

  return {
    hash: hash32(`tx-${salt}`),
    blockNumber: hex(blockNumber),
    blockHash,
    transactionIndex: hex(index),
    from,
    to,
    value: hex(value),
    gas: hex(isCreation ? 1_400_000 : isCall ? 90_000 + Math.floor(rand() * 120_000) : 21_000),
    nonce: hex(Math.floor(rand() * 400)),
    input,
    type,
    ...(type === "0x2"
      ? { maxFeePerGas: hex(priority + 18_000_000_000n), maxPriorityFeePerGas: hex(priority) }
      : { gasPrice: hex(priority + 14_000_000_000n) }),
  };
}

function buildChain(): { blocks: RawBlock[]; receipts: Map<string, RawReceipt> } {
  reset();
  const blocks: RawBlock[] = [];
  const receipts = new Map<string, RawReceipt>();
  let parentHash = hash32(`block-${HEAD - DEPTH}`);

  for (let i = 0; i < DEPTH; i++) {
    const number = HEAD - DEPTH + 1 + i;
    const blockHash = hash32(`block-${number}`);
    const count = 38 + Math.floor(rand() * 95);
    const transactions = Array.from({ length: count }, (_, idx) => buildTransaction(number, idx, blockHash));

    let gasUsed = 0n;
    for (const tx of transactions) {
      const limit = BigInt(tx.gas);
      // Transactions rarely use their whole limit; a plain transfer uses exactly 21,000.
      const used = tx.input === "0x" ? 21_000n : (limit * BigInt(55 + Math.floor(rand() * 40))) / 100n;
      gasUsed += used;

      const effective = BigInt(tx.maxFeePerGas ?? tx.gasPrice ?? "0x0") - 6_000_000_000n;
      const failed = rand() > 0.94 && tx.input !== "0x";
      receipts.set(tx.hash.toLowerCase(), {
        transactionHash: tx.hash,
        status: failed ? "0x0" : "0x1",
        gasUsed: hex(used),
        effectiveGasPrice: hex(effective > 0n ? effective : 1_000_000_000n),
        contractAddress: tx.to === null ? address(`deployed-${tx.hash.slice(2, 10)}`) : null,
        logs:
          failed || tx.input === "0x"
            ? []
            : Array.from({ length: 1 + Math.floor(rand() * 3) }, (_, li) => ({
                address: tx.to ?? CONTRACTS[0],
                topics: [
                  `0x${keccakHex("Transfer(address,address,uint256)")}`,
                  `0x${"0".repeat(24)}${tx.from.slice(2)}`,
                  `0x${"0".repeat(24)}${ACCOUNTS[li % ACCOUNTS.length].slice(2)}`,
                ],
                data: `0x${BigInt(Math.floor(rand() * 90_000) + 1).toString(16).padStart(64, "0")}`,
              })),
      });
    }

    blocks.push({
      number: hex(number),
      hash: blockHash,
      parentHash,
      timestamp: hex(GENESIS_TIME + (number - (HEAD - DEPTH)) * BLOCK_TIME),
      gasUsed: hex(gasUsed),
      gasLimit: hex(30_000_000),
      baseFeePerGas: hex(7_000_000_000 + Math.floor(rand() * 9_000_000_000)),
      miner: VALIDATORS[number % VALIDATORS.length],
      transactions,
      size: hex(12_000 + Math.floor(rand() * 60_000)),
    });
    parentHash = blockHash;
  }

  return { blocks, receipts };
}

export const CHAIN = buildChain();

const byNumber = new Map(CHAIN.blocks.map((b) => [BigInt(b.number), b]));
const byHash = new Map(CHAIN.blocks.map((b) => [b.hash.toLowerCase(), b]));
const txByHash = new Map<string, RawTransaction>();
for (const block of CHAIN.blocks) {
  for (const tx of block.transactions as RawTransaction[]) txByHash.set(tx.hash.toLowerCase(), tx);
}

/** Balances are derived from the chain, so the numbers the UI shows are consistent with it. */
const balances = new Map<string, bigint>();
const nonces = new Map<string, number>();
for (const account of [...ACCOUNTS, ...CONTRACTS, ...VALIDATORS]) {
  balances.set(account.toLowerCase(), BigInt(Math.floor(rand() * 40_000)) * 10n ** 15n);
  nonces.set(account.toLowerCase(), 0);
}
for (const block of CHAIN.blocks) {
  for (const tx of block.transactions as RawTransaction[]) {
    const from = tx.from.toLowerCase();
    nonces.set(from, (nonces.get(from) ?? 0) + 1);
    const value = BigInt(tx.value);
    balances.set(from, (balances.get(from) ?? 0n) - value);
    if (tx.to) balances.set(tx.to.toLowerCase(), (balances.get(tx.to.toLowerCase()) ?? 0n) + value);
  }
}
for (const [k, v] of balances) if (v < 0n) balances.set(k, -v); // keep the fixture non-negative

export const FIXTURE_ACCOUNTS = ACCOUNTS;
export const FIXTURE_CONTRACTS = CONTRACTS;

export function transactionsFor(addressValue: string): RawTransaction[] {
  const needle = addressValue.toLowerCase();
  const out: RawTransaction[] = [];
  for (let i = CHAIN.blocks.length - 1; i >= 0; i--) {
    for (const tx of CHAIN.blocks[i].transactions as RawTransaction[]) {
      if (tx.from.toLowerCase() === needle || tx.to?.toLowerCase() === needle) out.push(tx);
    }
  }
  return out;
}

const resolveBlockTag = (tag: string) => {
  if (tag === "latest" || tag === "pending" || tag === "safe" || tag === "finalized") return byNumber.get(BigInt(HEAD));
  if (tag === "earliest") return CHAIN.blocks[0];
  try {
    return byNumber.get(BigInt(tag));
  } catch {
    return undefined;
  }
};

/**
 * Serve a JSON-RPC request from the fixture. `latencyMs` makes the loading
 * states in the interface real rather than instantaneous.
 */
export function fixtureTransport(latencyMs = 180): Transport {
  return async (requests: RpcRequest[], signal: AbortSignal) => {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, latencyMs);
      signal.addEventListener("abort", () => { clearTimeout(timer); reject(new Error("aborted")); }, { once: true });
    });

    return requests.map((req) => {
      const reply = (result: unknown) => ({ jsonrpc: "2.0", id: req.id, result });
      const fail = (code: number, message: string) => ({ jsonrpc: "2.0", id: req.id, error: { code, message } });
      const [a, b] = req.params as [string, unknown];

      switch (req.method) {
        case "eth_chainId": return reply(hex(CHAIN_ID));
        case "eth_blockNumber": return reply(hex(HEAD));
        case "eth_gasPrice": return reply(hex(14_500_000_000));
        case "eth_getBalance": return reply(hex(balances.get(String(a).toLowerCase()) ?? 0n));
        case "eth_getTransactionCount": return reply(hex(nonces.get(String(a).toLowerCase()) ?? 0));
        case "eth_getCode":
          return reply(CONTRACTS.some((c) => c.toLowerCase() === String(a).toLowerCase()) ? `0x60806040${keccakHex(String(a)).slice(0, 40)}` : "0x");
        case "eth_getBlockByNumber": {
          const block = resolveBlockTag(String(a));
          if (!block) return reply(null);
          return reply(b === false ? { ...block, transactions: (block.transactions as RawTransaction[]).map((t) => t.hash) } : block);
        }
        case "eth_getBlockByHash": {
          const block = byHash.get(String(a).toLowerCase());
          if (!block) return reply(null);
          return reply(b === false ? { ...block, transactions: (block.transactions as RawTransaction[]).map((t) => t.hash) } : block);
        }
        case "eth_getTransactionByHash": return reply(txByHash.get(String(a).toLowerCase()) ?? null);
        case "eth_getTransactionReceipt": return reply(CHAIN.receipts.get(String(a).toLowerCase()) ?? null);
        default: return fail(-32601, `the method ${req.method} does not exist/is not available`);
      }
    });
  };
}
