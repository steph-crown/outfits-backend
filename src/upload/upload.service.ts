import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
    private readonly s3Client: S3Client;
    
    constructor(private readonly configService: ConfigService) {
        this.s3Client = new S3Client({
            region: this.configService.getOrThrow('AWS_S3_REGION'),
        });
    }

    async uploadMultiple(files: { fileName: string; file: Buffer }[]) {
    const uploadPromises = files.map(({ fileName, file }) =>
        this.s3Client.send(
            new PutObjectCommand({
                Bucket: "outfits-app-bucket",
                Key: fileName,
                Body: file,
            }),
        ),
    );

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);
}
}
