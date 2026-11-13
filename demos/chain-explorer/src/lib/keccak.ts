/**
 * Keccak-256, as Ethereum uses it.
 *
 * This is the original Keccak padding (0x01), not the NIST SHA3 padding (0x06).
 * The two produce completely different digests, and getting it wrong is the
 * classic mistake — so the tests check against the published Ethereum vectors
 * rather than SHA3 ones.
 *
 * Written with BigInt lanes. A 32-bit split implementation is faster, but this
 * is a few hundred hashes per page view and correctness is easier to see here.
 */

const MASK = (1n << 64n) - 1n;

const ROUND_CONSTANTS: bigint[] = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

// Rotation offsets, indexed [x + 5y].
const ROTATION = [
  0, 1, 62, 28, 27,
  36, 44, 6, 55, 20,
  3, 10, 43, 25, 39,
  41, 45, 15, 21, 8,
  18, 2, 61, 56, 14,
];

const rotl = (v: bigint, n: number): bigint =>
  n === 0 ? v : ((v << BigInt(n)) | (v >> BigInt(64 - n))) & MASK;

function keccakF(state: bigint[]): void {
  for (let round = 0; round < 24; round++) {
    // Theta
    const c = new Array<bigint>(5);
    for (let x = 0; x < 5; x++) {
      c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }
    for (let x = 0; x < 5; x++) {
      const d = c[(x + 4) % 5] ^ rotl(c[(x + 1) % 5], 1);
      for (let y = 0; y < 5; y++) state[x + 5 * y] ^= d;
    }

    // Rho and Pi
    const b = new Array<bigint>(25).fill(0n);
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        b[y + 5 * ((2 * x + 3 * y) % 5)] = rotl(state[x + 5 * y], ROTATION[x + 5 * y]);
      }
    }

    // Chi
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        state[x + 5 * y] = b[x + 5 * y] ^ (~b[((x + 1) % 5) + 5 * y] & b[((x + 2) % 5) + 5 * y] & MASK);
      }
    }

    // Iota
    state[0] ^= ROUND_CONSTANTS[round];
  }
}

const RATE_BYTES = 136; // 1600 bits of state minus 512 bits of capacity, in bytes.

export function keccak256(message: Uint8Array): Uint8Array {
  // Pad: 0x01 … 0x80 (original Keccak), filling to a multiple of the rate.
  const padded = new Uint8Array(Math.ceil((message.length + 1) / RATE_BYTES) * RATE_BYTES);
  padded.set(message);
  padded[message.length] = 0x01;
  padded[padded.length - 1] |= 0x80;

  const state = new Array<bigint>(25).fill(0n);

  for (let offset = 0; offset < padded.length; offset += RATE_BYTES) {
    for (let i = 0; i < RATE_BYTES / 8; i++) {
      let lane = 0n;
      // Little-endian within each 8-byte lane.
      for (let byte = 7; byte >= 0; byte--) lane = (lane << 8n) | BigInt(padded[offset + i * 8 + byte]);
      state[i] ^= lane;
    }
    keccakF(state);
  }

  const out = new Uint8Array(32);
  for (let i = 0; i < 4; i++) {
    let lane = state[i];
    for (let byte = 0; byte < 8; byte++) {
      out[i * 8 + byte] = Number(lane & 0xffn);
      lane >>= 8n;
    }
  }
  return out;
}

export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

export const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);

/** Convenience: keccak-256 of a UTF-8 string, as lowercase hex without 0x. */
export const keccakHex = (s: string): string => toHex(keccak256(utf8(s)));
