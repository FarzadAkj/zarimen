import { Global, Module } from "@nestjs/common"
import { ImageBucketService } from "./image-bucket.service"

@Global()
@Module({
	providers: [ImageBucketService],
	exports: [ImageBucketService],
})
export class ImageBucketModule { }
