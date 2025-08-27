import { Controller, FileTypeValidator, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { FileService } from './file.service';

@Controller('file')
@UseGuards(JwtAuthGuard)
export class FileController {
    constructor(private readonly fileService: FileService) {}

    @Post('upload')
    @UseInterceptors(FilesInterceptor('file')) // 'files' is the field name in your form
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

        const uploaded_files = await this.fileService.uploadMultiple(formattedFiles);
        
        return { uploaded_files };
    }
}
 