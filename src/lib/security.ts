import { ApiError } from "@/lib/api-errors";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitBucket>();

export function resetRateLimitStore() {
  rateLimitStore.clear();
}

function getRequestOrigin(request: Request) {
  return (
    request.headers.get("origin") ?? request.headers.get("referer") ?? null
  );
}

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function hasTrustedOrigin(origin: string) {
  const trusted = process.env.TRUSTED_ORIGINS;
  if (!trusted) {
    return false;
  }

  const allowedOrigins = trusted
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return allowedOrigins.includes(origin);
}

function areEquivalentOrigins(originA: URL, originB: URL) {
  if (originA.origin === originB.origin) {
    return true;
  }

  return (
    originA.protocol === originB.protocol &&
    originA.port === originB.port &&
    isLoopbackHost(originA.hostname) &&
    isLoopbackHost(originB.hostname)
  );
}

export function assertSameOrigin(request: Request) {
  const origin = getRequestOrigin(request);

  if (!origin) {
    return;
  }

  const requestUrl = new URL(request.url);
  const normalizedOrigin = new URL(origin, request.url);

  if (hasTrustedOrigin(normalizedOrigin.origin)) {
    return;
  }

  if (!areEquivalentOrigins(normalizedOrigin, requestUrl)) {
    throw new ApiError(
      "Cross-origin request blocked",
      403,
      "CROSS_ORIGIN_BLOCKED",
    );
  }
}

export function assertRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
) {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  if (bucket.count >= options.limit) {
    throw new ApiError("Too many requests", 429, "RATE_LIMITED");
  }

  bucket.count += 1;
}

export function buildRateLimitKey(scope: string, request: Request) {
  const forwardedFor =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "anonymous";
  return `${scope}:${forwardedFor.split(",")[0].trim()}`;
}
