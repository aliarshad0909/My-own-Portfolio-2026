import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RpcClient, failureMessage, networkById, NETWORKS } from "../src/lib/rpc.ts";
import type { RpcRequest } from "../src/lib/rpc.ts";
import { CHAIN, HEAD, fixtureTransport, transactionsFor } from "../src/data/fixture-node.ts";
import { classifyQuery, decodeBlock, decodeReceipt, decodeTransaction, KNOWN_SELECTORS, KNOWN_TOPICS } from "../src/lib/decode.ts";
import { formatEther, hexToBigInt } from "../src/lib/units.ts";
import { chainName, connect, detectProvider, isTestnet, silentAccounts, walletErrorMessage, WALLET_ERRORS } from "../src/lib/wallet.ts";

const client = () => new RpcClient(fixtureTransport(0));

describe("JSON-RPC client", () => {
  it("sends a well-formed JSON-RPC 2.0 envelope", async () => {
    let seen: RpcRequest[] | null = null;
    const c = new RpcClient(async (body) => {
      seen = body;
      return [{ jsonrpc: "2.0", id: body[0].id, result: "0x1" }];
    });
    await c.call("eth_blockNumber");
    assert.ok(seen);
    assert.equal(seen![0].jsonrpc, "2.0");
    assert.equal(seen![0].method, "eth_blockNumber");
    assert.equal(typeof seen![0].id, "number");
    assert.deepEqual(seen![0].params, []);
  });

  it("increments the request id", async () => {
    const ids: number[] = [];
    const c = new RpcClient(async (body) => { ids.push(body[0].id); return [{ jsonrpc: "2.0", id: body[0].id, result: "0x1" }]; });
    await c.call("a"); await c.call("b"); await c.call("c");
    assert.deepEqual(ids, [1, 2, 3]);
  });

  it("reports an unreachable node rather than throwing", async () => {
    const c = new RpcClient(async () => { throw new Error("getaddrinfo ENOTFOUND rpc.example"); });
    const r = await c.call("eth_chainId");
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.error.kind, "unreachable");
    assert.match(failureMessage((r as { error: never }).error), /Could not reach the node/);
  });

  it("times out instead of hanging for ever", async () => {
    const c = new RpcClient((_, signal) => new Promise((_res, rej) => {
      signal.addEventListener("abort", () => rej(new Error("The operation was aborted")));
    }), 40);
    const started = Date.now();
    const r = await c.call("eth_chainId");
    assert.equal(r.ok === false && r.error.kind, "timeout");
    assert.ok(Date.now() - started < 1500);
  });

  it("surfaces an RPC error with its code", async () => {
    const c = client();
    const r = await c.call("eth_notAMethod");
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.error.kind, "rpc-error");
    assert.equal(r.ok === false && r.error.kind === "rpc-error" && r.error.code, -32601);
  });

  it("distinguishes a null result from an error: not-found is not a failure of the node", async () => {
    const r = await client().getTransactionByHash(`0x${"ab".repeat(32)}`);
    assert.equal(r.ok === false && r.error.kind, "not-found");
  });

  it("rejects a response that is not a JSON-RPC object", async () => {
    const c = new RpcClient(async () => "<html>502 Bad Gateway</html>");
    assert.equal((await c.call("eth_chainId")).ok === false, true);
    const r = await c.call("eth_chainId");
    assert.equal(r.ok === false && r.error.kind, "malformed");
  });

  it("rejects a response carrying neither result nor error", async () => {
    const c = new RpcClient(async (b) => [{ jsonrpc: "2.0", id: b[0].id }]);
    const r = await c.call("eth_chainId");
    assert.equal(r.ok === false && r.error.kind, "malformed");
  });

  it("logs every call with its outcome and duration", async () => {
    const c = client();
    await c.blockNumber();
    await c.call("eth_nope");
    assert.equal(c.log.length, 2);
    assert.equal(c.log[0].method, "eth_nope");
    assert.match(c.log[0].outcome, /rpc-error/);
    assert.equal(c.log[1].outcome, "ok");
    assert.ok(c.log[0].ms >= 0);
  });

  it("names three testnets and no mainnet — this tool is read-only and testnet-first", () => {
    assert.equal(NETWORKS.length, 3);
    assert.equal(NETWORKS.some((n) => n.chainId === 1), false, "mainnet must not be in the list");
    assert.equal(networkById("sepolia")?.chainId, 11155111);
    assert.equal(networkById("nope"), undefined);
  });
});

describe("fixture node", () => {
  it("is a chain of linked blocks", () => {
    assert.equal(CHAIN.blocks.length, 40);
    for (let i = 1; i < CHAIN.blocks.length; i++) {
      assert.equal(CHAIN.blocks[i].parentHash, CHAIN.blocks[i - 1].hash, `block ${i} does not point at its parent`);
    }
  });

  it("is deterministic: the same head block every run", async () => {
    const r = await client().getBlockByNumber("latest");
    assert.equal(r.ok, true);
    assert.equal(r.ok && decodeBlock(r.value).number, HEAD);
  });

  it("gives every transaction a receipt", () => {
    const txCount = CHAIN.blocks.reduce((n, b) => n + b.transactions.length, 0);
    assert.equal(CHAIN.receipts.size, txCount);
    assert.ok(txCount > 1000, `expected a substantial chain, got ${txCount}`);
  });

  it("keeps gas used inside the block limit", () => {
    for (const b of CHAIN.blocks) {
      assert.ok(hexToBigInt(b.gasUsed) <= hexToBigInt(b.gasLimit), `block ${b.number} used more gas than its limit`);
    }
  });

  it("serves a block by hash and by number identically", async () => {
    const c = client();
    const byNumber = await c.getBlockByNumber("0x" + HEAD.toString(16));
    assert.equal(byNumber.ok, true);
    const byHash = await c.getBlockByHash((byNumber as { value: { hash: string } }).value.hash);
    assert.equal(byHash.ok, true);
    assert.deepEqual(byHash, byNumber);
  });

  it("honours withTransactions=false by returning hashes only", async () => {
    const r = await client().getBlockByNumber("latest", false);
    assert.equal(r.ok, true);
    const txs = (r as { value: { transactions: unknown[] } }).value.transactions;
    assert.equal(typeof txs[0], "string");
  });

  it("returns null for a block that does not exist", async () => {
    const r = await client().getBlockByNumber("0x1");
    assert.equal(r.ok === false && r.error.kind, "not-found");
  });

  it("finds the transactions touching an address, newest first", async () => {
    const block = CHAIN.blocks[CHAIN.blocks.length - 1];
    const address = (block.transactions as { from: string }[])[0].from;
    const txs = transactionsFor(address);
    assert.ok(txs.length > 0);
    for (const tx of txs) {
      assert.ok(tx.from.toLowerCase() === address.toLowerCase() || tx.to?.toLowerCase() === address.toLowerCase());
    }
    const numbers = txs.map((t) => Number(BigInt(t.blockNumber!)));
    assert.deepEqual(numbers, [...numbers].sort((a, b) => b - a));
  });
});

describe("decoding", () => {
  it("decodes a real fixture block into display values", async () => {
    const r = await client().getBlockByNumber("latest");
    const block = decodeBlock((r as { value: never }).value);
    assert.equal(block.number, HEAD);
    assert.match(block.utc, /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d UTC$/);
    // The fixture head is anchored to load time, so the newest block is seconds old.
    assert.match(block.age, /just now|seconds? ago/);
    assert.ok(block.gasUsedPercent > 0 && block.gasUsedPercent < 100);
    assert.equal(block.transactions.length, block.transactionCount);
    assert.match(block.miner, /^0x[0-9a-fA-F]{40}$/);
  });

  it("classifies transfers, contract calls and deployments", async () => {
    const r = await client().getBlockByNumber("latest");
    const block = decodeBlock((r as { value: never }).value);
    const kinds = new Set(block.transactions.map((t) => t.kind));
    assert.ok(kinds.has("transfer"));
    assert.ok(kinds.has("contract call"));
    for (const tx of block.transactions) {
      if (tx.kind === "transfer") { assert.equal(tx.input, "0x"); assert.ok(tx.to); }
      if (tx.kind === "contract creation") assert.equal(tx.to, null);
      if (tx.kind === "contract call") assert.ok(tx.selector?.startsWith("0x"));
    }
  });

  it("checksums every address it decodes", async () => {
    const r = await client().getBlockByNumber("latest");
    const block = decodeBlock((r as { value: never }).value);
    const mixed = block.transactions.filter((t) => t.from !== t.from.toLowerCase());
    assert.ok(mixed.length > 0, "decoded addresses should be EIP-55 checksummed, not lowercase");
  });

  it("labels transaction types from the type byte", async () => {
    const r = await client().getBlockByNumber("latest");
    const labels = new Set(decodeBlock((r as { value: never }).value).transactions.map((t) => t.typeLabel));
    assert.ok(labels.has("EIP-1559") || labels.has("Legacy"));
    assert.equal([...labels].some((l) => l.startsWith("Unknown")), false);
  });

  it("decodes a receipt including the fee actually paid", async () => {
    const c = client();
    const r = await c.getBlockByNumber("latest");
    const hash = decodeBlock((r as { value: never }).value).transactions[0].hash;
    const rec = await c.getTransactionReceipt(hash);
    assert.equal(rec.ok, true);
    const receipt = decodeReceipt((rec as { value: never }).value);
    assert.equal(receipt.hash, hash);
    assert.equal(typeof receipt.succeeded, "boolean");
    assert.ok(receipt.feePaid! > 0n);
    assert.equal(receipt.feePaid, receipt.gasUsed * receipt.effectiveGasPrice!);
  });

  it("names the log events it recognises", async () => {
    const c = client();
    const r = await c.getBlockByNumber("latest");
    const block = decodeBlock((r as { value: never }).value);
    const call = block.transactions.find((t) => t.kind === "contract call")!;
    const rec = await c.getTransactionReceipt(call.hash);
    const receipt = decodeReceipt((rec as { value: never }).value);
    if (receipt.logs.length) assert.equal(receipt.logs[0].eventName, "Transfer(address,address,uint256)");
  });

  it("knows the four-byte selectors it claims to know", () => {
    assert.equal(KNOWN_SELECTORS["0xa9059cbb"], "transfer(address,uint256)");
    assert.equal(KNOWN_TOPICS["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"], "Transfer(address,address,uint256)");
  });

  it("formats a fixture balance exactly", async () => {
    const c = client();
    const r = await c.getBalance(CHAIN.blocks[0].miner);
    assert.equal(r.ok, true);
    const wei = hexToBigInt((r as { value: string }).value);
    assert.equal(typeof wei, "bigint");
    assert.match(formatEther(wei), /^[\d,]+(\.\d+)?$/);
  });
});

describe("search classification", () => {
  it("tells block numbers, addresses and hashes apart", () => {
    assert.deepEqual(classifyQuery("7412880"), { kind: "block", value: 7412880 });
    assert.equal(classifyQuery(`0x${"a".repeat(40)}`).kind, "address");
    assert.equal(classifyQuery(`0x${"a".repeat(64)}`).kind, "tx");
  });

  it("explains what it could not understand", () => {
    assert.match((classifyQuery("") as { reason: string }).reason, /Enter a block number/);
    assert.match((classifyQuery("0xabc") as { reason: string }).reason, /42 characters/);
    assert.match((classifyQuery("hello") as { reason: string }).reason, /not a block number/);
  });

  it("normalises a transaction hash to lowercase for lookup", () => {
    const q = classifyQuery(`0x${"AB".repeat(32)}`);
    assert.equal(q.kind === "tx" && q.value, `0x${"ab".repeat(32)}`);
  });
});

describe("wallet", () => {
  it("reports no provider when none is injected", () => {
    assert.equal(detectProvider({}), null);
    assert.equal(detectProvider({ ethereum: {} as never }), null);
  });

  it("detects an EIP-1193 provider", () => {
    const provider = { request: async () => "0x1" };
    assert.equal(detectProvider({ ethereum: provider }), provider);
  });

  it("connects and reads the account list and chain id", async () => {
    const provider = {
      request: async ({ method }: { method: string }) =>
        method === "eth_requestAccounts" ? ["0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"] : "0xaa36a7",
    };
    const state = await connect(provider);
    assert.equal(state.status, "connected");
    assert.equal(state.status === "connected" && state.chainId, 11155111);
  });

  it("treats a user rejection as a rejection, not an error", async () => {
    const provider = { request: async () => { throw Object.assign(new Error("User denied"), { code: 4001 }); } };
    const state = await connect(provider);
    assert.equal(state.status, "rejected");
    assert.equal(state.status === "rejected" && state.reason, WALLET_ERRORS[4001]);
  });

  it("reports an empty account list rather than claiming a connection", async () => {
    const provider = { request: async () => [] };
    const state = await connect(provider);
    assert.equal(state.status, "error");
  });

  it("maps the EIP-1193 error codes a wallet really returns", () => {
    assert.match(walletErrorMessage({ code: 4001 }), /rejected/i);
    assert.match(walletErrorMessage({ code: -32002 }), /already open/i);
    assert.match(walletErrorMessage({ message: "boom" }), /boom/);
    assert.match(walletErrorMessage({}), /no message/);
  });

  it("never asks for a signature or a transaction", async () => {
    const methods: string[] = [];
    const provider = {
      request: async ({ method }: { method: string }) => {
        methods.push(method);
        return method === "eth_requestAccounts" ? ["0xabc"] : "0x1";
      },
    };
    await connect(provider);
    await silentAccounts(provider);
    const forbidden = ["eth_sendTransaction", "eth_sign", "personal_sign", "eth_signTypedData_v4", "eth_sendRawTransaction"];
    for (const m of forbidden) assert.equal(methods.includes(m), false, `wallet code must never call ${m}`);
  });

  it("names chains and flags testnets", () => {
    assert.equal(chainName(11155111), "Sepolia testnet");
    assert.equal(chainName(123456), "Chain 123456");
    assert.equal(isTestnet(11155111), true);
    assert.equal(isTestnet(1), false);
  });
});
