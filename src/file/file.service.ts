import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

    async uploadMultiple(files: { fileName: string; file: Buffer; fileType: string }[]): Promise<{ object_name: string; signed_url: string }[]> {
        const uploadPromises = files.map(async ({ fileName, file, fileType }) => {

            const ext = fileName.split('.').pop();
            const object_name = `${uuid()}.${ext}`;

            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: "outfits-app-bucket",
                    Key: object_name,
                    Body: file,
                    ContentType: fileType,
                    ContentDisposition: 'inline',
                }),
            );

            const command = new GetObjectCommand({
                Bucket: 'outfits-app-bucket',
                Key: object_name,
            });
            const signed_url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

            return { object_name, signed_url }

        });

        // Wait for all uploads to complete
        return Promise.all(uploadPromises);
    }
}
