import type { OnModuleDestroy } from "@nestjs/common"
import { Injectable } from "@nestjs/common"
import { PrismaPg } from "@prisma/adapter-pg"
import { ExtendedPrismaClient } from "./extensions/extensions"

/**
 * Client handed to the callback of `prisma.$transaction(async (tx) => ...)`.
 * Use it for helpers that must take part in the caller's transaction.
 */
export type PrismaTx = Omit<PrismaService, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends" | "onModuleDestroy">

@Injectable()
export class PrismaService extends ExtendedPrismaClient implements OnModuleDestroy {
	constructor() {
		const adapter = new PrismaPg({ connectionString: process.env.DATABASE_CONNECTION_URL })
		super({ adapter })
	}

	async onModuleDestroy() {
		await this.$disconnect()
	}
}
