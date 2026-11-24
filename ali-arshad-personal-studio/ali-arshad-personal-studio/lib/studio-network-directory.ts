/**
 * Privacy-first directory & admin moderation helpers for the Studio Network Globe.
 * Server-only module: never import directly from client components.
 */
import crypto from "node:crypto";
import {
  VERIFIED_COLLABORATORS,
  filterPublicGlobeCollaborators,
  findCoarseRegion,
  type CollaboratorDirectoryRecord,
  type ModerationStatus,
} from "@/lib/studio-network";

const env = (k: string) => (process.env[k] ?? "").trim();

export type ModerationActionInput = {
  collaboratorId: string;
  action: "approve" | "reject" | "revoke";
  name?: string;
  role?: string;
  regionId?: string;
  approximateLocation?: string;
  specialty?: string;
  publicOptInConfirmed?: boolean;
  verified?: boolean;
  reason?: string;
};

export function isModerationConfigured(): boolean {
  return env("STUDIO_NETWORK_ADMIN_TOKEN") !== "" && env("STUDIO_NETWORK_MODERATION_WEBHOOK_URL") !== "";
}

export function verifyModerationToken(authHeader: string | null): boolean {
  const expected = env("STUDIO_NETWORK_ADMIN_TOKEN");
  if (!expected || !authHeader) return false;
  const prefix = "Bearer ";
  if (!authHeader.startsWith(prefix)) return false;
  const provided = authHeader.slice(prefix.length).trim();
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function validateModerationAction(raw: Record<string, unknown>): {
  ok: true;
  data: ModerationActionInput;
} | {
  ok: false;
  error: string;
} {
  const collaboratorId = typeof raw.collaboratorId === "string" ? raw.collaboratorId.trim() : "";
  const action = typeof raw.action === "string" ? raw.action.trim() : "";
  if (!collaboratorId || collaboratorId.length > 80) {
    return { ok: false, error: "A valid collaboratorId is required." };
  }
  if (action !== "approve" && action !== "reject" && action !== "revoke") {
    return { ok: false, error: "Action must be one of approve, reject, or revoke." };
  }

  if (action === "approve") {
    if (raw.publicOptInConfirmed !== true || raw.verified !== true) {
      return {
        ok: false,
        error: "Approval requires both verified=true and explicit publicOptInConfirmed=true.",
      };
    }
    const regionId = typeof raw.regionId === "string" ? raw.regionId.trim() : "";
    if (!findCoarseRegion(regionId)) {
      return {
        ok: false,
        error: "Approval requires a valid coarse regionId so exact addresses are never published.",
      };
    }
    return {
      ok: true,
      data: {
        collaboratorId,
        action,
        name: typeof raw.name === "string" ? raw.name.trim().slice(0, 100) : undefined,
        role: typeof raw.role === "string" ? raw.role.trim().slice(0, 100) : undefined,
        regionId,
        approximateLocation:
          typeof raw.approximateLocation === "string" ? raw.approximateLocation.trim().slice(0, 100) : undefined,
        specialty: typeof raw.specialty === "string" ? raw.specialty.trim().slice(0, 180) : undefined,
        publicOptInConfirmed: true,
        verified: true,
      },
    };
  }

  return {
    ok: true,
    data: {
      collaboratorId,
      action,
      reason: typeof raw.reason === "string" ? raw.reason.trim().slice(0, 300) : undefined,
    },
  };
}

/**
 * Loads ONLY explicitly verified, approved, public-opt-in collaborators for the globe.
 * Optionally merges a strictly parsed JSON list from STUDIO_NETWORK_APPROVED_JSON when configured.
 * Returns an empty array when no verified collaborator has approved public listing.
 */
export function loadApprovedPublicCollaborators() {
  const combined: CollaboratorDirectoryRecord[] = [...VERIFIED_COLLABORATORS];
  const envJson = env("STUDIO_NETWORK_APPROVED_JSON");
  if (envJson) {
    try {
      const parsed: unknown = JSON.parse(envJson);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item !== "object" || item === null) continue;
          const rec = item as Record<string, unknown>;
          const status = rec.moderationStatus as ModerationStatus;
          combined.push({
            id: typeof rec.id === "string" ? rec.id : "",
            name: typeof rec.name === "string" ? rec.name : "",
            role: typeof rec.role === "string" ? rec.role : "",
            approximateLocation: typeof rec.approximateLocation === "string" ? rec.approximateLocation : "",
            regionId: typeof rec.regionId === "string" ? rec.regionId : "",
            specialty: typeof rec.specialty === "string" ? rec.specialty : "",
            portfolioUrl: typeof rec.portfolioUrl === "string" ? rec.portfolioUrl : undefined,
            consentConfirmed: rec.consentConfirmed === true,
            publicOptInConfirmed: rec.publicOptInConfirmed === true,
            verified: rec.verified === true,
            moderationStatus: status,
          });
        }
      }
    } catch {
      // Malformed env JSON fails closed to empty rather than leaking data.
    }
  }
  return filterPublicGlobeCollaborators(combined);
}

export async function forwardModerationDecision(decision: ModerationActionInput): Promise<boolean> {
  const url = env("STUDIO_NETWORK_MODERATION_WEBHOOK_URL");
  if (!url) return false;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = env("STUDIO_NETWORK_WEBHOOK_SECRET") || env("INQUIRY_WEBHOOK_SECRET");
  if (secret) headers["x-inquiry-secret"] = secret;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source: "ali-arshad-studio-network-moderation",
      decidedAt: new Date().toISOString(),
      decision,
    }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  return res.ok;
}
