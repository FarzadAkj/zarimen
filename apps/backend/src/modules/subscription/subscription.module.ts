import { Module } from "@nestjs/common"
import { AdminShopSubscriptionController, ShopSubscriptionController, SubscriptionCallbackController, SubscriptionPlanController } from "./subscription.controller"
import { SubscriptionService } from "./subscription.service"

@Module({
	controllers: [SubscriptionPlanController, ShopSubscriptionController, SubscriptionCallbackController, AdminShopSubscriptionController],
	providers: [SubscriptionService],
})
export class SubscriptionModule { }
