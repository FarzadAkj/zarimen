import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { IsAdmin } from "../auth/guards/is-admin.guard"
import { IsShopOwner } from "../auth/guards/is-shop-owner.guard"
import { SERVICE_COST_SETTINGS_KEY } from "./constants/settings-constant.keys"
import { ServiceCostSettingsModel } from "./model/service-cost-settings.model"
import { SettingService } from "./setting.service"

/** The admin's settings page (zarimen.ir/panel/settings). */
@UseGuards(IsAdmin)
@ApiBearerAuth()
@Controller("setting")
export class SettingController {
	constructor(private settings: SettingService) { }

	@Post("readServiceCostSettings")
	@ApiOperation({ operationId: "readServiceCostSettings" })
	@ApiResponse({ type: ServiceCostSettingsModel, status: 200 })
	readServiceCostSettings(): Promise<ServiceCostSettingsModel> {
		return this.settings.getSetting(SERVICE_COST_SETTINGS_KEY, ServiceCostSettingsModel)
	}

	@Post("setServiceCostSettings")
	@ApiBody({ type: ServiceCostSettingsModel })
	@ApiOperation({ operationId: "setServiceCostSettings" })
	@ApiResponse({ type: ServiceCostSettingsModel, status: 200 })
	setServiceCostSettings(@Body() input: ServiceCostSettingsModel): Promise<ServiceCostSettingsModel> {
		return this.settings.setSetting(SERVICE_COST_SETTINGS_KEY, input)
	}
}

/** The service prices, shown to shop owners on their dashboard (read only). */
@UseGuards(IsShopOwner)
@ApiBearerAuth()
@Controller("shop-panel")
export class ShopServiceCostController {
	constructor(private settings: SettingService) { }

	@Post("readServiceCosts")
	@ApiOperation({ operationId: "readServiceCosts", description: "What each Shahkar check and SMS costs the owner's wallet." })
	@ApiResponse({ type: ServiceCostSettingsModel, status: 200 })
	readServiceCosts(): Promise<ServiceCostSettingsModel> {
		return this.settings.getSetting(SERVICE_COST_SETTINGS_KEY, ServiceCostSettingsModel)
	}
}

/** Public: the service prices, shown on the zarimen.ir landing page. */
@Controller("setting")
export class PublicServiceCostController {
	constructor(private settings: SettingService) { }

	@Post("readPublicServiceCosts")
	@ApiOperation({ operationId: "readPublicServiceCosts", description: "Public: what each Shahkar check, card check and SMS costs a shop." })
	@ApiResponse({ type: ServiceCostSettingsModel, status: 200 })
	readPublicServiceCosts(): Promise<ServiceCostSettingsModel> {
		return this.settings.getSetting(SERVICE_COST_SETTINGS_KEY, ServiceCostSettingsModel)
	}
}
