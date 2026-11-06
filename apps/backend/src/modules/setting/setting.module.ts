import { Global, Module } from "@nestjs/common"
import { PublicServiceCostController, SettingController, ShopServiceCostController } from "./setting.controller"
import { SettingService } from "./setting.service"

@Global()
@Module({
	controllers: [SettingController, ShopServiceCostController, PublicServiceCostController],
	providers: [SettingService],
	exports: [SettingService],
})
export class SettingModule { }
