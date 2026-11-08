import { Module } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { Config } from "./config"
import { ConfigModule } from "./libs/config/config.module"
import { ErrorModule } from "./libs/error/error.module"
import { ImageBucketModule } from "./libs/image-bucket/image-bucket.module"
import { PrismaModule } from "./libs/prisma/prisma.module"
import { ShahkarModule } from "./libs/shahkar/shahkar.module"
import { SmsIrModule } from "./libs/sms-ir/sms-ir.module"
import { ZarinpalModule } from "./libs/zarinpal/zarinpal.module"
import { AuthModule } from "./modules/auth/auth.module"
import { CustomerModule } from "./modules/customer/customer.module"
import { ImageUploadModule } from "./modules/image-upload/image-upload.module"
import { SettingModule } from "./modules/setting/setting.module"
import { ShopModule } from "./modules/shop/shop.module"
import { SubscriptionModule } from "./modules/subscription/subscription.module"
import { TicketModule } from "./modules/ticket/ticket.module"
import { WalletModule } from "./modules/wallet/wallet.module"

@Module({
	imports: [
		ConfigModule.forRootAsync(Config, {
			useFactory: () => process.env,
		}),
		ScheduleModule.forRoot(),
		PrismaModule,
		ErrorModule,
		SmsIrModule.registerAsync({
			inject: [Config],
			useFactory: (config: Config) => ({
				secret: config.smsIrSecret,
				sendSms: config.sendSms === "true",
				otpTemplate: config.smsIrOtpTemplate,
				lineNumber: config.smsIrLineNumber,
			}),
		}),
		ShahkarModule,
		ZarinpalModule.registerAsync({
			inject: [Config],
			useFactory: (config: Config) => ({
				merchantId: config.zarinPalMerchantId,
				baseUrl: config.zarinpalBaseUrl || undefined,
			}),
		}),
		ImageBucketModule,

		SettingModule,
		WalletModule,
		AuthModule,
		ShopModule,
		CustomerModule,
		SubscriptionModule,
		TicketModule,
		ImageUploadModule,
	],
})
export class AppModule { }
