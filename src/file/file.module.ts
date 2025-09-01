import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.getOrThrow('UPLOAD_RATE_TTL'),
            limit: configService.getOrThrow('UPLOAD_RATE_LIMIT'),
          }
        ]
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FileController],
  providers: [FileService, {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
    {
      provide: S3Client,
      useFactory: (configService: ConfigService) => {
        const region = configService.getOrThrow('AWS_S3_REGION');
        const accessKeyId = configService.getOrThrow('AWS_ACCESS_KEY_ID');
        const secretAccessKey = configService.getOrThrow('AWS_SECRET_ACCESS_KEY');

        return new S3Client({
          region,
          credentials: { accessKeyId, secretAccessKey },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [S3Client],
})
export class FileModule { }
