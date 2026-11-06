import { Module } from "@nestjs/common"
import { Config } from "./config"
import { ConfigModule } from "./libs/config/config.module"
import { ErrorModule } from "./libs/error/error.module"
import { PrismaModule } from "./libs/prisma/prisma.module"

@Module({
	imports: [
		ConfigModule.forRootAsync(Config, {
			useFactory: () => process.env,
		}),
		PrismaModule,
		ErrorModule,
		// Feature modules (src/modules/*) are registered here as they are built.
	],
})
export class AppModule { }
