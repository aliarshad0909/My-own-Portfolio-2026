import { CredentialGallery } from "@/components/credentials/CredentialGallery";
import { ArrowLink } from "@/components/ui/Button";
import { visibleCredentials } from "@/lib/credentials";

/** Compact credentials preview. Shares one data module with /experience and /about. */
export function CredentialsPreview() {
  const credentials = visibleCredentials();
  if (credentials.length === 0) return null;

  return (
    <section className="section section--surface" aria-labelledby="home-creds-title">
      <div className="container">
        <div className="section-head section-head--row reveal">
          <div>
            <p className="eyebrow eyebrow--plain">Credentials</p>
            <h2 className="section-title" id="home-creds-title">
              Continuously learning. Practically applying.
            </h2>
          </div>
          <ArrowLink href="/experience#creds-title">All credentials</ArrowLink>
        </div>
        <div className="reveal">
          <CredentialGallery compact limit={2} />
        </div>
      </div>
    </section>
  );
}
