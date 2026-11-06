import { Module } from "@nestjs/common"
import { Config } from "./config"
import { ConfigModule } from "./libs/config/config.module"
import { ErrorModule } from "./libs/error/error.module"
import { ImageBucketModule } from "./libs/image-bucket/image-bucket.module"
import { PrismaModule } from "./libs/prisma/prisma.module"
import { ShahkarModule } from "./libs/shahkar/shahkar.module"
import { SmsIrModule } from "./libs/sms-ir/sms-ir.module"
import { AuthModule } from "./modules/auth/auth.module"
import { CustomerModule } from "./modules/customer/customer.module"
import { ImageUploadModule } from "./modules/image-upload/image-upload.module"
import { ShopModule } from "./modules/shop/shop.module"

@Module({
	imports: [
		ConfigModule.forRootAsync(Config, {
			useFactory: () => process.env,
		}),
		PrismaModule,
		ErrorModule,
		SmsIrModule.registerAsync({
			inject: [Config],
			useFactory: (config: Config) => ({
				secret: config.smsIrSecret,
				sendSms: config.sendSms === "true",
				otpTemplate: config.smsIrOtpTemplate,
			}),
		}),
		ShahkarModule,
		ImageBucketModule,

		AuthModule,
		ShopModule,
		CustomerModule,
		ImageUploadModule,
	],
})
export class AppModule { }
