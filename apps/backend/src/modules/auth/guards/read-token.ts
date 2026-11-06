import type { FastifyRequest } from "fastify"

/** Token from `Authorization`, with or without the `Bearer ` prefix. */
export function readToken(request: FastifyRequest) {
	return (request.headers.authorization ?? "").replace(/^bearer /i, "")
}
