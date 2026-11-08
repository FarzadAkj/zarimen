import { Module } from "@nestjs/common"
import { ShopTicketController, TicketController } from "./ticket.controller"
import { TicketService } from "./ticket.service"

@Module({
	controllers: [TicketController, ShopTicketController],
	providers: [TicketService],
})
export class TicketModule { }
