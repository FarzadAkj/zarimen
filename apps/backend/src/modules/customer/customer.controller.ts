import type { CustomerRequest } from "./guards/is-customer.guard"
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { OtpSentModel } from "../auth/model/otp-sent.model"
import { CustomerService } from "./customer.service"
import { AddCardInput } from "./dto/add-card.input"
import { CompleteLoginInput, StartLoginInput } from "./dto/login.input"
import { CompleteSignupInput, StartSignupInput } from "./dto/signup.input"
import { IsCustomer } from "./guards/is-customer.guard"
import { CustomerCardsModel } from "./model/customer-card.model"
import { CustomerTokenModel } from "./model/customer-token.model"
import { SignupStartedModel } from "./model/signup-started.model"

/** The customer side of <subdomain>.zarimen.ir/verify. */
@Controller("customer")
export class CustomerController {
	constructor(private customer: CustomerService) { }

	@Post("startSignup")
	@ApiOperation({ operationId: "startSignup", description: "Phase 1: Shahkar check, then an SMS code. Finish with completeSignup." })
	@ApiBody({ type: StartSignupInput })
	@ApiResponse({ type: SignupStartedModel, status: 200 })
	startSignup(@Body() { subdomain, ...details }: StartSignupInput): Promise<SignupStartedModel> {
		return this.customer.startSignup(subdomain, details)
	}

	@Post("completeSignup")
	@ApiOperation({ operationId: "completeSignup", description: "Phase 2: the SMS code saves the customer and opens a session." })
	@ApiBody({ type: CompleteSignupInput })
	@ApiResponse({ type: CustomerTokenModel, status: 200 })
	completeSignup(@Body() input: CompleteSignupInput): Promise<CustomerTokenModel> {
		return this.customer.completeSignup(input.ticket, input.code)
	}

	@Post("startLogin")
	@ApiOperation({ operationId: "startLogin", description: "Returning customer: SMS code to a registered phone. Finish with completeLogin." })
	@ApiBody({ type: StartLoginInput })
	@ApiResponse({ type: OtpSentModel, status: 200 })
	startLogin(@Body() input: StartLoginInput): Promise<OtpSentModel> {
		return this.customer.startLogin(input.subdomain, input.phoneNumber)
	}

	@Post("completeLogin")
	@ApiOperation({ operationId: "completeLogin" })
	@ApiBody({ type: CompleteLoginInput })
	@ApiResponse({ type: CustomerTokenModel, status: 200 })
	completeLogin(@Body() input: CompleteLoginInput): Promise<CustomerTokenModel> {
		return this.customer.completeLogin(input.subdomain, input.phoneNumber, input.code)
	}

	@UseGuards(IsCustomer)
	@ApiBearerAuth()
	@Post("readMyCards")
	@ApiOperation({ operationId: "readMyCards", description: "Phase 3: the customer's verified cards." })
	@ApiResponse({ type: CustomerCardsModel, status: 200 })
	readMyCards(@Req() request: CustomerRequest): Promise<CustomerCardsModel> {
		return this.customer.readMyCards(request._customer.customerId)
	}

	@UseGuards(IsCustomer)
	@ApiBearerAuth()
	@Post("addCard")
	@ApiOperation({ operationId: "addCard", description: "Phase 3: CardMatch check, then the card is saved." })
	@ApiBody({ type: AddCardInput })
	@ApiResponse({ type: CustomerCardsModel, status: 200 })
	addCard(@Req() request: CustomerRequest, @Body() input: AddCardInput): Promise<CustomerCardsModel> {
		return this.customer.addCard(request._customer.customerId, input.cardNumber)
	}
}
