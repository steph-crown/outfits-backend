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
  }]
})
export class FileModule {}
