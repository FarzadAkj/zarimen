import { Global, Module } from "@nestjs/common"
import { AdminShopWalletController, ShopWalletController, WalletCallbackController } from "./wallet.controller"
import { WalletService } from "./wallet.service"

@Global()
@Module({
	controllers: [WalletCallbackController, ShopWalletController, AdminShopWalletController],
	providers: [WalletService],
	exports: [WalletService],
})
export class WalletModule { }
