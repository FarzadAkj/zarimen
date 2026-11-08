import { Module } from "@nestjs/common"
import { ShopModule } from "../shop/shop.module"
import { PublicTobeShopController, TobeShopController } from "./tobe-shop.controller"
import { TobeShopService } from "./tobe-shop.service"

@Module({
	imports: [ShopModule],
	controllers: [PublicTobeShopController, TobeShopController],
	providers: [TobeShopService],
})
export class TobeShopModule { }
