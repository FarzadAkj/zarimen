import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { IsAdmin } from "../auth/guards/is-admin.guard"
import { ReadPaymentsInput } from "./dto/read-payments.input"
import { ReadPaymentsOutput } from "./model/payment.model"
import { PaymentService } from "./payment.service"

@UseGuards(IsAdmin)
@ApiBearerAuth()
@Controller("payment")
export class PaymentController {
	constructor(private payments: PaymentService) { }

	@Post("readPayments")
	@ApiOperation({ operationId: "readPayments", description: "Paid wallet top-ups and plan purchases of every shop, newest first. `amount` includes VAT." })
	@ApiBody({ type: ReadPaymentsInput })
	@ApiResponse({ type: ReadPaymentsOutput, status: 200 })
	readPayments(@Body() input: ReadPaymentsInput): Promise<ReadPaymentsOutput> {
		return this.payments.readPayments(input.page)
	}
}
