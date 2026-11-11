// In-memory token bucket / sliding window rate limiter
const rateLimitStores = new Map<string, Map<string, { count: number; resetAt: number }>>();

export function checkRateLimit(
  namespace: string,
  key: string,
  limit: number = 20,
  windowMs: number = 10 * 60 * 1000
): boolean {
  if (!rateLimitStores.has(namespace)) {
    rateLimitStores.set(namespace, new Map());
  }
  const store = rateLimitStores.get(namespace)!;
  const now = Date.now();

  if (store.size > 100) {
    for (const [k, v] of store.entries()) {
      if (now > v.resetAt) store.delete(k);
    }
  }
  while (store.size > 1000) {
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
    else break;
  }

  const record = store.get(key);
  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count += 1;
  return true;
}

export function checkCauseRateLimit(ip: string, limit: number = 20, windowMs: number = 10 * 60 * 1000): boolean {
  return checkRateLimit("causes", ip, limit, windowMs);
}

