import { Module } from "@nestjs/common"
import { ShopPanelController } from "./shop-panel.controller"
import { ShopController } from "./shop.controller"
import { ShopService } from "./shop.service"

@Module({
	controllers: [ShopController, ShopPanelController],
	providers: [ShopService],
	exports: [ShopService],
})
export class ShopModule { }
