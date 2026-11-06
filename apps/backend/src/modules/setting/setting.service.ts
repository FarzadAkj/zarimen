import { Injectable } from "@nestjs/common"
import { PrismaService } from "~/libs/prisma/prisma.service"

/**
 * Key → JSON settings store (copied from Darik). Each key holds one settings model;
 * reading a key that was never saved returns the model's defaults.
 */
@Injectable()
export class SettingService {
	constructor(
		private prisma: PrismaService,
	) { }

	async getSetting<T extends object>(key: string, SettingClass: new () => T): Promise<T> {
		const instance = new SettingClass()
		const setting = await this.prisma.setting.findUnique({ where: { key } })

		if (!setting)
			return instance

		Object.assign(instance, JSON.parse(setting.value))
		return instance
	}

	async setSetting<T extends object>(key: string, value: T): Promise<T> {
		const data = JSON.stringify(value)

		await this.prisma.setting.upsert({
			where: { key },
			create: { key, value: data },
			update: { value: data },
		})

		return value
	}
}
