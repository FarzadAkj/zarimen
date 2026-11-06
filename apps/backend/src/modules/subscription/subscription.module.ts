import { Module } from "@nestjs/common"
import { ShopSubscriptionController, SubscriptionCallbackController, SubscriptionPlanController } from "./subscription.controller"
import { SubscriptionService } from "./subscription.service"

@Module({
	controllers: [SubscriptionPlanController, ShopSubscriptionController, SubscriptionCallbackController],
	providers: [SubscriptionService],
})
export class SubscriptionModule { }
