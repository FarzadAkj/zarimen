import type { OnModuleDestroy } from "@nestjs/common"
import { Global, Module } from "@nestjs/common"
import { PrismaService } from "~/libs/prisma/prisma.service"

@Global()
@Module({
	exports: [
		PrismaService,
	],
	providers: [
		PrismaService,
	],
})
export class PrismaModule implements OnModuleDestroy {
	constructor(private prisma: PrismaService) { }
	async onModuleDestroy() {
		await this.prisma.$disconnect()
	}
}
