// web/lib/http.ts
export async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, ms = 12000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(input, { ...init, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function safeJson(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}
