import type { CanActivate, ExecutionContext } from "@nestjs/common"
import type { FastifyRequest } from "fastify"
import type { AuthJwtPayload } from "../constants/auth.constants"
import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Config } from "~/config"
import { ErrorService } from "~/libs/error/error.service"
import { ADMIN_ROLE } from "../constants/auth.constants"
import { AuthErrors } from "../constants/auth.errors"
import { readToken } from "./read-token"

export type AdminRequest = FastifyRequest & { _admin: Extract<AuthJwtPayload, { role: typeof ADMIN_ROLE }> }

/**
 * Lets the request through only with a valid admin token in `Authorization`. The token must also name the phone that
 * is admin *now*, so changing `adminPhoneNumber` logs the old admin out.
 */
@Injectable()
export class IsAdmin implements CanActivate {
	constructor(
		private jwt: JwtService,
		private config: Config,
		private error: ErrorService,
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<AdminRequest>()
		const payload = await this.jwt.verifyAsync<AuthJwtPayload>(readToken(request)).catch(() => null)
		if (payload?.role !== ADMIN_ROLE || payload.phoneNumber !== this.config.adminPhoneNumber)
			throw this.error.throwErrorToClient(AuthErrors.Unauthorized)

		request._admin = payload
		return true
	}
}
