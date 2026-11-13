/**
 * Hex and unit handling. Everything on an EVM chain is an arbitrary-precision
 * integer, so every value here is a bigint. A balance in wei overflows a JS
 * number at around 9 ETH worth of precision; using floats would silently
 * corrupt values, so there are none.
 */

export function hexToBigInt(hex: string): bigint {
  const value = hex.trim();
  if (!/^0x[0-9a-fA-F]*$/.test(value)) throw new Error(`"${hex}" is not a hex quantity`);
  return value === "0x" ? 0n : BigInt(value);
}

export const bigIntToHex = (value: bigint): string => {
  if (value < 0n) throw new Error("Quantities are unsigned");
  return `0x${value.toString(16)}`;
};

export const hexToNumber = (hex: string): number => {
  const value = hexToBigInt(hex);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`${value} exceeds safe integer range — keep it a bigint`);
  return Number(value);
};

export const WEI_PER_ETHER = 10n ** 18n;
export const WEI_PER_GWEI = 10n ** 9n;

/**
 * Format wei as a decimal string with the given number of fraction digits,
 * truncating rather than rounding — an explorer should never show more than
 * the chain holds.
 */
export function formatUnits(wei: bigint, decimals = 18, maxFractionDigits = 6): string {
  const negative = wei < 0n;
  const value = negative ? -wei : wei;
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;

  let fractionStr = fraction.toString().padStart(decimals, "0").slice(0, maxFractionDigits).replace(/0+$/, "");
  const wholeStr = whole.toLocaleString("en-US");
  return `${negative ? "-" : ""}${wholeStr}${fractionStr ? `.${fractionStr}` : ""}`;
}

export const formatEther = (wei: bigint, maxFractionDigits = 6): string => formatUnits(wei, 18, maxFractionDigits);
export const formatGwei = (wei: bigint, maxFractionDigits = 3): string => formatUnits(wei, 9, maxFractionDigits);

/** Parse a decimal ether string into wei without going through a float. */
export function parseEther(value: string): bigint {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) throw new Error(`"${value}" is not a decimal amount`);
  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > 18) throw new Error("Ether has at most 18 decimal places");
  return BigInt(whole) * WEI_PER_ETHER + BigInt(fraction.padEnd(18, "0") || "0");
}

/** Seconds since the epoch to a readable UTC string, plus a relative age. */
export function formatTimestamp(seconds: number, now = Date.now()): { utc: string; age: string } {
  const date = new Date(seconds * 1000);
  const utc = date.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
  const deltaSeconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  const units: [limit: number, size: number, name: string][] = [
    [60, 1, "second"],
    [3600, 60, "minute"],
    [86400, 3600, "hour"],
    [2592000, 86400, "day"],
    [31536000, 2592000, "month"],
    [Infinity, 31536000, "year"],
  ];
  for (const [limit, size, name] of units) {
    if (deltaSeconds < limit) {
      const n = Math.floor(deltaSeconds / size);
      if (name === "second" && n < 10) return { utc, age: "just now" };
      return { utc, age: `${n} ${name}${n === 1 ? "" : "s"} ago` };
    }
  }
  return { utc, age: utc };
}
