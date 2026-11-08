import { Module } from "@nestjs/common"
import { ImageUploadController, ShopImageUploadController } from "./image-upload.controller"

@Module({
	controllers: [ImageUploadController, ShopImageUploadController],
})
export class ImageUploadModule { }
