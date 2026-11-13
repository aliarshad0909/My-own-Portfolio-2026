import { Asn1Error, TAG, decodeOid, decodeString, decodeTime, parseDer, pemToDer, type Asn1Node } from "./asn1.ts";

/**
 * Read an X.509 certificate's own assertions.
 *
 * NOT verified here, and the interface says so: the signature, the chain to a
 * trusted root, and revocation. A page cannot check any of those, so this
 * reports what the certificate claims and flags what is checkable from the
 * document alone — expiry, key size, signature algorithm, name coverage.
 */

const OIDS: Record<string, string> = {
  "2.5.4.3": "CN", "2.5.4.6": "C", "2.5.4.7": "L", "2.5.4.8": "ST",
  "2.5.4.10": "O", "2.5.4.11": "OU", "1.2.840.113549.1.9.1": "emailAddress",
};

const SIGNATURE_ALGORITHMS: Record<string, { name: string; weak: boolean; reason?: string }> = {
  "1.2.840.113549.1.1.5": { name: "sha1WithRSAEncryption", weak: true, reason: "SHA-1 is collision-broken and rejected by every major browser." },
  "1.2.840.113549.1.1.4": { name: "md5WithRSAEncryption", weak: true, reason: "MD5 is comprehensively broken." },
  "1.2.840.113549.1.1.11": { name: "sha256WithRSAEncryption", weak: false },
  "1.2.840.113549.1.1.12": { name: "sha384WithRSAEncryption", weak: false },
  "1.2.840.113549.1.1.13": { name: "sha512WithRSAEncryption", weak: false },
  "1.2.840.10045.4.3.2": { name: "ecdsa-with-SHA256", weak: false },
  "1.2.840.10045.4.3.3": { name: "ecdsa-with-SHA384", weak: false },
};

const KEY_ALGORITHMS: Record<string, string> = {
  "1.2.840.113549.1.1.1": "RSA",
  "1.2.840.10045.2.1": "EC",
  "1.3.101.112": "Ed25519",
};

const EXT_SAN = "2.5.29.17";
const EXT_BASIC_CONSTRAINTS = "2.5.29.19";
const EXT_KEY_USAGE = "2.5.29.15";
const EXT_EXT_KEY_USAGE = "2.5.29.37";

export type Certificate = {
  version: number;
  serialNumber: string;
  subject: Record<string, string>;
  subjectText: string;
  issuer: Record<string, string>;
  issuerText: string;
  notBefore: Date;
  notAfter: Date;
  signatureAlgorithm: { oid: string; name: string; weak: boolean; reason?: string };
  publicKey: { algorithm: string; oid: string; bits: number | null };
  sans: string[];
  isCa: boolean;
  selfIssued: boolean;
};

const nameToRecord = (node: Asn1Node): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const rdn of node.children) {
    for (const pair of rdn.children) {
      const [oidNode, valueNode] = pair.children;
      if (!oidNode || !valueNode) continue;
      const key = OIDS[decodeOid(oidNode.value)] ?? decodeOid(oidNode.value);
      out[key] = decodeString(valueNode.value);
    }
  }
  return out;
};

const nameText = (record: Record<string, string>): string =>
  Object.entries(record).map(([k, v]) => `${k}=${v}`).join(", ");

/** Decode a GeneralNames SEQUENCE: dNSName is context tag 2, iPAddress is 7. */
function decodeSans(extensionValue: Uint8Array): string[] {
  const [seq] = parseDer(extensionValue);
  if (!seq) return [];
  const out: string[] = [];
  for (const entry of seq.children) {
    const kind = entry.tag & 0x1f;
    if (kind === 2) out.push(decodeString(entry.value));
    else if (kind === 7) {
      const b = entry.value;
      if (b.length === 4) out.push(Array.from(b).join("."));
      else if (b.length === 16) out.push(Array.from({ length: 8 }, (_, i) => ((b[i * 2] << 8) | b[i * 2 + 1]).toString(16)).join(":"));
    }
  }
  return out;
}

/** RSA key size, from the modulus length inside the SubjectPublicKeyInfo BIT STRING. */
function rsaKeyBits(bitString: Uint8Array): number | null {
  try {
    // The first byte of a BIT STRING is the count of unused bits.
    const [seq] = parseDer(bitString.subarray(1));
    const modulus = seq?.children[0];
    if (!modulus) return null;
    let bytes = modulus.value;
    // DER pads a positive INTEGER with a leading zero byte.
    if (bytes[0] === 0) bytes = bytes.subarray(1);
    return bytes.length * 8;
  } catch {
    return null;
  }
}

const EC_CURVE_BITS: Record<string, number> = {
  "1.2.840.10045.3.1.7": 256, // prime256v1
  "1.3.132.0.34": 384,        // secp384r1
  "1.3.132.0.35": 521,        // secp521r1
};

export function parseCertificate(pem: string): Certificate {
  const der = pemToDer(pem);
  const [root] = parseDer(der);
  if (!root || root.tag !== TAG.SEQUENCE) throw new Asn1Error("The top level of a certificate must be a SEQUENCE.");

  const [tbs, sigAlgNode] = root.children;
  if (!tbs) throw new Asn1Error("No tbsCertificate found.");

  let i = 0;
  // [0] EXPLICIT Version DEFAULT v1
  let version = 1;
  if ((tbs.children[0].tag & 0xa0) === 0xa0 && (tbs.children[0].tag & 0x1f) === 0) {
    version = Number(tbs.children[0].children[0]?.value[0] ?? 0) + 1;
    i = 1;
  }

  const serialNode = tbs.children[i++];
  const serialNumber = Array.from(serialNode.value, (b) => b.toString(16).padStart(2, "0")).join(":");
  i++; // inner signature algorithm; the outer one is authoritative
  const issuer = nameToRecord(tbs.children[i++]);
  const validity = tbs.children[i++];
  const subject = nameToRecord(tbs.children[i++]);
  const spki = tbs.children[i++];

  const notBefore = decodeTime(validity.children[0]);
  const notAfter = decodeTime(validity.children[1]);

  const sigOid = decodeOid(sigAlgNode.children[0].value);
  const signature = SIGNATURE_ALGORITHMS[sigOid] ?? { name: `unrecognised (${sigOid})`, weak: false };

  const keyOid = decodeOid(spki.children[0].children[0].value);
  const keyAlgorithm = KEY_ALGORITHMS[keyOid] ?? `unrecognised (${keyOid})`;
  let bits: number | null = null;
  if (keyAlgorithm === "RSA") bits = rsaKeyBits(spki.children[1].value);
  else if (keyAlgorithm === "EC") {
    const curveNode = spki.children[0].children[1];
    if (curveNode?.tag === TAG.OID) bits = EC_CURVE_BITS[decodeOid(curveNode.value)] ?? null;
  } else if (keyAlgorithm === "Ed25519") bits = 256;

  let sans: string[] = [];
  let isCa = false;
  const extensionsNode = tbs.children.find((c) => (c.tag & 0x1f) === 3 && (c.tag & 0xa0) === 0xa0);
  if (extensionsNode) {
    for (const ext of extensionsNode.children[0]?.children ?? []) {
      const oid = decodeOid(ext.children[0].value);
      const valueNode = ext.children[ext.children.length - 1];
      if (oid === EXT_SAN) sans = decodeSans(valueNode.value);
      if (oid === EXT_BASIC_CONSTRAINTS) {
        const [seq] = parseDer(valueNode.value);
        isCa = seq?.children[0]?.tag === TAG.BOOLEAN && seq.children[0].value[0] !== 0;
      }
    }
  }

  const subjectText = nameText(subject);
  const issuerText = nameText(issuer);

  return {
    version,
    serialNumber,
    subject, subjectText,
    issuer, issuerText,
    notBefore, notAfter,
    signatureAlgorithm: { oid: sigOid, ...signature },
    publicKey: { algorithm: keyAlgorithm, oid: keyOid, bits },
    sans,
    isCa,
    selfIssued: subjectText === issuerText,
  };
}

/* ---------------- assessment ---------------- */

export type Severity = "critical" | "high" | "medium" | "low" | "info" | "pass";

export type Finding = { severity: Severity; title: string; detail: string };

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info", "pass"];

export function assessCertificate(cert: Certificate, now = new Date(), hostname?: string): Finding[] {
  const findings: Finding[] = [];
  const day = 86_400_000;
  const daysLeft = Math.floor((cert.notAfter.getTime() - now.getTime()) / day);
  const lifetimeDays = Math.round((cert.notAfter.getTime() - cert.notBefore.getTime()) / day);

  if (now < cert.notBefore) {
    findings.push({ severity: "critical", title: "Not yet valid", detail: `This certificate does not become valid until ${cert.notBefore.toISOString().slice(0, 10)}. Browsers will reject it.` });
  } else if (daysLeft < 0) {
    findings.push({ severity: "critical", title: "Expired", detail: `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} ago, on ${cert.notAfter.toISOString().slice(0, 10)}. Browsers will refuse the connection.` });
  } else if (daysLeft <= 7) {
    findings.push({ severity: "high", title: `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`, detail: "Renew now. Automated renewal usually runs at 30 days; if it has not fired, it is failing." });
  } else if (daysLeft <= 30) {
    findings.push({ severity: "medium", title: `Expires in ${daysLeft} days`, detail: "Inside the usual renewal window. Confirm automated renewal is working." });
  } else {
    findings.push({ severity: "pass", title: `Valid for ${daysLeft} more days`, detail: `Expires ${cert.notAfter.toISOString().slice(0, 10)}.` });
  }

  if (cert.signatureAlgorithm.weak) {
    findings.push({ severity: "critical", title: `Weak signature algorithm: ${cert.signatureAlgorithm.name}`, detail: cert.signatureAlgorithm.reason ?? "This algorithm is no longer trusted." });
  } else {
    findings.push({ severity: "pass", title: `Signed with ${cert.signatureAlgorithm.name}`, detail: "A currently accepted signature algorithm." });
  }

  if (cert.publicKey.algorithm === "RSA" && cert.publicKey.bits !== null) {
    if (cert.publicKey.bits < 2048) {
      findings.push({ severity: "critical", title: `RSA key is only ${cert.publicKey.bits} bits`, detail: "2048 bits is the accepted minimum. Anything smaller is rejected by browsers and CAs." });
    } else {
      findings.push({ severity: "pass", title: `RSA ${cert.publicKey.bits}-bit key`, detail: "At or above the 2048-bit minimum." });
    }
  } else if (cert.publicKey.bits !== null) {
    findings.push({ severity: "pass", title: `${cert.publicKey.algorithm} ${cert.publicKey.bits}-bit key`, detail: "Elliptic-curve keys of this size are current practice." });
  }

  if (cert.selfIssued) {
    findings.push({ severity: "high", title: "Self-signed", detail: "Subject and issuer are identical, so no certificate authority vouches for it. Browsers will warn unless this root is installed locally." });
  }

  if (cert.sans.length === 0) {
    findings.push({ severity: "high", title: "No subjectAltName", detail: "Browsers have ignored the subject Common Name for host matching since 2017. A certificate with no SAN matches nothing." });
  } else {
    findings.push({ severity: "info", title: `Covers ${cert.sans.length} name${cert.sans.length === 1 ? "" : "s"}`, detail: cert.sans.join(", ") });
  }

  if (hostname) {
    const matched = cert.sans.some((san) => matchesHost(san, hostname));
    findings.push(
      matched
        ? { severity: "pass", title: `Covers ${hostname}`, detail: "The hostname you gave is in the subjectAltName list." }
        : { severity: "critical", title: `Does not cover ${hostname}`, detail: `The names on this certificate are: ${cert.sans.join(", ") || "none"}.` },
    );
  }

  if (lifetimeDays > 400) {
    findings.push({ severity: "medium", title: `Lifetime is ${lifetimeDays} days`, detail: "Since September 2020 browsers reject publicly trusted certificates with a lifetime over 398 days." });
  }

  if (cert.isCa) {
    findings.push({ severity: "info", title: "Basic constraints say this is a CA", detail: "A CA certificate should not be serving a website directly." });
  }

  return findings;
}

/** Wildcard matching as browsers do it: one label, leftmost only. */
export function matchesHost(san: string, hostname: string): boolean {
  const pattern = san.toLowerCase();
  const host = hostname.toLowerCase();
  if (!pattern.startsWith("*.")) return pattern === host;
  const suffix = pattern.slice(1); // ".example.com"
  if (!host.endsWith(suffix)) return false;
  const label = host.slice(0, host.length - suffix.length);
  return label.length > 0 && !label.includes(".");
}
