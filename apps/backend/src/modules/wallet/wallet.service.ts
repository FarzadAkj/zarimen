import { Injectable } from "@nestjs/common"
import { ErrorService } from "~/libs/error/error.service"
import { PrismaService } from "~/libs/prisma/prisma.service"
import { SERVICE_COST_SETTINGS_KEY } from "../setting/constants/settings-constant.keys"
import { ServiceCostSettingsModel } from "../setting/model/service-cost-settings.model"
import { SettingService } from "../setting/setting.service"
import { WalletErrors } from "./constants/wallet.errors"

/** A paid service a shop's customers use; its price is set on the admin's settings page. */
export type PaidService = "shahkar" | "sms"

/**
 * Charges shop wallets for the paid services their customers trigger.
 */
@Injectable()
export class WalletService {
	constructor(
		private prisma: PrismaService,
		private settings: SettingService,
		private error: ErrorService,
	) { }

	/**
	 * Throws InsufficientBalance unless the wallet holds enough for all of `services`.
	 * For flows that use several services in a row, so the first is not paid for when
	 * the next could not be.
	 */
	async assertCanAfford(shopId: string, services: PaidService[]) {
		const costs = await this.readCosts()
		const total = services.reduce((sum, service) => sum + costs[service], 0)
		if (total === 0)
			return

		const affordable = await this.prisma.wallet.exists({ shopId, balance: { gte: total } })
		if (!affordable)
			throw this.error.throwErrorToClient(WalletErrors.InsufficientBalance)
	}

	/**
	 * Takes the price of `service` from the shop's wallet, then runs it. If `run` throws
	 * (the provider failed or could not be reached), the price is refunded.
	 * The deduction only happens while the balance covers it, so concurrent requests
	 * cannot take the wallet below zero.
	 */
	async charge<T>(shopId: string, service: PaidService, run: () => Promise<T>): Promise<T> {
		const cost = (await this.readCosts())[service]
		if (cost === 0)
			return run()

		const { count } = await this.prisma.wallet.updateMany({
			where: { shopId, balance: { gte: cost } },
			data: { balance: { decrement: cost } },
		})
		if (count === 0)
			throw this.error.throwErrorToClient(WalletErrors.InsufficientBalance)

		try {
			return await run()
		}
		catch (e) {
			await this.prisma.wallet.update({ where: { shopId }, data: { balance: { increment: cost } } })
			throw e
		}
	}

	private async readCosts(): Promise<Record<PaidService, number>> {
		const { shahkarCost, smsCost } = await this.settings.getSetting(SERVICE_COST_SETTINGS_KEY, ServiceCostSettingsModel)
		return { shahkar: shahkarCost, sms: smsCost }
	}
}
