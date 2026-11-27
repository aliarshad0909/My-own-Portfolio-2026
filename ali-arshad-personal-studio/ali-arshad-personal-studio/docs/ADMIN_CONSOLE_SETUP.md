# Private Studio Admin Console (`/admin`) — Setup & Operations Guide

The private Ali Arshad Personal Studio Admin Console lives inside this Next.js application at `/admin` and is completely excluded from public navigation, `sitemap.xml`, `robots.txt`, and search engine indexing (`X-Robots-Tag: noindex, nofollow, noarchive` + `Cache-Control: no-store, private`).

All credentials live strictly in server-only environment variables — never commit secrets to git or expose them with a `NEXT_PUBLIC_` prefix.

---

## 1. Admin Login & Owner Authentication

The console enforces single-owner authentication using an explicit email allowlist (`ADMIN_EMAIL`), salted `scrypt` password hashing (`ADMIN_PASSWORD_HASH`), HMAC-SHA256 signed `HttpOnly` `SameSite=Lax` cookies (`ADMIN_SESSION_SECRET`), and CSRF tokens on every admin mutation.

1. Run the credential generator locally:
   ```bash
   cd ali-arshad-personal-studio/ali-arshad-personal-studio
   npm run admin:hash-password
   ```
2. Add the generated values to `.env.local` (for local testing) and **Vercel → Project → Settings → Environment Variables**:
   - `ADMIN_EMAIL` — your owner login email (e.g. `a.arshad3001@gmail.com`)
   - `ADMIN_PASSWORD_HASH` — output starting with `scrypt$...`
   - `ADMIN_SESSION_SECRET` — 32+ character random string
   - `ADMIN_ENCRYPTION_KEY` — 32+ character random string (used for AES-256-GCM encryption of stored Gmail OAuth tokens; falls back to `ADMIN_SESSION_SECRET` if omitted)

> Never share your password, hash, or session secret in chat or commit `.env.local`.

---

## 2. Neon PostgreSQL Setup & Migrations

Neon PostgreSQL stores incoming Contact inquiries, private Studio Network moderation applications, internal Projects/Content workflow tasks, encrypted Gmail OAuth tokens, preferences, and lightweight audit entries.

1. Create a PostgreSQL project at [neon.tech](https://neon.tech).
2. Copy **two** connection strings from the Neon dashboard:
   - `DATABASE_URL` — **Pooled** connection string (contains `-pooler` in hostname; used by Vercel serverless runtime via `@neondatabase/serverless`)
   - `DIRECT_DATABASE_URL` — **Direct** (unpooled) connection string (used for schema migrations)
3. Apply the admin schema migration:
   ```bash
   npm run admin:migrate
   ```
   This idempotently executes `db/migrations/001_admin_console.sql`.

---

## 3. Optional Distributed Rate Limiting (Upstash Redis)

Login attempts (`/api/admin/auth/login`) and outbound campaign/social actions are rate limited. Without Upstash, an in-memory sliding window protects single instances; for multi-instance Vercel serverless consistency, connect Upstash Redis REST:

1. Create a free Redis database at [upstash.com](https://upstash.com).
2. Add to Vercel Environment Variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## 4. Transactional Forms (Resend — Existing Public Forms)

The public Contact form (`/contact`) and Studio Network form (`/studio-network`) keep their existing Resend email delivery (`RESEND_API_KEY`, `INQUIRY_TO_EMAIL`, `INQUIRY_FROM_EMAIL`). When `DATABASE_URL` is configured, delivered submissions are also saved in Neon automatically so they appear in `/admin/inbox` (with Studio Network applications strictly remaining `private_pending` by default).

---

## 5. Self-Hosted Listmonk (Email Campaigns)

1. Deploy self-hosted [Listmonk](https://listmonk.app) behind HTTPS (e.g. `https://mail.yourdomain.com` on Hetzner, Railway, Fly.io, or Coolify).
2. In Listmonk → **Settings → Users**, create a dedicated API user and generate an API token with list/campaign permissions.
3. Add environment variables:
   - `LISTMONK_URL` — e.g. `https://mail.yourdomain.com`
   - `LISTMONK_API_USER` — API username
   - `LISTMONK_API_TOKEN` — API token
   - `LISTMONK_ALLOW_LIVE_SEND` — keep `false` during development/preview; set to `true` in Production only when you want confirmed live scheduling/sending enabled.
4. **Outbound Safety Gate:** Even when `LISTMONK_ALLOW_LIVE_SEND=true`, scheduling or starting a campaign requires opening the Final Review modal and typing `CONFIRM SEND`.

---

## 6. Self-Hosted Postiz (Social Publishing)

1. Deploy self-hosted [Postiz](https://postiz.com) behind HTTPS (e.g. `https://social.yourdomain.com`).
2. Inside Postiz, connect your official channels (LinkedIn, Instagram Professional/Business linked to a Meta Page, Facebook Page).
3. In Postiz → **Settings → Public API**, generate a Public API key.
4. Add environment variables:
   - `POSTIZ_URL` — e.g. `https://social.yourdomain.com`
   - `POSTIZ_API_KEY` — Public API key
   - `POSTIZ_ALLOW_LIVE_PUBLISH` — keep `false` during development/preview; set to `true` in Production only when ready for confirmed live publishing/scheduling.
5. **Outbound Safety Gate:** Creating drafts works immediately; live scheduling/publishing requires typing `CONFIRM PUBLISH` on the Final Review modal.

---

## 7. Self-Hosted Twenty CRM (Contacts, Companies, Opportunities, Tasks)

1. Deploy self-hosted [Twenty CRM](https://twenty.com) behind HTTPS (e.g. `https://crm.yourdomain.com`).
2. In Twenty → **Settings → Developers → API Keys**, create an API key.
3. Add environment variables:
   - `TWENTY_URL` — e.g. `https://crm.yourdomain.com`
   - `TWENTY_API_KEY` — REST API bearer token
4. Creating contacts from `/admin/crm` checks existing primary emails in Twenty first to prevent accidental duplicate records.

---

## 8. Official Gmail OAuth 2.0 (Read-Only Inbox Preview)

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create/select a project.
2. Enable the **Gmail API**.
3. Configure the **OAuth Consent Screen** (External → Testing mode with your Gmail address added under **Test users**, or Internal if using Google Workspace) with least-privilege scope:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `openid`
   - `email`
4. Create an **OAuth 2.0 Client ID** (Application type: **Web application**) and add Authorized Redirect URIs:
   - `https://www.aliarshad.co/api/admin/gmail/callback`
   - `http://localhost:3000/api/admin/gmail/callback` (local testing)
5. Add environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (optional; defaults to `${origin}/api/admin/gmail/callback`)
6. Sign into `/admin/integrations` and click **Connect Gmail via Google OAuth**. Tokens are encrypted with AES-256-GCM before storage in Neon. You can revoke/delete stored tokens anytime via **Disconnect Gmail**.

---

## 9. Platform API Limitations (Instagram, LinkedIn, Facebook, Upwork, GitHub)

The console strictly respects official platform policies — it **never** scrapes accounts, automates browser logins, or stores social/Upwork passwords:

- **Instagram:** Official publishing via Postiz requires an Instagram Professional (Business/Creator) account connected to a Meta Page. DMs, follow/unfollow, and live story stickers remain native-only via direct links.
- **LinkedIn:** Official post publishing works via Postiz OAuth. Direct messaging/InMail, connection requests, and comment threads remain native-only.
- **Facebook:** Official Meta Graph publishing supports **Facebook Pages** only (not personal profiles). Messenger and group moderation remain native-only.
- **Upwork:** Upwork does not provide general third-party messaging/proposal automation APIs for individual freelancer accounts. The console provides clean direct shortcuts to your Upwork profile, messages, and proposals.
- **GitHub (Optional):** Set `GITHUB_USERNAME` (and optionally a read-only fine-grained `GITHUB_TOKEN`) for official read-only account/repository status verification.

---

## 10. Local Demo Mode & Secret Rotation

### Local Demo Mode
For local visual testing before live services are connected, set `ADMIN_DEMO_MODE=true` in `.env.local`. Every synthetic placeholder record is clearly badged **DEMO MODE** / **Local Demo** and uses `.example.invalid` domains. Keep `ADMIN_DEMO_MODE=false` (or unset) in Vercel Production.

Optional local DB demo seeder (requires both env flag and CLI flag):
```bash
ADMIN_DEMO_MODE=true npm run admin:seed-demo -- --confirm-demo
```

### Secret Rotation Checklist
- **Admin Password:** Run `npm run admin:hash-password`, replace `ADMIN_PASSWORD_HASH` in Vercel, and redeploy.
- **Session Secret (`ADMIN_SESSION_SECRET`):** Replacing this immediately invalidates all existing admin sessions across all devices.
- **Encryption Key (`ADMIN_ENCRYPTION_KEY`):** Disconnect Gmail before rotating `ADMIN_ENCRYPTION_KEY`, rotate the env var and redeploy, then reconnect Gmail so tokens are re-encrypted under the new key.
- **Service API Keys (Listmonk / Postiz / Twenty / Resend / Upstash / Google):** Create a fresh key in the respective provider dashboard, update the Vercel Environment Variable, redeploy, verify green status in `/admin/integrations`, and revoke the old key.
