
interface RateLimitContext {
    timestamp: number;
    count: number;
}

const rateLimitMap = new Map<string, RateLimitContext>();

export function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const cleanupBefore = now - windowMs;

    // Cleanup old entries periodically (optional optimization, but simple check here)
    // For simplicity in this functional check, we just handle the current IP

    const record = rateLimitMap.get(ip);

    if (!record) {
        rateLimitMap.set(ip, { timestamp: now, count: 1 });
        return true;
    }

    if (record.timestamp < cleanupBefore) {
        // Expired, reset
        rateLimitMap.set(ip, { timestamp: now, count: 1 });
        return true;
    }

    if (record.count >= limit) {
        return false;
    }

    record.count += 1;
    return true;
}
