import { Prisma, PrismaClient } from "@prisma/client"

export function PrismaFindManyAndCount(prisma: PrismaClient) {
	return {
		model: {
			$allModels: {
				async findManyAndCount<T, A extends Prisma.Args<T, "findMany">>(
					this: T,
					args: A,
				): Promise<{
					data: Prisma.Result<T, A, "findMany">
					count: number
				}> {
					const context = Prisma.getExtensionContext(this)
					const [data, count] = await Promise.all([
						(context as any).findMany(args) as Promise<Prisma.Result<T, A, "findMany">>,
						(context as any).count({ where: args.where }) as Promise<number>,
					])
					return { data, count }
				},
			},
		},
	}
}
