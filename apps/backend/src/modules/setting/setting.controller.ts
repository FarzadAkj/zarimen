import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { IsAdmin } from "../auth/guards/is-admin.guard"
import { IsShopOwner } from "../auth/guards/is-shop-owner.guard"
import { SERVICE_COST_SETTINGS_KEY, VAT_SETTINGS_KEY } from "./constants/settings-constant.keys"
import { ServiceCostSettingsModel } from "./model/service-cost-settings.model"
import { VatSettingsModel } from "./model/vat-settings.model"
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

	@Post("readVatSettings")
	@ApiOperation({ operationId: "readVatSettings" })
	@ApiResponse({ type: VatSettingsModel, status: 200 })
	readVatSettings(): Promise<VatSettingsModel> {
		return this.settings.getSetting(VAT_SETTINGS_KEY, VatSettingsModel)
	}

	@Post("setVatSettings")
	@ApiBody({ type: VatSettingsModel })
	@ApiOperation({ operationId: "setVatSettings" })
	@ApiResponse({ type: VatSettingsModel, status: 200 })
	setVatSettings(@Body() input: VatSettingsModel): Promise<VatSettingsModel> {
		return this.settings.setSetting(VAT_SETTINGS_KEY, input)
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

	@Post("readVat")
	@ApiOperation({ operationId: "readVat", description: "The VAT percent added to top-ups and subscription purchases (shown before paying)." })
	@ApiResponse({ type: VatSettingsModel, status: 200 })
	readVat(): Promise<VatSettingsModel> {
		return this.settings.getSetting(VAT_SETTINGS_KEY, VatSettingsModel)
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
