/**
 * Server-only adapter for self-hosted Twenty CRM (https://twenty.com).
 * Reads People, Companies, Opportunities, and Tasks via official REST API,
 * prevents silent duplicate contacts by checking existing primary email first,
 * and marks every returned record `source: "twenty"`.
 */
import { envVar } from "@/lib/form-security";
import type {
  ServiceHealthState,
  TwentyCompany,
  TwentyOpportunity,
  TwentyPerson,
  TwentyTask,
} from "@/lib/admin/types";
import { fetchJsonWithTimeout, safeServiceBaseUrl } from "@/lib/admin/adapters/http";

function twentyConfig() {
  const urlRes = safeServiceBaseUrl("TWENTY_URL", "Twenty CRM");
  if (!urlRes.ok) return urlRes;
  const apiKey = envVar("TWENTY_API_KEY");
  if (!apiKey) {
    return {
      ok: false as const,
      state: "needs_setup" as const,
      detail: "TWENTY_URL is set, but TWENTY_API_KEY is required.",
    };
  }
  const restBase = urlRes.baseUrl.endsWith("/rest") ? urlRes.baseUrl : `${urlRes.baseUrl}/rest`;
  return { ok: true as const, restBase, host: urlRes.host, apiKey };
}

function extractRecords(data: unknown, key: string): Array<Record<string, unknown>> {
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;
  const inner = (root.data ?? root) as Record<string, unknown>;
  const arr = inner[key];
  return Array.isArray(arr) ? (arr as Array<Record<string, unknown>>) : [];
}

function mapPerson(p: Record<string, unknown>): TwentyPerson {
  const nameObj = (p.name ?? {}) as Record<string, unknown>;
  const emailsObj = (p.emails ?? {}) as Record<string, unknown>;
  const companyObj = (p.company ?? {}) as Record<string, unknown>;
  return {
    id: String(p.id ?? ""),
    firstName: String(nameObj.firstName ?? p.firstName ?? ""),
    lastName: String(nameObj.lastName ?? p.lastName ?? ""),
    email: String(emailsObj.primaryEmail ?? p.email ?? ""),
    jobTitle: String(p.jobTitle ?? ""),
    companyName: String(companyObj.name ?? ""),
    city: String(p.city ?? ""),
    createdAt: String(p.createdAt ?? ""),
    source: "twenty",
  };
}

export async function checkTwentyStatus(): Promise<{
  state: ServiceHealthState;
  detail: string;
  baseUrlHost?: string;
}> {
  const cfg = twentyConfig();
  if (!cfg.ok) return { state: cfg.state, detail: cfg.detail };

  const res = await fetchJsonWithTimeout<unknown>(`${cfg.restBase}/people?limit=1`, {
    headers: { Authorization: `Bearer ${cfg.apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) return { state: res.state, detail: res.detail, baseUrlHost: cfg.host };

  return {
    state: "connected",
    detail: "Twenty CRM REST API connected and synced.",
    baseUrlHost: cfg.host,
  };
}

export async function loadTwentyWorkspace(): Promise<
  | {
      ok: true;
      host: string;
      people: TwentyPerson[];
      companies: TwentyCompany[];
      opportunities: TwentyOpportunity[];
      tasks: TwentyTask[];
    }
  | { ok: false; state: ServiceHealthState; detail: string }
> {
  const cfg = twentyConfig();
  if (!cfg.ok) return { ok: false, state: cfg.state, detail: cfg.detail };
  const headers = { Authorization: `Bearer ${cfg.apiKey}`, Accept: "application/json" };

  const [peopleRes, companiesRes, oppsRes, tasksRes] = await Promise.all([
    fetchJsonWithTimeout<unknown>(`${cfg.restBase}/people?limit=50`, { headers }),
    fetchJsonWithTimeout<unknown>(`${cfg.restBase}/companies?limit=50`, { headers }),
    fetchJsonWithTimeout<unknown>(`${cfg.restBase}/opportunities?limit=50`, { headers }),
    fetchJsonWithTimeout<unknown>(`${cfg.restBase}/tasks?limit=50`, { headers }),
  ]);

  if (!peopleRes.ok) {
    return { ok: false, state: peopleRes.state, detail: peopleRes.detail };
  }

  const people = extractRecords(peopleRes.data, "people").map(mapPerson);

  const companies: TwentyCompany[] = companiesRes.ok
    ? extractRecords(companiesRes.data, "companies").map((c) => {
        const domainObj = (c.domainName ?? {}) as Record<string, unknown>;
        const addressObj = (c.address ?? {}) as Record<string, unknown>;
        return {
          id: String(c.id ?? ""),
          name: String(c.name ?? "Unnamed Company"),
          domain: String(domainObj.primaryLinkUrl ?? domainObj.primaryLinkLabel ?? ""),
          employees: typeof c.employees === "number" ? c.employees : null,
          city: String(addressObj.addressCity ?? ""),
          source: "twenty",
        };
      })
    : [];

  const opportunities: TwentyOpportunity[] = oppsRes.ok
    ? extractRecords(oppsRes.data, "opportunities").map((o) => {
        const amountObj = (o.amount ?? {}) as Record<string, unknown>;
        const micros = Number(amountObj.amountMicros ?? 0);
        const companyObj = (o.company ?? {}) as Record<string, unknown>;
        return {
          id: String(o.id ?? ""),
          name: String(o.name ?? "Untitled Opportunity"),
          stage: String(o.stage ?? "NEW"),
          amountUsd: micros > 0 ? Math.round(micros / 1_000_000) : null,
          closeDate: o.closeDate ? String(o.closeDate) : null,
          companyName: String(companyObj.name ?? ""),
          source: "twenty",
        };
      })
    : [];

  const tasks: TwentyTask[] = tasksRes.ok
    ? extractRecords(tasksRes.data, "tasks").map((t) => ({
        id: String(t.id ?? ""),
        title: String(t.title ?? "Untitled Task"),
        status: String(t.status ?? "TODO"),
        dueAt: t.dueAt ? String(t.dueAt) : null,
        source: "twenty",
      }))
    : [];

  return { ok: true, host: cfg.host, people, companies, opportunities, tasks };
}

export async function createTwentyPersonSafe(input: {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  city?: string;
}): Promise<
  | { ok: true; created: true; person: TwentyPerson }
  | { ok: true; created: false; duplicate: true; person: TwentyPerson }
  | { ok: false; detail: string; status: number }
> {
  const cfg = twentyConfig();
  if (!cfg.ok) return { ok: false, detail: cfg.detail, status: 503 };
  const headers = {
    Authorization: `Bearer ${cfg.apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const normalizedEmail = input.email.trim().toLowerCase();

  // Duplicate check before creating a new contact record in Twenty CRM.
  const filter = encodeURIComponent(`emails.primaryEmail[eq]:"${normalizedEmail}"`);
  const existingRes = await fetchJsonWithTimeout<unknown>(`${cfg.restBase}/people?limit=10&filter=${filter}`, {
    headers: { Authorization: `Bearer ${cfg.apiKey}`, Accept: "application/json" },
  });
  if (existingRes.ok) {
    const matches = extractRecords(existingRes.data, "people")
      .map(mapPerson)
      .filter((p) => p.email.trim().toLowerCase() === normalizedEmail);
    if (matches.length > 0) {
      return { ok: true, created: false, duplicate: true, person: matches[0] };
    }
  }

  const createRes = await fetchJsonWithTimeout<Record<string, unknown>>(`${cfg.restBase}/people`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: { firstName: input.firstName.trim(), lastName: input.lastName.trim() },
      emails: { primaryEmail: normalizedEmail },
      jobTitle: (input.jobTitle ?? "").trim(),
      city: (input.city ?? "").trim(),
    }),
  });
  if (!createRes.ok) {
    return { ok: false, detail: createRes.detail, status: createRes.status ?? 502 };
  }

  const createdRaw =
    ((createRes.data?.data as Record<string, unknown> | undefined)?.createPerson as Record<string, unknown>) ??
    (createRes.data?.data as Record<string, unknown>) ??
    createRes.data;

  return { ok: true, created: true, person: mapPerson(createdRaw) };
}

export async function createTwentyTask(input: {
  title: string;
  dueAt?: string | null;
  status?: string;
}): Promise<{ ok: true; task: TwentyTask } | { ok: false; detail: string; status: number }> {
  const cfg = twentyConfig();
  if (!cfg.ok) return { ok: false, detail: cfg.detail, status: 503 };

  const res = await fetchJsonWithTimeout<Record<string, unknown>>(`${cfg.restBase}/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      title: input.title.trim(),
      status: input.status ?? "TODO",
      ...(input.dueAt ? { dueAt: new Date(input.dueAt).toISOString() } : {}),
    }),
  });
  if (!res.ok) return { ok: false, detail: res.detail, status: res.status ?? 502 };

  const raw =
    ((res.data?.data as Record<string, unknown> | undefined)?.createTask as Record<string, unknown>) ??
    (res.data?.data as Record<string, unknown>) ??
    res.data;

  return {
    ok: true,
    task: {
      id: String(raw?.id ?? ""),
      title: String(raw?.title ?? input.title),
      status: String(raw?.status ?? "TODO"),
      dueAt: raw?.dueAt ? String(raw.dueAt) : input.dueAt ?? null,
      source: "twenty",
    },
  };
}
