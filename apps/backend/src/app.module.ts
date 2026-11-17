import { Module } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { Config } from "./config"
import { ConfigModule } from "./libs/config/config.module"
import { ErrorModule } from "./libs/error/error.module"
import { ImageBucketModule } from "./libs/image-bucket/image-bucket.module"
import { PrismaModule } from "./libs/prisma/prisma.module"
import { SepalModule } from "./libs/sepal/sepal.module"
import { ShahkarModule } from "./libs/shahkar/shahkar.module"
import { SmsIrModule } from "./libs/sms-ir/sms-ir.module"
import { AuthModule } from "./modules/auth/auth.module"
import { CustomerModule } from "./modules/customer/customer.module"
import { ImageUploadModule } from "./modules/image-upload/image-upload.module"
import { PaymentModule } from "./modules/payment/payment.module"
import { SettingModule } from "./modules/setting/setting.module"
import { ShopModule } from "./modules/shop/shop.module"
import { SubscriptionModule } from "./modules/subscription/subscription.module"
import { TicketModule } from "./modules/ticket/ticket.module"
import { TobeShopModule } from "./modules/tobe-shop/tobe-shop.module"
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
				shopRejectedTemplate: config.smsIrShopRejectedTemplate,
				shopWelcomeTemplate: config.smsIrShopWelcomeTemplate,
				cardAddedTemplate: config.smsIrCardAddedTemplate,
				ticketAnsweredTemplate: config.smsIrTicketAnsweredTemplate,
				noticeTemplate: config.smsIrNoticeTemplate,
				ownerApprovalTemplate: config.smsIrOwnerApprovalTemplate,
			}),
		}),
		ShahkarModule,
		SepalModule.registerAsync({
			inject: [Config],
			useFactory: (config: Config) => ({
				apiKey: config.sepalApiKey,
				baseUrl: config.sepalBaseUrl || undefined,
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
		TobeShopModule,
		ImageUploadModule,
		PaymentModule,
	],
})
export class AppModule { }
