import type { Prisma } from "@prisma/client"

export const shopSelect = {
	id: true,
	name: true,
	brandName: true,
	subdomain: true,
	isActive: true,
	subscriptionEndsAt: true,
	logoUrl: true,
	address: true,
	landline: true,
	ownerFullName: true,
	ownerPhoneNumber: true,
	ownerNationalCode: true,
	createdAt: true,
	wallet: { select: { balance: true } },
} satisfies Prisma.ShopSelect

export type SelectedShop = Prisma.ShopGetPayload<{ select: typeof shopSelect }>
