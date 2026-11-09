import { IsEnum, IsIn, IsOptional, IsString, IsUrl, Matches, MinLength } from "class-validator"

export enum NodeEnvType {
	Production = "production",
	Development = "development",
	Test = "test",
}

/**
 * Every environment variable the backend reads. Validated once at boot (see ConfigModule);
 * a missing or malformed value stops the app before it starts listening.
 */
export class Config {
	@IsEnum(NodeEnvType)
	public NODE_ENV!: NodeEnvType

	@IsString()
	public DATABASE_CONNECTION_URL!: string

	@IsString()
	public serverPort!: string

	@IsString()
	public swaggerApiDocPath!: string

	@IsString()
	public swaggerApiPath!: string

	// ---- auth

	@IsString()
	@MinLength(32)
	public jwtSecret!: string

	/** Token lifetime in a format jsonwebtoken understands, e.g. "10d". */
	@IsString()
	public jwtExpire!: string

	/**
	 * The admins, comma-separated: "09120000000,09130000000". Each logs in to
	 * zarimen.ir/panel with an SMS code sent to their number.
	 */
	@Matches(/^\s*09\d{9}\s*(?:,\s*09\d{9}\s*)*$/, { message: "adminPhoneNumbers must be comma-separated mobile numbers in 09xxxxxxxxx format" })
	public adminPhoneNumbers!: string

	/** Whether `phoneNumber` is one of `adminPhoneNumbers`. */
	isAdminPhoneNumber(phoneNumber: string) {
		return this.adminPhoneNumberList().includes(phoneNumber)
	}

	adminPhoneNumberList() {
		return this.adminPhoneNumbers.split(",").map(admin => admin.trim())
	}

	// ---- sms.ir

	@IsString()
	public smsIrSecret!: string

	/** sms.ir "verify" template id of the OTP message; the template has one `CODE` parameter. */
	@IsString()
	public smsIrOtpTemplate!: string

	/** sms.ir sender line number for plain-text bulk messages (the admins' new-ticket notice). */
	@Matches(/^\d+$/, { message: "smsIrLineNumber must be the digits of an sms.ir line number" })
	public smsIrLineNumber!: string

	/** sms.ir verify template for a canceled shop request (zarimen.ir/signup); one `INFO` parameter. */
	@IsString()
	public smsIrShopRejectedTemplate!: string

	/** sms.ir verify template welcoming a registered shop; one `SUBDOMAIN` parameter. */
	@IsString()
	public smsIrShopWelcomeTemplate!: string

	/**
	 * sms.ir verify template telling a shop owner a customer added a card; `SUBDOMAIN` and `SSN`
	 * parameters, used in the link https://#SUBDOMAIN#.zarimen.ir/panel/customers?ssn=#SSN#.
	 */
	@IsString()
	public smsIrCardAddedTemplate!: string

	/** "false" logs the OTP to the console instead of sending it (local development). */
	@IsIn(["true", "false"])
	public sendSms!: string

	// ---- api.ir (Shahkar / CardMatch)

	@IsString()
	public ApiIRToken!: string

	/** "false" skips the api.ir checks (local development). */
	@IsIn(["true", "false"])
	public identityCheck!: string

	// ---- ArvanCloud image bucket

	/** Public base URL of the ArvanCloud bucket, e.g. https://my-bucket.s3.ir-central1.arvanstorage.ir */
	@IsUrl({ require_tld: false, protocols: ["https", "http"] })
	public imageBucketBaseUrl!: string

	/** Signing region. ArvanCloud's own SDK examples use "default". */
	@IsString()
	public arvanRegion!: string

	/** Empty access/secret key disables uploads. */
	@IsString()
	public arvanAccessKey!: string

	@IsString()
	public arvanSecretKey!: string

	// ---- shop sites

	/**
	 * A shop's site, with `{subdomain}` where its subdomain goes:
	 * "https://{subdomain}.zarimen.ir" (production), "http://{subdomain}.localhost:3010" (dev).
	 * The backend sends owners back here after a Zarinpal payment.
	 */
	@Matches(/^https?:\/\/.*\{subdomain\}/, { message: "shopSiteUrl must be a URL containing {subdomain}" })
	public shopSiteUrl!: string

	// ---- Zarinpal (shop wallet top-ups)

	@IsString()
	public zarinPalMerchantId!: string

	/**
	 * Public base URL of this backend, e.g. https://api.zarimen.ir. Zarinpal sends payers back
	 * to callbacks under it (/wallet/topUpCallback, /subscription/purchaseCallback).
	 */
	@IsUrl({ require_tld: false, protocols: ["https", "http"] })
	public backendUrl!: string

	/** Leave empty for production; https://sandbox.zarinpal.com to test without real money. */
	@IsOptional()
	@IsString()
	public zarinpalBaseUrl?: string
}
