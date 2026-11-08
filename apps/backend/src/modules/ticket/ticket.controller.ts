import type { ShopOwnerRequest } from "../auth/guards/is-shop-owner.guard"
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { IsAdmin } from "../auth/guards/is-admin.guard"
import { IsShopOwner } from "../auth/guards/is-shop-owner.guard"
import { CreateTicketInput, ReadTicketsInput, SendTicketMessageInput, TicketIdInput } from "./dto/ticket.input"
import { ReadTicketsOutput, TicketModel } from "./model/ticket.model"
import { TicketService } from "./ticket.service"

/** The admins' side (zarimen.ir/panel/tickets): every shop's tickets. */
@UseGuards(IsAdmin)
@ApiBearerAuth()
@Controller("ticket")
export class TicketController {
	constructor(private tickets: TicketService) { }

	@Post("readTickets")
	@ApiOperation({ operationId: "readTickets", description: "All shops' tickets, latest activity first, optionally one status only." })
	@ApiBody({ type: ReadTicketsInput })
	@ApiResponse({ type: ReadTicketsOutput, status: 200 })
	readTickets(@Body() input: ReadTicketsInput): Promise<ReadTicketsOutput> {
		return this.tickets.readTickets({ status: input.status }, input.page)
	}

	@Post("readTicket")
	@ApiOperation({ operationId: "readTicket" })
	@ApiBody({ type: TicketIdInput })
	@ApiResponse({ type: TicketModel, status: 200 })
	readTicket(@Body() input: TicketIdInput): Promise<TicketModel> {
		return this.tickets.readTicket(input.ticketId, { admin: true })
	}

	@Post("answerTicket")
	@ApiOperation({ operationId: "answerTicket", description: "Admin reply; the ticket becomes ANSWERED. Refused once the owner closed it." })
	@ApiBody({ type: SendTicketMessageInput })
	@ApiResponse({ type: TicketModel, status: 200 })
	answerTicket(@Body() input: SendTicketMessageInput): Promise<TicketModel> {
		return this.tickets.sendMessage(input.ticketId, { admin: true }, input)
	}
}

/** The owner's side (<subdomain>.zarimen.ir/panel/tickets): their own shop's tickets only. */
@UseGuards(IsShopOwner)
@ApiBearerAuth()
@Controller("shop-panel")
export class ShopTicketController {
	constructor(private tickets: TicketService) { }

	@Post("createTicket")
	@ApiOperation({ operationId: "createTicket", description: "Opens a PENDING ticket with its first message and texts the admins." })
	@ApiBody({ type: CreateTicketInput })
	@ApiResponse({ type: TicketModel, status: 200 })
	createTicket(@Body() input: CreateTicketInput, @Req() request: ShopOwnerRequest): Promise<TicketModel> {
		return this.tickets.createTicket(request._shopOwner.shopId, input)
	}

	@Post("readMyTickets")
	@ApiOperation({ operationId: "readMyTickets" })
	@ApiBody({ type: ReadTicketsInput })
	@ApiResponse({ type: ReadTicketsOutput, status: 200 })
	readMyTickets(@Body() input: ReadTicketsInput, @Req() request: ShopOwnerRequest): Promise<ReadTicketsOutput> {
		return this.tickets.readTickets({ shopId: request._shopOwner.shopId, status: input.status }, input.page)
	}

	@Post("readMyTicket")
	@ApiOperation({ operationId: "readMyTicket" })
	@ApiBody({ type: TicketIdInput })
	@ApiResponse({ type: TicketModel, status: 200 })
	readMyTicket(@Body() input: TicketIdInput, @Req() request: ShopOwnerRequest): Promise<TicketModel> {
		return this.tickets.readTicket(input.ticketId, { shopId: request._shopOwner.shopId })
	}

	@Post("sendMyTicketMessage")
	@ApiOperation({ operationId: "sendMyTicketMessage", description: "Owner message; the ticket goes back to PENDING and the admins get an SMS." })
	@ApiBody({ type: SendTicketMessageInput })
	@ApiResponse({ type: TicketModel, status: 200 })
	sendMyTicketMessage(@Body() input: SendTicketMessageInput, @Req() request: ShopOwnerRequest): Promise<TicketModel> {
		return this.tickets.sendMessage(input.ticketId, { shopId: request._shopOwner.shopId }, input)
	}

	@Post("closeMyTicket")
	@ApiOperation({ operationId: "closeMyTicket", description: "Only the owner closes; no one can write afterwards." })
	@ApiBody({ type: TicketIdInput })
	@ApiResponse({ type: TicketModel, status: 200 })
	closeMyTicket(@Body() input: TicketIdInput, @Req() request: ShopOwnerRequest): Promise<TicketModel> {
		return this.tickets.closeTicket(input.ticketId, request._shopOwner.shopId)
	}
}
