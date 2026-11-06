import { Global, Module } from "@nestjs/common"
import { ShahkarService } from "./shahkar.service"

@Global()
@Module({
	providers: [ShahkarService],
	exports: [ShahkarService],
})
export class ShahkarModule { }
