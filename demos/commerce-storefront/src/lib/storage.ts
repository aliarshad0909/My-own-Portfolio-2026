/** localStorage wrapper that never throws; falls back to memory when storage is unavailable. */
const memory = new Map<string, string>();

export function loadJSON<T>(key: string): T | null {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : (memory.get(key) ?? null);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    const raw = memory.get(key);
    try {
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
}

export function saveJSON(key: string, value: unknown): void {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, raw);
  } catch {
    /* storage full or blocked — the in-memory copy keeps the session working */
  }
}
