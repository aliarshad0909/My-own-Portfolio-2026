# Ledgerlight — EVM Block Explorer

A read-only block explorer for EVM chains. Keccak-256 and EIP-55 checksumming are
implemented from the specifications; the JSON-RPC client is real; the wallet
connection is EIP-1193. It ships with a fixture node so the interface has something
to render when no network is reachable, and it never disguises the fixture as a live
chain.

## What is real, and what is not

| | Status |
| --- | --- |
| Keccak-256 | Implemented from the Keccak permutation. Tested against the published Ethereum vectors |
| EIP-55 checksums | Implemented from the spec. Tested against all four EIP-55 vectors |
| JSON-RPC client | Real JSON-RPC 2.0 over `fetch`, with timeouts and typed failures |
| Wallet connection | Real EIP-1193 (`eth_requestAccounts`, `eth_chainId`) |
| Live network mode | **Untested against a live node.** The sandbox this was built in blocks outbound requests to public RPC endpoints |
| Fixture chain | Invented. 40 blocks, ~3,400 transactions, generated from a fixed seed |

The live-network path is written and its failure handling is tested (a browser test
aborts the connection and asserts the real error is shown and no fixture data leaks
into a "live" view), but **no request has ever reached a real Ethereum node from this
code.** Run it on a machine with network access and it will either work or show you
exactly why it did not.

## What it will not do

It is read-only by construction. There is no code path that signs a message, sends a
transaction or asks for a key. A unit test asserts the wallet module never calls
`eth_sendTransaction`, `eth_sign`, `personal_sign`, `eth_signTypedData_v4` or
`eth_sendRawTransaction`. The network list contains three testnets and deliberately
no mainnet; a test asserts chain id 1 is absent.

## The fixture node is a node, not a mock

`fixtureTransport` implements the JSON-RPC envelope: it returns `null` for a hash that
does not exist, `-32601` for a method it does not implement, and it respects the
`AbortSignal`. The client code the UI runs against the fixture is the same code it
runs against Sepolia — a mock that always succeeds would have hidden the handling that
matters.

## Project type

**Original Concept.** Written from scratch. No `ethers`, no `web3.js`, no `viem`, no
`js-sha3` — the cryptography and encoding are in `src/lib/`. The only dependencies are
React, esbuild and Playwright.

## Running it

```bash
npm install
npm run dev     # esbuild dev server on :5173
npm run build   # static bundle in ./dist
npm test        # 62 unit tests
```

Browser tests need the built bundle served:

```bash
npm run build && (cd dist && python3 -m http.server 8808) &
node e2e/smoke.mjs
```

## Test coverage

**Unit (62).** Keccak against the published vectors plus an explicit assertion that
the output is *not* SHA3-256 (the padding differs, and confusing the two is the
classic bug); inputs straddling the 136-byte rate boundary; the canonical
`Transfer(address,address,uint256)` topic and the `0xa9059cbb` / `0x70a08231`
selectors. All four EIP-55 vectors, idempotency, acceptance of case-less addresses and
rejection of a mixed-case address with a flipped letter. Hex and wei arithmetic in
`bigint` throughout, with an explicit test that formatting truncates rather than rounds
— an explorer must never round 1.999999999999999999 up to 2. The RPC client's envelope,
id increment, timeout, unreachable host, `-32601`, null result and malformed response.
The fixture chain's parent-hash linkage, receipt coverage and gas-limit invariant.

**Browser (25).** Blocks load and paginate, gas bars render real widths, blocks and
transactions open with their facts, contract calls show calldata, search resolves block
numbers and reports not-found honestly, a broken checksum is rejected with a working
correction link, the RPC log records real calls and durations, the wallet panel is
honest with no wallet and connects with an injected one, a rejection reads as a
rejection, a dead live endpoint shows the real error with no fixture rows behind it,
nothing scrolls sideways at 360px, and the console stays clean.

## Structure

```
src/lib/keccak.ts       Keccak-256 permutation
src/lib/address.ts      EIP-55 checksums, validation, selectors and topics
src/lib/units.ts        Hex ↔ bigint, wei formatting, timestamps
src/lib/rpc.ts          JSON-RPC client, typed failures, network list
src/lib/decode.ts       Node responses → display values; search classification
src/lib/wallet.ts       EIP-1193 detection, connection, error mapping
src/data/fixture-node.ts  Seeded chain + a JSON-RPC node that serves it
```

## Deployment

Static output in `dist/`. `vercel.json` is present but **nothing has been deployed** —
no Vercel project created, no domain purchased.
