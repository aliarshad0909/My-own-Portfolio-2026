import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { keccak256, keccakHex, toHex, utf8 } from "../src/lib/keccak.ts";
import { checkAddress, eventTopic, functionSelector, isAddressShape, shorten, toChecksumAddress } from "../src/lib/address.ts";
import { bigIntToHex, formatEther, formatGwei, formatTimestamp, formatUnits, hexToBigInt, hexToNumber, parseEther } from "../src/lib/units.ts";

describe("keccak-256", () => {
  it("matches the published Ethereum vectors", () => {
    // These are Keccak-256 (0x01 padding), NOT NIST SHA3-256. Different digests.
    assert.equal(keccakHex(""), "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470");
    assert.equal(keccakHex("abc"), "4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45");
    assert.equal(keccakHex("hello"), "1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8");
  });

  it("is not SHA3-256 — the padding differs", () => {
    // SHA3-256("") is a7ffc6f8bf1ed766...; if we produced that, the padding is wrong.
    assert.notEqual(keccakHex(""), "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a");
  });

  it("derives the canonical ERC-20 Transfer topic", () => {
    // This value appears in every ERC-20 transfer log on mainnet.
    assert.equal(eventTopic("Transfer(address,address,uint256)"), "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");
    assert.equal(eventTopic("Approval(address,address,uint256)"), "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925");
  });

  it("derives known four-byte function selectors", () => {
    assert.equal(functionSelector("transfer(address,uint256)"), "0xa9059cbb");
    assert.equal(functionSelector("balanceOf(address)"), "0x70a08231");
    assert.equal(functionSelector("approve(address,uint256)"), "0x095ea7b3");
  });

  it("returns 32 bytes for any input length", () => {
    for (const n of [0, 1, 135, 136, 137, 272, 1000]) {
      assert.equal(keccak256(new Uint8Array(n)).length, 32, `length ${n}`);
    }
  });

  it("handles inputs that straddle the 136-byte rate boundary", () => {
    // If the padding or absorb loop is wrong, these collide or repeat.
    const digests = new Set([135, 136, 137].map((n) => toHex(keccak256(new Uint8Array(n).fill(0xab)))));
    assert.equal(digests.size, 3);
  });

  it("is deterministic and avalanches", () => {
    assert.equal(keccakHex("ledgerlight"), keccakHex("ledgerlight"));
    const a = keccakHex("ledgerlight");
    const b = keccakHex("ledgerlighu");
    let differing = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) differing++;
    assert.ok(differing > 50, `a one-character change moved only ${differing} of 64 hex digits`);
  });

  it("accepts raw bytes as well as strings", () => {
    assert.equal(toHex(keccak256(utf8("abc"))), keccakHex("abc"));
  });
});

describe("EIP-55 addresses", () => {
  // The four test vectors from EIP-55 itself.
  const VECTORS = [
    "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
    "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
    "0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB",
    "0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb",
  ];

  it("reproduces every EIP-55 vector from its lowercase form", () => {
    for (const expected of VECTORS) assert.equal(toChecksumAddress(expected.toLowerCase()), expected);
  });

  it("is idempotent", () => {
    for (const v of VECTORS) assert.equal(toChecksumAddress(toChecksumAddress(v)), v);
  });

  it("accepts an all-lowercase address: there is no checksum to verify", () => {
    const result = checkAddress(VECTORS[0].toLowerCase());
    assert.equal(result.valid, true);
    assert.equal(result.valid && result.checksummed, VECTORS[0]);
    assert.equal(result.valid && result.wasMixedCase, false);
  });

  it("accepts a correctly checksummed address", () => {
    assert.equal(checkAddress(VECTORS[1]).valid, true);
  });

  it("rejects a mixed-case address whose checksum is wrong — that is the point of EIP-55", () => {
    // Flip one letter's case; the checksum no longer matches.
    const broken = VECTORS[0].replace("aAe", "aae");
    const result = checkAddress(broken);
    assert.equal(result.valid, false);
    assert.match(result.valid === false ? result.reason : "", /typo/i);
    assert.equal(result.checksummed, VECTORS[0]);
  });

  it("explains each way an address can be malformed", () => {
    assert.match((checkAddress("") as { reason: string }).reason, /Enter an address/);
    assert.match((checkAddress("5aAeb605") as { reason: string }).reason, /starts with 0x/);
    assert.match((checkAddress("0x1234") as { reason: string }).reason, /42 characters/);
    assert.match((checkAddress(`0x${"z".repeat(40)}`) as { reason: string }).reason, /hex digits/);
  });

  it("refuses to checksum something that is not an address", () => {
    assert.equal(isAddressShape("0x1234"), false);
    assert.throws(() => toChecksumAddress("0x1234"), /not a 20-byte hex address/);
  });

  it("shortens for display without losing the ends", () => {
    assert.equal(shorten(VECTORS[0]), "0x5aAe…eAed");
    assert.equal(shorten("0xabc"), "0xabc");
  });
});

describe("units", () => {
  it("parses hex quantities as bigints, including values beyond Number", () => {
    assert.equal(hexToBigInt("0x0"), 0n);
    assert.equal(hexToBigInt("0x"), 0n);
    assert.equal(hexToBigInt("0xde0b6b3a7640000"), 10n ** 18n);
    // A balance that would lose precision as a float.
    assert.equal(hexToBigInt("0x152d02c7e14af6800000"), 100000n * 10n ** 18n);
  });

  it("rejects malformed hex rather than returning NaN", () => {
    for (const bad of ["", "0xzz", "1234", "0x12 34"]) assert.throws(() => hexToBigInt(bad), /not a hex quantity/);
  });

  it("round-trips bigints through hex", () => {
    for (const v of [0n, 1n, 255n, 10n ** 30n]) assert.equal(hexToBigInt(bigIntToHex(v)), v);
    assert.throws(() => bigIntToHex(-1n), /unsigned/);
  });

  it("refuses to narrow a quantity that will not fit a Number", () => {
    assert.equal(hexToNumber("0x1e8480"), 2000000);
    assert.throws(() => hexToNumber("0xffffffffffffffffff"), /safe integer/);
  });

  it("formats wei as ether without floating point", () => {
    assert.equal(formatEther(10n ** 18n), "1");
    assert.equal(formatEther(10n ** 18n + 5n * 10n ** 17n), "1.5");
    assert.equal(formatEther(1n), "0");          // truncated at 6 places, not rounded up
    assert.equal(formatEther(1n, 18), "0.000000000000000001");
    assert.equal(formatEther(1234567n * 10n ** 18n), "1,234,567");
  });

  it("truncates rather than rounds — an explorer must not inflate a balance", () => {
    assert.equal(formatEther(1999999999999999999n), "1.999999");
    assert.notEqual(formatEther(1999999999999999999n), "2");
  });

  it("formats gwei for gas prices", () => {
    assert.equal(formatGwei(25n * 10n ** 9n), "25");
    assert.equal(formatGwei(1500000000n), "1.5");
  });

  it("parses decimal ether back to exact wei", () => {
    assert.equal(parseEther("1"), 10n ** 18n);
    assert.equal(parseEther("0.000000000000000001"), 1n);
    assert.equal(parseEther("1234.5"), 1234500000000000000000n);
    assert.throws(() => parseEther("1.0000000000000000001"), /18 decimal places/);
    assert.throws(() => parseEther("abc"), /not a decimal amount/);
  });

  it("formats block timestamps with a UTC value and an age", () => {
    const now = Date.UTC(2026, 0, 2, 0, 0, 0);
    const { utc, age } = formatTimestamp(Math.floor(Date.UTC(2026, 0, 1, 12, 0, 0) / 1000), now);
    assert.equal(utc, "2026-01-01 12:00:00 UTC");
    assert.equal(age, "12 hours ago");
    assert.equal(formatTimestamp(Math.floor(now / 1000) - 2, now).age, "just now");
    assert.equal(formatTimestamp(Math.floor(now / 1000) - 90, now).age, "1 minute ago");
  });
});
