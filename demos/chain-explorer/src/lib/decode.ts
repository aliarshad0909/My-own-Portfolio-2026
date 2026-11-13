import { toChecksumAddress } from "./address.ts";
import { keccakHex } from "./keccak.ts";
import type { RawBlock, RawReceipt, RawTransaction } from "./rpc.ts";
import { formatTimestamp, hexToBigInt, hexToNumber } from "./units.ts";

/** Turn the node's hex soup into values the interface can render. */

export type Transaction = {
  hash: string;
  blockNumber: number | null;
  index: number | null;
  from: string;
  to: string | null;
  value: bigint;
  gasLimit: bigint;
  /** Legacy gasPrice, or maxFeePerGas for a type-2 transaction. */
  gasPrice: bigint | null;
  maxPriorityFeePerGas: bigint | null;
  nonce: number;
  input: string;
  typeLabel: string;
  kind: "transfer" | "contract call" | "contract creation";
  selector: string | null;
};

export type Block = {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  utc: string;
  age: string;
  gasUsed: bigint;
  gasLimit: bigint;
  gasUsedPercent: number;
  baseFeePerGas: bigint | null;
  miner: string;
  transactions: Transaction[];
  transactionCount: number;
};

const TYPE_LABELS: Record<string, string> = {
  "0x0": "Legacy",
  "0x1": "EIP-2930 (access list)",
  "0x2": "EIP-1559",
  "0x3": "EIP-4844 (blob)",
};

/** A small signature table. Real explorers query a registry; this is honest about being a short list. */
export const KNOWN_SELECTORS: Record<string, string> = Object.fromEntries(
  [
    "transfer(address,uint256)",
    "transferFrom(address,address,uint256)",
    "approve(address,uint256)",
    "balanceOf(address)",
    "mint(address,uint256)",
    "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
    "deposit()",
    "withdraw(uint256)",
  ].map((sig) => [`0x${keccakHex(sig).slice(0, 8)}`, sig]),
);

export function decodeTransaction(raw: RawTransaction): Transaction {
  const input = raw.input ?? "0x";
  const hasData = input.length > 2;
  const kind: Transaction["kind"] = raw.to === null ? "contract creation" : hasData ? "contract call" : "transfer";
  const selector = hasData && input.length >= 10 ? input.slice(0, 10).toLowerCase() : null;

  return {
    hash: raw.hash,
    blockNumber: raw.blockNumber ? hexToNumber(raw.blockNumber) : null,
    index: raw.transactionIndex ? hexToNumber(raw.transactionIndex) : null,
    from: toChecksumAddress(raw.from),
    to: raw.to ? toChecksumAddress(raw.to) : null,
    value: hexToBigInt(raw.value),
    gasLimit: hexToBigInt(raw.gas),
    gasPrice: raw.maxFeePerGas ? hexToBigInt(raw.maxFeePerGas) : raw.gasPrice ? hexToBigInt(raw.gasPrice) : null,
    maxPriorityFeePerGas: raw.maxPriorityFeePerGas ? hexToBigInt(raw.maxPriorityFeePerGas) : null,
    nonce: hexToNumber(raw.nonce),
    input,
    typeLabel: TYPE_LABELS[raw.type ?? "0x0"] ?? `Unknown type ${raw.type}`,
    kind,
    selector,
  };
}

export function decodeBlock(raw: RawBlock, now = Date.now()): Block {
  const timestamp = hexToNumber(raw.timestamp);
  const { utc, age } = formatTimestamp(timestamp, now);
  const gasUsed = hexToBigInt(raw.gasUsed);
  const gasLimit = hexToBigInt(raw.gasLimit);
  const full = Array.isArray(raw.transactions) && typeof raw.transactions[0] === "object";

  return {
    number: hexToNumber(raw.number),
    hash: raw.hash,
    parentHash: raw.parentHash,
    timestamp,
    utc,
    age,
    gasUsed,
    gasLimit,
    gasUsedPercent: gasLimit === 0n ? 0 : Number((gasUsed * 10000n) / gasLimit) / 100,
    baseFeePerGas: raw.baseFeePerGas ? hexToBigInt(raw.baseFeePerGas) : null,
    miner: toChecksumAddress(raw.miner),
    transactions: full ? (raw.transactions as RawTransaction[]).map(decodeTransaction) : [],
    transactionCount: raw.transactions.length,
  };
}

export type Receipt = {
  hash: string;
  succeeded: boolean;
  gasUsed: bigint;
  effectiveGasPrice: bigint | null;
  feePaid: bigint | null;
  contractAddress: string | null;
  logCount: number;
  logs: { address: string; topics: string[]; data: string; eventName: string | null }[];
};

/** Topics we can name without a network lookup. */
export const KNOWN_TOPICS: Record<string, string> = Object.fromEntries(
  ["Transfer(address,address,uint256)", "Approval(address,address,uint256)", "Deposit(address,uint256)", "Withdrawal(address,uint256)"].map(
    (sig) => [`0x${keccakHex(sig)}`, sig],
  ),
);

export function decodeReceipt(raw: RawReceipt): Receipt {
  const gasUsed = hexToBigInt(raw.gasUsed);
  const effectiveGasPrice = raw.effectiveGasPrice ? hexToBigInt(raw.effectiveGasPrice) : null;
  return {
    hash: raw.transactionHash,
    succeeded: hexToBigInt(raw.status) === 1n,
    gasUsed,
    effectiveGasPrice,
    feePaid: effectiveGasPrice === null ? null : gasUsed * effectiveGasPrice,
    contractAddress: raw.contractAddress ? toChecksumAddress(raw.contractAddress) : null,
    logCount: raw.logs.length,
    logs: raw.logs.map((l) => ({
      address: toChecksumAddress(l.address),
      topics: l.topics,
      data: l.data,
      eventName: l.topics[0] ? (KNOWN_TOPICS[l.topics[0].toLowerCase()] ?? null) : null,
    })),
  };
}

/** What did the user paste? An explorer search box has to work this out. */
export type Query =
  | { kind: "address"; value: string }
  | { kind: "tx"; value: string }
  | { kind: "block"; value: number }
  | { kind: "block-hash"; value: string }
  | { kind: "unknown"; reason: string };

export function classifyQuery(input: string): Query {
  const value = input.trim();
  if (value === "") return { kind: "unknown", reason: "Enter a block number, address or transaction hash." };
  if (/^\d+$/.test(value)) return { kind: "block", value: Number(value) };
  if (/^0x[0-9a-fA-F]{40}$/.test(value)) return { kind: "address", value };
  if (/^0x[0-9a-fA-F]{64}$/.test(value)) return { kind: "tx", value: value.toLowerCase() };
  if (/^0x/.test(value)) {
    return { kind: "unknown", reason: `A hex value is 42 characters for an address or 66 for a hash; this is ${value.length}.` };
  }
  return { kind: "unknown", reason: "That is not a block number, address or transaction hash." };
}
