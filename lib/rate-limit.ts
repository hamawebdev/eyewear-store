const store = new Map<string, { count: number; resetAt: number }>();

export const checkRateLimit = ({
  key,
  limit,
  windowMs
}: {
  key: string;
  limit: number;
  windowMs: number;
}) => {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs
    });

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt
    };
  }

  current.count += 1;
  store.set(key, current);

  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt
  };
};

export const getRequestRateLimitKey = (headers: Headers, suffix = "") => {
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  const host = headers.get("host") || "unknown-host";
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "anonymous";

  return `${host}:${ip}${suffix ? `:${suffix}` : ""}`;
};
