import type { PaymentModel, ReadPaymentsOutput } from "./model/payment.model"
import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "~/libs/prisma/prisma.service"
import { PAYMENTS_PAGE_SIZE } from "./constants/payment"

/**
 * Every paid gateway payment, both kinds in one list: wallet top-ups and plan purchases.
 * The admin's end-date changes (purchases with no plan, free) are not payments and are left out.
 */
const PAYMENTS = Prisma.sql`
	SELECT t."id", 'TOP_UP' AS "kind", NULL AS "planTitle", t."amount" + t."vatAmount" AS "amount", t."createdAt", w."shopId"
	FROM "WalletTransaction" t JOIN "Wallet" w ON w."id" = t."walletId"
	WHERE t."type" = 'TOP_UP' AND t."status" = 'SUCCESS'
	UNION ALL
	SELECT p."id", 'SUBSCRIPTION', p."planTitle", p."price" + p."vatAmount", p."createdAt", p."shopId"
	FROM "SubscriptionPurchase" p
	WHERE p."status" = 'SUCCESS' AND p."planId" IS NOT NULL`

/** The admins' payments report (zarimen.ir/panel/payments). */
@Injectable()
export class PaymentService {
	constructor(private prisma: PrismaService) { }

	/** Newest first. */
	async readPayments(page = 1): Promise<ReadPaymentsOutput> {
		const [rows, [total]] = await Promise.all([
			this.prisma.$queryRaw<(Omit<PaymentModel, "amount"> & { amount: string })[]>`
				SELECT pay."id", pay."kind", pay."planTitle", pay."amount"::text AS "amount", pay."createdAt",
					s."name" AS "shopName", s."subdomain", s."ownerPhoneNumber"
				FROM (${PAYMENTS}) pay JOIN "Shop" s ON s."id" = pay."shopId"
				ORDER BY pay."createdAt" DESC, pay."id"
				LIMIT ${PAYMENTS_PAGE_SIZE} OFFSET ${(page - 1) * PAYMENTS_PAGE_SIZE}`,
			this.prisma.$queryRaw<{ count: number }[]>`SELECT COUNT(*)::int AS "count" FROM (${PAYMENTS}) pay`,
		])
		return { data: rows, count: total!.count, pageSize: PAYMENTS_PAGE_SIZE }
	}
}
