import { join } from "node:path"
import { generateApi } from "swagger-typescript-api"

/** Regenerates src/api from the backend's swagger JSON. The backend must be running. */
async function generateSwagger() {
	const url = `${process.env.NEXT_PUBLIC_SERVER_ADDRESS}${process.env.NEXT_PUBLIC_SWAGGER_API_DOC_PATH}`
	await generateApi({
		output: join(process.cwd(), "src/api/"),
		toJS: true,
		cleanOutput: true,
		url,
		extractEnums: true,
	})
}

generateSwagger()
