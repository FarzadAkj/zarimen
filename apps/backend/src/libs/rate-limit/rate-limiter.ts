import type { FastifyRequest } from "fastify"

/**
 * In-memory "at most `limit` hits per key in the last `windowMs`". One process only and
 * forgotten on restart, which is enough to keep anonymous endpoints from being hammered.
 */
export class RateLimiter {
	private hits = new Map<string, number[]>()

	constructor(private limit: number, private windowMs: number, private now = () => Date.now()) { }

	/** Counts a hit for `key`; false (and not counted) when the key is already at the limit. */
	hit(key: string): boolean {
		const now = this.now()
		const recent = (this.hits.get(key) ?? []).filter(at => at > now - this.windowMs)
		if (recent.length >= this.limit) {
			this.hits.set(key, recent)
			return false
		}
		recent.push(now)
		this.hits.set(key, recent)
		if (this.hits.size > 10_000)
			this.prune(now)
		return true
	}

	private prune(now: number) {
		for (const [key, times] of this.hits) {
			if (times.every(at => at <= now - this.windowMs))
				this.hits.delete(key)
		}
	}
}

/**
 * The visitor's IP. In production nginx sets `X-Real-IP` to the connecting address (it
 * overwrites whatever the client sent); without nginx (development) the socket address is used.
 */
export function clientIp(request: FastifyRequest) {
	const real = request.headers["x-real-ip"]
	return (Array.isArray(real) ? real[0] : real) || request.ip
}
