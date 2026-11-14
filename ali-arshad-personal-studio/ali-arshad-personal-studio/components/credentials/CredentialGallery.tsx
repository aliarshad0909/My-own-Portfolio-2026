import { CredentialCard } from "@/components/credentials/CredentialCard";
import { visibleCredentials } from "@/lib/credentials";

/** Full gallery for /experience, and the compact variant for Home and About. */
export function CredentialGallery({ compact = false, limit }: { compact?: boolean; limit?: number }) {
  const list = visibleCredentials().slice(0, limit);
  if (list.length === 0) return null;
  return (
    <div className={`cred-grid ${compact ? "cred-grid--compact" : ""}`.trim()}>
      {list.map((c) => (
        <CredentialCard key={c.id} credential={c} compact={compact} />
      ))}
    </div>
  );
}
