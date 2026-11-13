import "./styles.css";
import { StrictMode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { RpcClient, failureMessage, httpTransport, NETWORKS, type NetworkId, type RpcFailure } from "./lib/rpc.ts";
import { CHAIN_ID, FIXTURE_ACCOUNTS, HEAD, fixtureTransport, transactionsFor } from "./data/fixture-node.ts";
import { classifyQuery, decodeBlock, decodeReceipt, decodeTransaction, KNOWN_SELECTORS, type Block, type Receipt, type Transaction } from "./lib/decode.ts";
import { checkAddress, shorten } from "./lib/address.ts";
import { formatEther, formatGwei, hexToBigInt } from "./lib/units.ts";
import { chainName, connect, describeAbsence, detectProvider, isTestnet, silentAccounts, type WalletState } from "./lib/wallet.ts";

type Source = "fixture" | NetworkId;
type View =
  | { kind: "blocks" }
  | { kind: "block"; number: number }
  | { kind: "tx"; hash: string }
  | { kind: "address"; value: string };

const PAGE = 25;

/* ------------------------------------------------------------------ */

function Mono({ value, href, onClick }: { value: string; href?: string; onClick?: () => void }) {
  if (onClick) return <button type="button" className="mono link" onClick={onClick}>{value}</button>;
  if (href) return <a className="mono link" href={href} target="_blank" rel="noreferrer noopener">{value}</a>;
  return <span className="mono">{value}</span>;
}

function Copyable({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <span className="copyable">
      <span className="mono break">{value}</span>
      <button
        type="button"
        className="icon-btn"
        aria-label={`Copy ${value}`}
        onClick={async () => {
          try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1600); } catch { /* clipboard may be blocked */ }
        }}
      >
        {done ? "✓" : "copy"}
      </button>
    </span>
  );
}

function Spinner({ label }: { label: string }) {
  return <p className="loading" role="status">{label}</p>;
}

function Failure({ error, onRetry }: { error: RpcFailure; onRetry?: () => void }) {
  return (
    <div className="failure" role="alert">
      <strong>{error.kind === "not-found" ? "Not found" : "Request failed"}</strong>
      <p>{failureMessage(error)}</p>
      {onRetry ? <button type="button" className="btn btn--sm" onClick={onRetry}>Try again</button> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function WalletPanel() {
  const [state, setState] = useState<WalletState>({ status: "unsupported", reason: describeAbsence() });

  useEffect(() => {
    const provider = detectProvider();
    if (!provider) return;
    setState({ status: "available" });
    silentAccounts(provider).then(async (accounts) => {
      if (accounts.length === 0) return;
      const chainIdHex = (await provider.request({ method: "eth_chainId" })) as string;
      setState({ status: "connected", accounts, chainId: Number.parseInt(chainIdHex, 16) });
    }).catch(() => { /* already surfaced on explicit connect */ });
  }, []);

  const onConnect = async () => {
    const provider = detectProvider();
    if (!provider) return;
    setState({ status: "connecting" });
    setState(await connect(provider));
  };

  return (
    <section className="panel wallet" aria-labelledby="wallet-h">
      <h2 id="wallet-h">Wallet</h2>
      <p className="hint">
        Read-only. This asks your wallet for its account list and chain id, and nothing else — no signatures, no transactions, no seed phrase.
      </p>

      {state.status === "unsupported" ? (
        <p className="state state--muted" data-testid="wallet-state">{state.reason}</p>
      ) : state.status === "connected" ? (
        <div data-testid="wallet-state">
          <p className="state state--ok">Connected · {chainName(state.chainId)}</p>
          {!isTestnet(state.chainId) ? (
            <p className="state state--warn">This is not a testnet. Nothing here can spend anything, but check which chain you meant.</p>
          ) : null}
          <ul className="accounts">
            {state.accounts.map((a) => <li key={a}><Mono value={shorten(a, 10, 8)} /></li>)}
          </ul>
        </div>
      ) : (
        <div data-testid="wallet-state">
          {state.status === "rejected" || state.status === "error" ? <p className="state state--warn">{state.reason}</p> : null}
          <button type="button" className="btn" onClick={onConnect} disabled={state.status === "connecting"}>
            {state.status === "connecting" ? "Waiting for your wallet…" : "Connect wallet"}
          </button>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function BlockList({ client, onOpen }: { client: RpcClient; onOpen: (v: View) => void }) {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [error, setError] = useState<RpcFailure | null>(null);
  const [count, setCount] = useState(8);

  const load = useCallback(async () => {
    setError(null);
    setBlocks(null);
    const head = await client.blockNumber();
    if (!head.ok) { setError(head.error); return; }
    const headNumber = Number(hexToBigInt(head.value));
    const results = await Promise.all(
      Array.from({ length: count }, (_, i) => client.getBlockByNumber(`0x${(headNumber - i).toString(16)}`, true)),
    );
    const failure = results.find((r) => !r.ok);
    if (failure && !failure.ok) { setError(failure.error); return; }
    setBlocks(results.map((r) => decodeBlock((r as { value: never }).value)));
  }, [client, count]);

  useEffect(() => { void load(); }, [load]);

  if (error) return <Failure error={error} onRetry={() => void load()} />;
  if (!blocks) return <Spinner label={`Requesting the last ${count} blocks…`} />;

  return (
    <section aria-labelledby="blocks-h">
      <h2 id="blocks-h">Latest blocks</h2>
      <div className="table-wrap">
        <table className="table" data-testid="block-table">
          <caption className="sr">The most recent blocks, with their transaction count, gas usage and base fee</caption>
          <thead>
            <tr><th scope="col">Block</th><th scope="col">Age</th><th scope="col">Txns</th><th scope="col">Gas used</th><th scope="col">Base fee</th><th scope="col">Validator</th></tr>
          </thead>
          <tbody>
            {blocks.map((b) => (
              <tr key={b.hash}>
                <th scope="row"><Mono value={b.number.toLocaleString("en-US")} onClick={() => onOpen({ kind: "block", number: b.number })} /></th>
                <td className="nowrap">{b.age}</td>
                <td>{b.transactionCount}</td>
                <td>
                  <div className="gas">
                    <span>{b.gasUsedPercent.toFixed(1)}%</span>
                    <span className="gas__bar"><span className="gas__fill" style={{ width: `${Math.min(100, b.gasUsedPercent)}%` }} /></span>
                  </div>
                </td>
                <td className="nowrap">{b.baseFeePerGas ? `${formatGwei(b.baseFeePerGas)} gwei` : "—"}</td>
                <td><Mono value={shorten(b.miner)} onClick={() => onOpen({ kind: "address", value: b.miner })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {count < 20 ? (
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCount((c) => c + 6)}>Load more blocks</button>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function TxTable({ txs, onOpen, currency }: { txs: Transaction[]; onOpen: (v: View) => void; currency: string }) {
  const [shown, setShown] = useState(PAGE);
  return (
    <>
      <div className="table-wrap">
        <table className="table" data-testid="tx-table">
          <caption className="sr">Transactions, with sender, recipient, value and type</caption>
          <thead>
            <tr><th scope="col">Hash</th><th scope="col">Kind</th><th scope="col">From</th><th scope="col">To</th><th scope="col">Value</th><th scope="col">Type</th></tr>
          </thead>
          <tbody>
            {txs.slice(0, shown).map((t) => (
              <tr key={t.hash}>
                <th scope="row"><Mono value={shorten(t.hash, 10, 6)} onClick={() => onOpen({ kind: "tx", hash: t.hash })} /></th>
                <td><span className="tag" data-kind={t.kind}>{t.kind}</span></td>
                <td><Mono value={shorten(t.from)} onClick={() => onOpen({ kind: "address", value: t.from })} /></td>
                <td>{t.to ? <Mono value={shorten(t.to)} onClick={() => onOpen({ kind: "address", value: t.to! })} /> : <span className="muted">contract creation</span>}</td>
                <td className="nowrap">{formatEther(t.value, 5)} {currency}</td>
                <td className="nowrap">{t.typeLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown < txs.length ? (
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShown((s) => s + PAGE)}>
          Show {Math.min(PAGE, txs.length - shown)} more of {txs.length}
        </button>
      ) : (
        <p className="muted">{txs.length} transaction{txs.length === 1 ? "" : "s"}.</p>
      )}
    </>
  );
}

function BlockView({ client, number, onOpen, currency }: { client: RpcClient; number: number; onOpen: (v: View) => void; currency: string }) {
  const [block, setBlock] = useState<Block | null>(null);
  const [error, setError] = useState<RpcFailure | null>(null);

  useEffect(() => {
    let live = true;
    setBlock(null); setError(null);
    client.getBlockByNumber(`0x${number.toString(16)}`, true).then((r) => {
      if (!live) return;
      if (r.ok) setBlock(decodeBlock(r.value)); else setError(r.error);
    });
    return () => { live = false; };
  }, [client, number]);

  if (error) return <Failure error={error} />;
  if (!block) return <Spinner label={`Requesting block ${number.toLocaleString("en-US")}…`} />;

  return (
    <section aria-labelledby="block-h">
      <h2 id="block-h">Block {block.number.toLocaleString("en-US")}</h2>
      <dl className="facts" data-testid="block-facts">
        <div><dt>Hash</dt><dd><Copyable value={block.hash} /></dd></div>
        <div><dt>Parent</dt><dd><Mono value={shorten(block.parentHash, 12, 8)} onClick={() => onOpen({ kind: "block", number: block.number - 1 })} /></dd></div>
        <div><dt>Timestamp</dt><dd>{block.utc} <span className="muted">({block.age})</span></dd></div>
        <div><dt>Transactions</dt><dd>{block.transactionCount}</dd></div>
        <div><dt>Gas used</dt><dd>{block.gasUsed.toLocaleString("en-US")} of {block.gasLimit.toLocaleString("en-US")} ({block.gasUsedPercent.toFixed(2)}%)</dd></div>
        <div><dt>Base fee</dt><dd>{block.baseFeePerGas ? `${formatGwei(block.baseFeePerGas)} gwei` : "not set (pre-EIP-1559)"}</dd></div>
        <div><dt>Validator</dt><dd><Mono value={block.miner} onClick={() => onOpen({ kind: "address", value: block.miner })} /></dd></div>
      </dl>
      <h3>Transactions in this block</h3>
      <TxTable txs={block.transactions} onOpen={onOpen} currency={currency} />
    </section>
  );
}

/* ------------------------------------------------------------------ */

function TxView({ client, hash, onOpen, currency }: { client: RpcClient; hash: string; onOpen: (v: View) => void; currency: string }) {
  const [tx, setTx] = useState<Transaction | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<RpcFailure | null>(null);

  useEffect(() => {
    let live = true;
    setTx(null); setReceipt(null); setError(null);
    (async () => {
      const r = await client.getTransactionByHash(hash);
      if (!live) return;
      if (!r.ok) { setError(r.error); return; }
      setTx(decodeTransaction(r.value));
      const rec = await client.getTransactionReceipt(hash);
      if (!live) return;
      if (rec.ok) setReceipt(decodeReceipt(rec.value));
    })();
    return () => { live = false; };
  }, [client, hash]);

  if (error) return <Failure error={error} />;
  if (!tx) return <Spinner label="Requesting transaction…" />;

  const fee = receipt?.feePaid ?? null;

  return (
    <section aria-labelledby="tx-h">
      <h2 id="tx-h">Transaction</h2>
      <p className="hash-line"><Copyable value={tx.hash} /></p>

      {receipt ? (
        <p className="state" data-testid="tx-status" data-ok={receipt.succeeded}>
          {receipt.succeeded ? "Succeeded" : "Reverted — the transaction was mined but its execution failed. Gas was still paid."}
        </p>
      ) : (
        <p className="state state--muted">Receipt not available — the transaction may still be pending.</p>
      )}

      <dl className="facts" data-testid="tx-facts">
        <div><dt>Block</dt><dd>{tx.blockNumber === null ? "pending" : <Mono value={tx.blockNumber.toLocaleString("en-US")} onClick={() => onOpen({ kind: "block", number: tx.blockNumber! })} />}</dd></div>
        <div><dt>Position</dt><dd>{tx.index ?? "—"}</dd></div>
        <div><dt>From</dt><dd><Mono value={tx.from} onClick={() => onOpen({ kind: "address", value: tx.from })} /></dd></div>
        <div><dt>To</dt><dd>{tx.to ? <Mono value={tx.to} onClick={() => onOpen({ kind: "address", value: tx.to! })} /> : <span className="muted">contract creation{receipt?.contractAddress ? <> → <Mono value={receipt.contractAddress} onClick={() => onOpen({ kind: "address", value: receipt.contractAddress! })} /></> : null}</span>}</dd></div>
        <div><dt>Value</dt><dd>{formatEther(tx.value, 18)} {currency}</dd></div>
        <div><dt>Nonce</dt><dd>{tx.nonce}</dd></div>
        <div><dt>Type</dt><dd>{tx.typeLabel}</dd></div>
        <div><dt>Gas limit</dt><dd>{tx.gasLimit.toLocaleString("en-US")}</dd></div>
        {receipt ? <div><dt>Gas used</dt><dd>{receipt.gasUsed.toLocaleString("en-US")} ({((Number(receipt.gasUsed) / Number(tx.gasLimit)) * 100).toFixed(1)}% of limit)</dd></div> : null}
        {receipt?.effectiveGasPrice ? <div><dt>Effective gas price</dt><dd>{formatGwei(receipt.effectiveGasPrice)} gwei</dd></div> : null}
        {fee !== null ? <div><dt>Fee paid</dt><dd>{formatEther(fee, 18)} {currency}</dd></div> : null}
      </dl>

      {tx.selector ? (
        <div className="panel">
          <h3>Input data</h3>
          <p>
            Selector <Mono value={tx.selector} />{" "}
            {KNOWN_SELECTORS[tx.selector]
              ? <>— <code>{KNOWN_SELECTORS[tx.selector]}</code></>
              : <span className="muted">— not in this explorer's short signature list, so the arguments are shown raw rather than guessed at.</span>}
          </p>
          <pre className="calldata" data-testid="calldata">{tx.input.replace(/(.{64})/g, "$1\n")}</pre>
        </div>
      ) : null}

      {receipt && receipt.logs.length > 0 ? (
        <div className="panel">
          <h3>Logs ({receipt.logCount})</h3>
          <ul className="logs">
            {receipt.logs.map((log, i) => (
              <li key={i}>
                <p><strong>{log.eventName ?? "Unrecognised event"}</strong> from <Mono value={shorten(log.address)} onClick={() => onOpen({ kind: "address", value: log.address })} /></p>
                <ul className="topics">
                  {log.topics.map((t, j) => <li key={j}><span className="muted">topic {j}</span> <Mono value={shorten(t, 14, 10)} /></li>)}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function AddressView({ client, value, onOpen, currency, live }: { client: RpcClient; value: string; onOpen: (v: View) => void; currency: string; live: boolean }) {
  const check = checkAddress(value);
  const [data, setData] = useState<{ balance: bigint; nonce: number; code: string } | null>(null);
  const [error, setError] = useState<RpcFailure | null>(null);

  const address = check.valid ? check.checksummed : value;

  useEffect(() => {
    if (!check.valid) return;
    let alive = true;
    setData(null); setError(null);
    (async () => {
      const [balance, nonce, code] = await Promise.all([client.getBalance(address), client.getTransactionCount(address), client.getCode(address)]);
      if (!alive) return;
      const bad = [balance, nonce, code].find((r) => !r.ok);
      if (bad && !bad.ok) { setError(bad.error); return; }
      setData({
        balance: hexToBigInt((balance as { value: string }).value),
        nonce: Number(hexToBigInt((nonce as { value: string }).value)),
        code: (code as { value: string }).value,
      });
    })();
    return () => { alive = false; };
  }, [client, address, check.valid]);

  if (!check.valid) {
    return (
      <div className="failure" role="alert">
        <strong>Invalid address</strong>
        <p>{check.reason}</p>
        {check.checksummed ? <p>Did you mean <Mono value={check.checksummed} onClick={() => onOpen({ kind: "address", value: check.checksummed! })} />?</p> : null}
      </div>
    );
  }

  const history = live ? [] : transactionsFor(address).map(decodeTransaction);

  return (
    <section aria-labelledby="addr-h">
      <h2 id="addr-h">Address</h2>
      <p className="hash-line"><Copyable value={address} /></p>
      {check.wasMixedCase ? <p className="state state--ok">EIP-55 checksum verified.</p> : <p className="state state--muted">Entered without case, so there was no checksum to verify. Shown checksummed above.</p>}

      {error ? <Failure error={error} /> : !data ? <Spinner label="Requesting balance, nonce and code…" /> : (
        <dl className="facts" data-testid="address-facts">
          <div><dt>Balance</dt><dd>{formatEther(data.balance, 18)} {currency}</dd></div>
          <div><dt>Transactions sent</dt><dd>{data.nonce}</dd></div>
          <div><dt>Type</dt><dd>{data.code === "0x" ? "Externally owned account" : `Contract (${(data.code.length - 2) / 2} bytes of code)`}</dd></div>
        </dl>
      )}

      <h3>Transaction history</h3>
      {live ? (
        <p className="muted">
          Building a full history needs an indexer — <code>eth_getLogs</code> across every block, or a service like Etherscan's API. A plain JSON-RPC node
          cannot answer "every transaction touching this address", so this explorer does not pretend to. Against the fixture node, where the whole chain is
          in memory, the history is shown.
        </p>
      ) : history.length === 0 ? (
        <p className="muted">No transactions in the 40 blocks the fixture holds.</p>
      ) : (
        <TxTable txs={history} onOpen={onOpen} currency={currency} />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function RequestLog({ client, tick }: { client: RpcClient; tick: number }) {
  const entries = client.log.slice(0, 8);
  return (
    <section className="panel log" aria-labelledby="log-h">
      <h2 id="log-h">RPC calls</h2>
      <p className="hint">Every request this page has made, newest first.</p>
      {entries.length === 0 ? <p className="muted">Nothing yet.</p> : (
        <ol className="log__list" data-testid="rpc-log" data-tick={tick}>
          {entries.map((e, i) => (
            <li key={`${e.at}-${i}`}>
              <code>{e.method}</code>
              <span className="log__outcome" data-ok={e.outcome === "ok"}>{e.outcome}</span>
              <span className="muted">{e.ms}ms</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function App() {
  const [source, setSource] = useState<Source>("fixture");
  const [view, setView] = useState<View>({ kind: "blocks" });
  const [query, setQuery] = useState("");
  const [queryError, setQueryError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const clientRef = useRef<RpcClient | null>(null);

  const network = source === "fixture" ? null : NETWORKS.find((n) => n.id === source)!;
  const currency = network?.currency ?? "ETH";

  const client = useMemo(() => {
    const c = new RpcClient(source === "fixture" ? fixtureTransport(180) : httpTransport(network!.url), 8000);
    clientRef.current = c;
    return c;
  }, [source]);

  // Repaint the request log as calls complete.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 700);
    return () => clearInterval(id);
  }, []);

  const search = (raw: string) => {
    const q = classifyQuery(raw);
    if (q.kind === "unknown") { setQueryError(q.reason); return; }
    setQueryError(null);
    if (q.kind === "block") setView({ kind: "block", number: q.value });
    else if (q.kind === "tx") setView({ kind: "tx", hash: q.value });
    else setView({ kind: "address", value: q.value });
  };

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>

      <header className="top">
        <div className="shell top__inner">
          <h1 className="brand-h">
          <button type="button" className="brand" onClick={() => { setView({ kind: "blocks" }); setQuery(""); setQueryError(null); }}>
            <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
              <rect x="3" y="3" width="11" height="11" rx="2.5" fill="#4fd1b2" />
              <rect x="18" y="3" width="11" height="11" rx="2.5" fill="#4fd1b2" opacity="0.5" />
              <rect x="3" y="18" width="11" height="11" rx="2.5" fill="#4fd1b2" opacity="0.5" />
              <rect x="18" y="18" width="11" height="11" rx="2.5" fill="#4fd1b2" opacity="0.22" />
            </svg>
            <span>Ledgerlight</span>
          </button>
          </h1>

          <form
            className="search"
            role="search"
            onSubmit={(e) => { e.preventDefault(); search(query); }}
          >
            <label className="sr" htmlFor="q">Block number, address or transaction hash</label>
            <input id="q" type="search" value={query} placeholder="Block number, address or tx hash" spellCheck={false}
              onChange={(e) => { setQuery(e.target.value); setQueryError(null); }} />
            <button type="submit" className="btn btn--sm">Search</button>
          </form>

          <div className="net">
            <label className="sr" htmlFor="network">Data source</label>
            <select id="network" value={source} onChange={(e) => { setSource(e.target.value as Source); setView({ kind: "blocks" }); }}>
              <option value="fixture">Fixture node (offline)</option>
              {NETWORKS.map((n) => <option key={n.id} value={n.id}>{n.label} · live RPC</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className={source === "fixture" ? "banner banner--fixture" : "banner banner--live"} data-testid="source-banner">
        <div className="shell">
          {source === "fixture" ? (
            <p>
              <strong>Fixture node.</strong> A deterministic 40-block chain generated in your browser, served over the same JSON-RPC interface a real node
              uses. These blocks, addresses and balances are invented — nothing here is a real chain.
            </p>
          ) : (
            <p>
              <strong>Live {network!.label}.</strong> Requests go to <code>{network!.url}</code> from your browser. If that host is unreachable or rate-limits
              you, the error below is the real one.
            </p>
          )}
        </div>
      </div>

      {queryError ? <div className="shell"><p className="failure failure--inline" role="alert">{queryError}</p></div> : null}

      <main id="main" className="shell layout">
        <div className="layout__main">
          {view.kind === "blocks" ? <BlockList key={source} client={client} onOpen={setView} /> : null}
          {view.kind === "block" ? <BlockView client={client} number={view.number} onOpen={setView} currency={currency} /> : null}
          {view.kind === "tx" ? <TxView client={client} hash={view.hash} onOpen={setView} currency={currency} /> : null}
          {view.kind === "address" ? <AddressView client={client} value={view.value} onOpen={setView} currency={currency} live={source !== "fixture"} /> : null}

          {view.kind !== "blocks" ? (
            <button type="button" className="btn btn--ghost btn--sm back" onClick={() => setView({ kind: "blocks" })}>← Back to latest blocks</button>
          ) : null}
        </div>

        <aside className="layout__side">
          <WalletPanel />
          <RequestLog client={client} tick={tick} />
          {source === "fixture" ? (
            <section className="panel" aria-labelledby="try-h">
              <h2 id="try-h">Something to try</h2>
              <ul className="try">
                <li><button type="button" className="link mono" onClick={() => setView({ kind: "block", number: HEAD })}>Block {HEAD.toLocaleString("en-US")}</button></li>
                <li><button type="button" className="link mono" onClick={() => setView({ kind: "address", value: FIXTURE_ACCOUNTS[0] })}>{shorten(FIXTURE_ACCOUNTS[0], 10, 6)}</button></li>
                <li><button type="button" className="link" onClick={() => { setQuery("0xdeadbeef"); search("0xdeadbeef"); }}>A malformed query</button></li>
              </ul>
            </section>
          ) : null}
        </aside>
      </main>

      <footer className="foot">
        <div className="shell">
          <p>
            Ledgerlight is read-only. It cannot send a transaction, sign a message or move funds, and it asks for no private key or seed phrase. Chain id
            of the fixture node is {CHAIN_ID} (Sepolia's), because the fixture mirrors Sepolia's shape — it is not Sepolia.
          </p>
        </div>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
