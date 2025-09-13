import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InstagramService, ProcessedInstagramData } from './instagram.service';

export interface ProcessInstagramRequest {
  url: string;
}

export interface ProcessInstagramResponse {
  success: boolean;
  data?: ProcessedInstagramData;
  error?: string;
}

@Controller('instagram')
export class InstagramController {
  private readonly logger = new Logger(InstagramController.name);

  constructor(private readonly instagramService: InstagramService) {}

  @Post('process')
  async processInstagramUrl(
    @Body() request: ProcessInstagramRequest,
  ): Promise<ProcessInstagramResponse> {
    try {
      this.logger.log(`Processing Instagram URL: ${request.url}`);

      // Validate URL
      if (!request.url || typeof request.url !== 'string') {
        throw new HttpException('Invalid URL provided', HttpStatus.BAD_REQUEST);
      }

      // Check if URL can be processed
      if (!this.instagramService.canProcess(request.url)) {
        throw new HttpException(
          'Invalid Instagram URL format',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Process the URL
      const processedData = await this.instagramService.processInstagramUrl(
        request.url,
      );

      this.logger.log(`Successfully processed Instagram URL: ${request.url}`);

      return {
        success: true,
        data: processedData,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process Instagram URL ${request.url}:`,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to process Instagram URL',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('validate')
  async validateInstagramUrl(
    @Body() request: ProcessInstagramRequest,
  ): Promise<{ valid: boolean; message?: string }> {
    try {
      if (!request.url || typeof request.url !== 'string') {
        return { valid: false, message: 'Invalid URL provided' };
      }

      const canProcess = this.instagramService.canProcess(request.url);
      return {
        valid: canProcess,
        message: canProcess
          ? 'Valid Instagram URL'
          : 'Invalid Instagram URL format',
      };
    } catch (error) {
      this.logger.error(
        `Failed to validate Instagram URL ${request.url}:`,
        error,
      );
      return { valid: false, message: 'Validation failed' };
    }
  }
}
