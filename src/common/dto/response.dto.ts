import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto<T = any> {
  @ApiProperty({
    example: true,
    description: 'Indicates if the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Human readable message',
  })
  message: string;

  @ApiProperty({ description: 'Response data', nullable: true })
  data?: T;

  @ApiProperty({
    description: 'Metadata about the response',
    example: {
      timestamp: '2025-08-20T13:47:42.000Z',
      path: '/api/auth/register',
      method: 'POST',
      statusCode: 201,
    },
  })
  meta?: {
    timestamp: string;
    path: string;
    method: string;
    statusCode: number;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export class ErrorResponseDto {
  @ApiProperty({
    example: false,
    description: 'Indicates if the request failed',
  })
  success: boolean;

  @ApiProperty({
    example: 'The request could not be processed',
    description: 'Human readable error message',
  })
  message: string;

  @ApiProperty({
    description: 'Detailed error information',
    example: {
      code: 'VALIDATION_ERROR',
      details: ['email must be a valid email address'],
      timestamp: '2025-08-20T13:47:42.000Z',
      path: '/api/auth/register',
      method: 'POST',
      statusCode: 400,
    },
  })
  error: {
    code: string;
    details?: string | string[];
    timestamp: string;
    path: string;
    method: string;
    statusCode: number;
    stack?: string;
  };
}

export class PaginatedResponseDto<T = any> {
  @ApiProperty({
    example: true,
    description: 'Indicates if the request was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Resources retrieved successfully',
    description: 'Human readable message',
  })
  message: string;

  @ApiProperty({ description: 'Array of response data', nullable: true })
  data?: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      timestamp: '2025-08-20T13:47:42.000Z',
      path: '/api/outfits',
      method: 'GET',
      statusCode: 200,
      pagination: {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
      },
    },
  })
  meta: {
    timestamp: string;
    path: string;
    method: string;
    statusCode: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
