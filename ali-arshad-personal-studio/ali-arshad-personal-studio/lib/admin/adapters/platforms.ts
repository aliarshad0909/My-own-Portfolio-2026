/**
 * Server-only social & freelance platform directory with honest official API boundaries
 * and optional read-only GitHub REST API status check.
 * Never automates browser logins, never scrapes profiles, never stores social passwords.
 */
import { envVar } from "@/lib/form-security";
import type { PlatformAccountCard, PostizChannel, ServiceHealthState } from "@/lib/admin/types";
import { FREELANCE, SITE } from "@/lib/site";

function socialProfileUrl(icon: "linkedin" | "instagram" | "facebook" | "github", fallback: string): string {
  const match = SITE.socials.find((s) => s.icon === icon)?.url?.trim();
  return match || fallback;
}

export async function checkGitHubStatus(): Promise<{
  state: ServiceHealthState;
  detail: string;
  profileUrl: string;
  publicRepos?: number;
}> {
  const username = envVar("GITHUB_USERNAME");
  const token = envVar("GITHUB_TOKEN");
  const fallbackUrl = socialProfileUrl("github", "https://github.com");

  if (!username) {
    return {
      state: "needs_setup",
      detail: "Optional. Add GITHUB_USERNAME (and optional read-only GITHUB_TOKEN) to display live GitHub repository status.",
      profileUrl: fallbackUrl,
    };
  }

  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "ali-arshad-studio-admin",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers,
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      return {
        state: "error",
        detail: `GitHub API returned HTTP ${res.status}. Check GITHUB_TOKEN scope or API rate limit.`,
        profileUrl: `https://github.com/${username}`,
      };
    }
    if (!res.ok) {
      return {
        state: "error",
        detail: `GitHub API returned HTTP ${res.status} for user "${username}".`,
        profileUrl: `https://github.com/${username}`,
      };
    }

    const data = (await res.json()) as { html_url?: string; public_repos?: number; followers?: number };
    const repos = Number(data.public_repos ?? 0);
    return {
      state: "connected",
      detail: `GitHub connected (@${username} — ${repos} public repos, read-only official API).`,
      profileUrl: data.html_url || `https://github.com/${username}`,
      publicRepos: repos,
    };
  } catch {
    return {
      state: "offline",
      detail: "Could not reach api.github.com.",
      profileUrl: `https://github.com/${username}`,
    };
  }
}

export function buildPlatformCards(
  postizChannels: PostizChannel[],
  githubStatus: { state: ServiceHealthState; detail: string; profileUrl: string },
): PlatformAccountCard[] {
  const hasChannel = (needle: string) =>
    postizChannels.some((c) => !c.isDemo && c.provider.toLowerCase().includes(needle));

  const igConnected = hasChannel("instagram");
  const liConnected = hasChannel("linkedin");
  const fbConnected = hasChannel("facebook");

  const igUrl = socialProfileUrl("instagram", "https://www.instagram.com/aliarshad.co/");
  const liUrl = socialProfileUrl("linkedin", "https://www.linkedin.com/in/aliarshad09/");
  const fbUrl = socialProfileUrl("facebook", "https://www.facebook.com/profile.php?id=61589134283009");
  const upworkUrl = FREELANCE.upwork.url;

  return [
    {
      id: "instagram",
      name: "Instagram",
      profileUrl: igUrl,
      connectionState: igConnected ? "connected" : "needs_setup",
      connectionNote: igConnected
        ? "Instagram Business/Creator channel connected via Postiz official API."
        : "Not connected in Postiz yet. Requires an Instagram Professional account linked to a Meta Page.",
      supportedViaConsole: [
        "Draft, schedule, and publish approved feed/carousel posts via self-hosted Postiz",
        "Track post queue status and confirmation audit trail",
      ],
      nativeOnlyActions: [
        "Direct messages (DMs) & message requests",
        "Follow / unfollow actions & profile bio changes",
        "Interactive Stories stickers and live comment moderation",
      ],
      nativeActionLinks: [
        { label: "Open Instagram Profile", href: igUrl },
        { label: "Open Instagram DMs", href: "https://www.instagram.com/direct/inbox/" },
        { label: "Meta Business Suite", href: "https://business.facebook.com/" },
      ],
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      profileUrl: liUrl,
      connectionState: liConnected ? "connected" : "needs_setup",
      connectionNote: liConnected
        ? "LinkedIn channel connected via Postiz official OAuth."
        : "Not connected in Postiz yet. Authorize LinkedIn inside your Postiz dashboard.",
      supportedViaConsole: [
        "Draft, preview, schedule, and publish official LinkedIn posts via Postiz",
        "Review recent scheduled posts from /admin/social",
      ],
      nativeOnlyActions: [
        "Direct LinkedIn Messaging / InMail replies",
        "Connection requests, follow/unfollow, and endorsements",
        "Comment threads and recruiter inbox actions",
      ],
      nativeActionLinks: [
        { label: "Open LinkedIn Profile", href: liUrl },
        { label: "Open LinkedIn Messaging", href: "https://www.linkedin.com/messaging/" },
        { label: "Notifications & Comments", href: "https://www.linkedin.com/notifications/" },
      ],
    },
    {
      id: "facebook",
      name: "Facebook",
      profileUrl: fbUrl,
      connectionState: fbConnected ? "connected" : "needs_setup",
      connectionNote: fbConnected
        ? "Facebook Page connected via Postiz official Meta Graph API."
        : "Not connected in Postiz yet. Official publishing requires a Facebook Page (personal profiles do not allow third-party auto-posting).",
      supportedViaConsole: [
        "Draft and schedule Facebook Page posts via Postiz official Meta integration",
      ],
      nativeOnlyActions: [
        "Messenger inbox & personal profile posting",
        "Friend requests, groups moderation, and page role settings",
      ],
      nativeActionLinks: [
        { label: "Open Facebook Profile", href: fbUrl },
        { label: "Meta Business Inbox", href: "https://business.facebook.com/latest/inbox/all" },
      ],
    },
    {
      id: "upwork",
      name: "Upwork",
      profileUrl: upworkUrl,
      connectionState: "needs_setup",
      connectionNote:
        "Native workflow only by design. Upwork restricts third-party messaging, proposals, and contract automation — no scraping or password storage is ever used.",
      supportedViaConsole: [
        "Direct studio shortcut links to active proposals, messages, and profile",
        "Track Upwork client leads cleanly inside Twenty CRM once contacted",
      ],
      nativeOnlyActions: [
        "Sending proposals, answering client messages, and milestone contracts",
        "Time tracker, billing, and profile availability settings",
      ],
      nativeActionLinks: [
        { label: "Open Upwork Profile", href: upworkUrl },
        { label: "Upwork Messages", href: "https://www.upwork.com/ab/messages/" },
        { label: "Active Proposals", href: "https://www.upwork.com/nx/proposals/" },
      ],
    },
    {
      id: "github",
      name: "GitHub",
      profileUrl: githubStatus.profileUrl,
      connectionState: githubStatus.state,
      connectionNote: githubStatus.detail,
      supportedViaConsole: [
        "Optional read-only official GitHub API account & repository count verification",
        "Direct links to repositories, pull requests, and notifications",
      ],
      nativeOnlyActions: [
        "Merging pull requests, editing repo secrets, and branch protection",
      ],
      nativeActionLinks: [
        { label: "Open GitHub Profile", href: githubStatus.profileUrl },
        { label: "Repositories", href: `${githubStatus.profileUrl.replace(/\/$/, "")}?tab=repositories` },
        { label: "Notifications", href: "https://github.com/notifications" },
      ],
    },
  ];
}
