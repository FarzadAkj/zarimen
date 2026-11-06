import type { CanActivate, ExecutionContext } from "@nestjs/common"
import type { FastifyRequest } from "fastify"
import type { CustomerJwtPayload } from "../constants/customer.constants"
import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { ErrorService } from "~/libs/error/error.service"
import { AuthErrors } from "../../auth/constants/auth.errors"
import { readToken } from "../../auth/guards/read-token"
import { CUSTOMER_ROLE } from "../constants/customer.constants"

export type CustomerRequest = FastifyRequest & { _customer: CustomerJwtPayload }

/** Lets the request through only with a valid customer session token in `Authorization`. */
@Injectable()
export class IsCustomer implements CanActivate {
	constructor(
		private jwt: JwtService,
		private error: ErrorService,
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<CustomerRequest>()

		const payload = await this.jwt.verifyAsync<CustomerJwtPayload>(readToken(request)).catch(() => null)
		if (payload?.role !== CUSTOMER_ROLE)
			throw this.error.throwErrorToClient(AuthErrors.Unauthorized)

		request._customer = payload
		return true
	}
}
