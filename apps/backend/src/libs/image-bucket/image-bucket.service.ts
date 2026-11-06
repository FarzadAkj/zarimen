import { randomUUID } from "node:crypto"
import { Injectable } from "@nestjs/common"
import { Config } from "~/config"
import { ErrorService } from "~/libs/error/error.service"
import { ImageBucketErrors } from "./image-bucket.errors"
import { presignPublicPut } from "./s3-signer"

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024

/** How long a presigned upload URL stays valid. */
const UPLOAD_URL_TTL_SECONDS = 5 * 60

/** Every image this app stores lives in this folder of the bucket. */
const IMAGE_FOLDER = "zar-imen/"

export enum ImageContentType {
	Jpeg = "image/jpeg",
	Png = "image/png",
	Webp = "image/webp",
}

const EXTENSIONS: Record<ImageContentType, string> = {
	[ImageContentType.Jpeg]: "jpg",
	[ImageContentType.Png]: "png",
	[ImageContentType.Webp]: "webp",
}

export type ImageUpload = {
	/** Presigned URL the browser PUTs the file to. */
	uploadUrl: string
	/** Headers the PUT must carry as given. */
	headers: Record<string, string>
	/** Where the image is readable once uploaded; this is what gets saved. */
	publicUrl: string
}

/**
 * Hands out presigned URLs so the panel uploads images straight to the public
 * ArvanCloud bucket (`imageBucketBaseUrl`); the files never pass through the
 * backend. JPG, PNG or webp, at most 5 MB, enforced by the signature.
 */
@Injectable()
export class ImageBucketService {
	constructor(
		private config: Config,
		private error: ErrorService,
	) { }

	createUpload(contentType: ImageContentType, size: number): ImageUpload {
		const extension = EXTENSIONS[contentType]
		if (!extension)
			throw this.error.throwErrorToClient(ImageBucketErrors.UnsupportedImage)
		if (size > IMAGE_MAX_BYTES)
			throw this.error.throwErrorToClient(ImageBucketErrors.ImageTooLarge)
		if (!this.config.arvanAccessKey || !this.config.arvanSecretKey)
			throw this.error.throwErrorToClient(ImageBucketErrors.NotConfigured)

		const publicUrl = `${this.config.imageBucketBaseUrl.replace(/\/$/, "")}/${IMAGE_FOLDER}${randomUUID()}.${extension}`

		const { uploadUrl, headers } = presignPublicPut(publicUrl, { contentType, size }, {
			accessKey: this.config.arvanAccessKey,
			secretKey: this.config.arvanSecretKey,
			region: this.config.arvanRegion,
		}, UPLOAD_URL_TTL_SECONDS)

		return { uploadUrl, headers, publicUrl }
	}
}
