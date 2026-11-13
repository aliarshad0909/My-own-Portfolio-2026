import { keccakHex } from "./keccak.ts";

/** EIP-55: mixed-case checksum encoding for Ethereum addresses. */

const HEX40 = /^0x[0-9a-fA-F]{40}$/;

export const isAddressShape = (value: string): boolean => HEX40.test(value.trim());

/**
 * Apply the EIP-55 checksum. The rule: hash the lowercase address (without
 * 0x) and uppercase each hex letter whose corresponding hash nibble is >= 8.
 */
export function toChecksumAddress(address: string): string {
  const trimmed = address.trim();
  if (!isAddressShape(trimmed)) throw new Error(`"${address}" is not a 20-byte hex address`);
  const lower = trimmed.slice(2).toLowerCase();
  const hash = keccakHex(lower);
  let out = "0x";
  for (let i = 0; i < 40; i++) {
    const char = lower[i];
    out += parseInt(hash[i], 16) >= 8 ? char.toUpperCase() : char;
  }
  return out;
}

export type AddressCheck =
  | { valid: true; checksummed: string; wasMixedCase: boolean; checksumValid: true }
  | { valid: false; reason: string; checksummed?: string };

/**
 * Validate an address the way a block explorer should: an all-lowercase or
 * all-uppercase address is acceptable (no checksum to verify), but a mixed-case
 * address with a wrong checksum is rejected rather than silently corrected.
 * That mixed case is the whole point of EIP-55 — it catches typos.
 */
export function checkAddress(input: string): AddressCheck {
  const value = input.trim();
  if (value === "") return { valid: false, reason: "Enter an address." };
  if (!value.startsWith("0x")) return { valid: false, reason: "An address starts with 0x." };
  if (value.length !== 42) return { valid: false, reason: `An address is 42 characters including 0x; this is ${value.length}.` };
  if (!HEX40.test(value)) return { valid: false, reason: "An address contains only hex digits after 0x." };

  const body = value.slice(2);
  const mixed = body !== body.toLowerCase() && body !== body.toUpperCase();
  const checksummed = toChecksumAddress(value);

  if (mixed && checksummed !== value) {
    return { valid: false, reason: "Checksum does not match — this address has a typo in it.", checksummed };
  }
  return { valid: true, checksummed, wasMixedCase: mixed, checksumValid: true };
}

/** Shorten for display: 0x1234…abcd. Never used where the full value matters. */
export const shorten = (value: string, lead = 6, tail = 4): string =>
  value.length <= lead + tail + 1 ? value : `${value.slice(0, lead)}…${value.slice(-tail)}`;

/** The 32-byte topic for an event signature, e.g. "Transfer(address,address,uint256)". */
export const eventTopic = (signature: string): string => `0x${keccakHex(signature)}`;

/** The 4-byte selector for a function signature, e.g. "transfer(address,uint256)". */
export const functionSelector = (signature: string): string => `0x${keccakHex(signature).slice(0, 8)}`;
