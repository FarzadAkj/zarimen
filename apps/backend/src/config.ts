import { IsEnum, IsIn, IsString, IsUrl, MinLength } from "class-validator"

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

	/** The one admin. Logs in to zarimen.ir/panel with an SMS code sent to this number. */
	@IsString()
	public adminPhoneNumber!: string

	// ---- sms.ir

	@IsString()
	public smsIrSecret!: string

	/** sms.ir "verify" template id of the OTP message; the template has one `CODE` parameter. */
	@IsString()
	public smsIrOtpTemplate!: string

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
}
