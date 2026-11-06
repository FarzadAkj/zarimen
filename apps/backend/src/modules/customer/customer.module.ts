import { Module } from "@nestjs/common"
import { AdminShopCustomersController } from "./admin-shop-customers.controller"
import { CustomerController } from "./customer.controller"
import { CustomerService } from "./customer.service"
import { IsCustomer } from "./guards/is-customer.guard"
import { ShopCustomersController } from "./shop-customers.controller"

@Module({
	controllers: [CustomerController, ShopCustomersController, AdminShopCustomersController],
	providers: [CustomerService, IsCustomer],
})
export class CustomerModule { }
