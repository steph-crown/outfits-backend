import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FileService {
    private readonly s3Client: S3Client;

    constructor(private readonly configService: ConfigService) {
        this.s3Client = new S3Client({
            region: this.configService.getOrThrow('AWS_S3_REGION'),
        });
    }

    async uploadMultiple(files: { fileName: string; file: Buffer; fileType: string }[]): Promise<{ object_name: string; object_url: string }[]> {
        const uploadPromises = files.map(async ({ fileName, file, fileType }) => {

            const ext = fileName.split('.').pop();
            const object_name = `${uuid()}.${ext}`;

            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: "outfits-media-bucket",
                    Key: object_name,
                    Body: file,
                    ContentType: fileType,
                    ContentDisposition: 'inline',
                }),
            );

            const region = await this.s3Client.config.region(); 

            const object_url = `https://outfits-media-bucket.s3.${region}.amazonaws.com/${object_name}`

            return { object_name, object_url }

        });

        // Wait for all uploads to complete
        return Promise.all(uploadPromises);
    }
}
