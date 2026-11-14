/**
 * Professional credentials.
 *
 * Only what the issuing record states goes in here. Dates, codes and
 * verification URLs are copied from the certificate or its verifiable
 * credential, never inferred. Identity hashes, salts and cryptographic proof
 * values from a verifiable-credential file are deliberately NOT stored: they
 * are not public display fields.
 *
 * A credential with no `image` still renders fully — the HTML text is the
 * record; the image is a preview of it.
 */

export type CredentialStatus = "active" | "expired" | "hidden";

export type Credential = {
  id: string;
  /** The exact title as the issuer states it. */
  title: string;
  /** What the certificate document itself says, where it differs from the programme title. */
  displayTitle?: string;
  issuer: string;
  /** Programme the issuer runs it under, where that adds clarity (e.g. "Google Ads" under Skillshop). */
  programme?: string;
  /** ISO dates. */
  issued: string;
  expires?: string;
  /** Issuer's own identifier for this award, printed on the certificate. */
  credentialId?: string;
  /** Public verification page. Omitted when the issuer did not provide one. */
  verifyUrl?: string;
  /** Certificate image in /public, plus a smaller thumb for cards. */
  image?: { src: string; thumb: string; alt: string; width: number; height: number };
  /** What the issuer says the holder was tested on. */
  skills: string[];
  status: CredentialStatus;
  /** Two-letter monogram for the card when no issuer mark is used. */
  mark: string;
};

export const CREDENTIALS: Credential[] = [
  {
    id: "hubspot-social-media",
    title: "Social Media Certification",
    displayTitle: "Social Media Certified",
    issuer: "HubSpot Academy",
    issued: "2026-11-13",
    expires: "2028-12-12",
    credentialId: "f9cb74ed82ff4ebcbeb0e722df777698",
    // HubSpot did not supply a public verification URL with this award.
    image: {
      src: "/images/credentials/hubspot-social-media-certified.webp",
      thumb: "/images/credentials/hubspot-social-media-certified-thumb.webp",
      alt: "HubSpot Academy certificate: Social Media Certified, awarded to Ali Arshad, valid from 13 November 2026 to 12 December 2028",
      width: 1140,
      height: 880,
    },
    skills: ["Inbound social media strategy", "Social media monitoring", "Content strategy", "Social engagement", "Social media policies", "Social ROI"],
    status: "active",
    mark: "Hs",
  },
  {
    id: "google-ai-performance-ads",
    title: "AI-Powered Performance Ads Certification",
    issuer: "Skillshop",
    programme: "Google Ads",
    issued: "2026-11-13",
    expires: "2027-11-13",
    verifyUrl: "https://www.credential.net/6fad85ef-9b36-44ef-865f-2e5ad5f92e82",
    // The certificate artwork is hosted by the issuer; add a local copy under
    // /images/credentials/ and set `image` here to show it on the card.
    skills: ["AI-powered Google Ads campaigns", "Cross-channel AI solutions", "Campaign optimisation", "AI automation strategy", "Reporting and insights", "Budget flexibility"],
    status: "active",
    mark: "Ga",
  },
];

export const visibleCredentials = () => CREDENTIALS.filter((c) => c.status !== "hidden");

export const getCredential = (id: string) => CREDENTIALS.find((c) => c.id === id);

/** "13 Nov 2026" — short, unambiguous, same everywhere. */
export function formatCredentialDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}

/** Whether a credential has lapsed as of a given date; drives the badge, not the status field. */
export const isExpired = (c: Credential, now = new Date()): boolean =>
  c.expires !== undefined && new Date(`${c.expires}T23:59:59Z`).getTime() < now.getTime();
