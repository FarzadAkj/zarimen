import { Global, Module } from "@nestjs/common"
import { SettingController, ShopServiceCostController } from "./setting.controller"
import { SettingService } from "./setting.service"

@Global()
@Module({
	controllers: [SettingController, ShopServiceCostController],
	providers: [SettingService],
	exports: [SettingService],
})
export class SettingModule { }
