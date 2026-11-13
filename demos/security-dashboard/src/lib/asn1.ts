/**
 * Just enough DER/ASN.1 to read an X.509 certificate.
 *
 * This parses the structure defined in RFC 5280. It does NOT verify
 * signatures, build chains or check revocation — a browser cannot do those,
 * and claiming otherwise would be worse than not offering it. What it reads
 * is the certificate's own assertions: who it is for, who issued it, when it
 * is valid, how it is signed and how big the key is.
 */

export type Asn1Node = {
  tag: number;
  /** Class and constructed bits, already split out. */
  constructed: boolean;
  /** Raw contents, excluding tag and length bytes. */
  value: Uint8Array;
  children: Asn1Node[];
  /** Offset of the whole element in the source buffer, for debugging. */
  start: number;
  end: number;
};

export const TAG = {
  BOOLEAN: 0x01, INTEGER: 0x02, BIT_STRING: 0x03, OCTET_STRING: 0x04, NULL: 0x05,
  OID: 0x06, UTF8_STRING: 0x0c, SEQUENCE: 0x30, SET: 0x31,
  PRINTABLE_STRING: 0x13, IA5_STRING: 0x16, UTC_TIME: 0x17, GENERALIZED_TIME: 0x18,
} as const;

export class Asn1Error extends Error {}

export function parseDer(bytes: Uint8Array, offset = 0, limit = bytes.length): Asn1Node[] {
  const nodes: Asn1Node[] = [];
  let i = offset;

  while (i < limit) {
    const start = i;
    const tagByte = bytes[i++];
    if (tagByte === undefined) throw new Asn1Error("Truncated: expected a tag");
    if ((tagByte & 0x1f) === 0x1f) throw new Asn1Error("Multi-byte tags are not supported");

    let length = bytes[i++];
    if (length === undefined) throw new Asn1Error("Truncated: expected a length");
    if (length & 0x80) {
      const count = length & 0x7f;
      if (count === 0) throw new Asn1Error("Indefinite lengths are not valid DER");
      if (count > 4) throw new Asn1Error(`Length of ${count} bytes is implausible for a certificate`);
      length = 0;
      for (let n = 0; n < count; n++) length = (length << 8) | bytes[i++];
    }

    const end = i + length;
    if (end > limit) throw new Asn1Error(`Element at ${start} claims ${length} bytes but only ${limit - i} remain`);

    const constructed = (tagByte & 0x20) !== 0;
    const value = bytes.subarray(i, end);
    nodes.push({
      tag: tagByte,
      constructed,
      value,
      children: constructed ? parseDer(bytes, i, end) : [],
      start,
      end,
    });
    i = end;
  }

  return nodes;
}

/** Decode an OID from its DER contents, e.g. 1.2.840.113549.1.1.11 */
export function decodeOid(bytes: Uint8Array): string {
  if (bytes.length === 0) throw new Asn1Error("Empty OID");
  const parts: number[] = [Math.floor(bytes[0] / 40), bytes[0] % 40];
  let value = 0;
  for (let i = 1; i < bytes.length; i++) {
    value = (value << 7) | (bytes[i] & 0x7f);
    if ((bytes[i] & 0x80) === 0) { parts.push(value); value = 0; }
  }
  return parts.join(".");
}

const decoder = new TextDecoder();
export const decodeString = (bytes: Uint8Array): string => decoder.decode(bytes);

/**
 * UTCTime is YYMMDDHHMMSSZ with a 2-digit year; RFC 5280 says 50-99 means
 * 19xx and 00-49 means 20xx. GeneralizedTime carries all four digits.
 */
export function decodeTime(node: Asn1Node): Date {
  const text = decodeString(node.value).trim();
  const m = node.tag === TAG.GENERALIZED_TIME
    ? /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z$/.exec(text)
    : /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z$/.exec(text);
  if (!m) throw new Asn1Error(`"${text}" is not a valid ASN.1 time`);
  let year = Number(m[1]);
  if (node.tag === TAG.UTC_TIME) year = year >= 50 ? 1900 + year : 2000 + year;
  return new Date(Date.UTC(year, Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0)));
}

export function pemToDer(pem: string): Uint8Array {
  const match = /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/.exec(pem);
  if (!match) throw new Asn1Error("No PEM certificate block found. Paste the text between BEGIN and END CERTIFICATE.");
  const base64 = match[1].replace(/\s+/g, "");
  if (base64.length === 0) throw new Asn1Error("The PEM block is empty.");
  let binary: string;
  try {
    binary = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
  } catch {
    throw new Asn1Error("The PEM block is not valid base64.");
  }
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
