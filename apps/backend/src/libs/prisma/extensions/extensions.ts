import { PrismaClient } from "@prisma/client"
import { PrismaExists } from "./prisma-exists"
import { PrismaFindManyAndCount } from "./prisma-find-many-and-count"

class UntypedExtendedClient extends PrismaClient {
	constructor(options?: ConstructorParameters<typeof PrismaClient>[0]) {
		super(options)
		return extendClient(this) as this
	}
}

export const ExtendedPrismaClient = UntypedExtendedClient as unknown as new (
	options?: ConstructorParameters<typeof PrismaClient>[0],
) => ReturnType<typeof extendClient>

function extendClient(client: PrismaClient) {
	return client
		.$extends(PrismaFindManyAndCount(client))
		.$extends(PrismaExists(client))
}
