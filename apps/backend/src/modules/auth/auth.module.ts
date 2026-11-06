import { Global, Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { Config } from "~/config"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { IsAdmin } from "./guards/is-admin.guard"
import { IsShopOwner } from "./guards/is-shop-owner.guard"

/** Global so any module can put `@UseGuards(IsAdmin)` / `@UseGuards(IsShopOwner)` on its controllers. */
@Global()
@Module({
	imports: [
		JwtModule.registerAsync({
			inject: [Config],
			useFactory: (config: Config) => ({
				secret: config.jwtSecret,
				signOptions: { expiresIn: config.jwtExpire as `${number}d`, algorithm: "HS256" },
				verifyOptions: { algorithms: ["HS256"] },
			}),
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, IsAdmin, IsShopOwner],
	exports: [IsAdmin, IsShopOwner, JwtModule],
})
export class AuthModule { }
