import { IsEnum, IsString } from "class-validator"

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
}
