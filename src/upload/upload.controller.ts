import { Controller, FileTypeValidator, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

    @Post()
    @UseInterceptors(FilesInterceptor('files')) // 'files' is the field name in your form
    async uploadFiles(
        @UploadedFiles(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10000000000000000 }), // adjust size as needed
                    new FileTypeValidator({ fileType: /(image\/jpg|image\/jpeg|image\/png)$/ }),
                ],
            }),
        ) files: Express.Multer.File[]
    ) {
        // Map files to the format expected by uploadMultiple
        const formattedFiles = files.map((file) => ({
            fileName: file.originalname,
            fileType: file.mimetype,
            file: file.buffer,
        }));

        const uploadedFiles = await this.uploadService.uploadMultiple(formattedFiles);
        
        return { uploadedFiles };
    }
}
 