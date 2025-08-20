import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let errorCode: string;
    let details: string | string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const errorObj = exceptionResponse as any;
        message = errorObj.message || exception.message;
        details = Array.isArray(errorObj.message)
          ? errorObj.message
          : errorObj.error;
        errorCode = this.getErrorCode(status);
      } else {
        message = exceptionResponse as string;
        errorCode = this.getErrorCode(status);
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error occurred';
      errorCode = 'INTERNAL_SERVER_ERROR';
      details = exception.message;

      // Log unexpected errors
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
        'AllExceptionsFilter',
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      errorCode = 'UNKNOWN_ERROR';
    }

    const isDevelopment = process.env.NODE_ENV === 'development';

    const errorResponse: ApiErrorResponse = {
      success: false,
      message: this.getUserFriendlyMessage(status, message),
      error: {
        code: errorCode,
        details: isDevelopment ? details : undefined,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        statusCode: status,
        ...(isDevelopment &&
          exception instanceof Error && { stack: exception.stack }),
      },
    };

    // Log all errors for monitoring
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return errorCodes[status] || 'UNKNOWN_ERROR';
  }

  private getUserFriendlyMessage(
    status: number,
    originalMessage: string,
  ): string {
    // Security consideration: Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      return originalMessage;
    }

    // Check for specific authentication-related conflicts
    if (status === 409) {
      const lowerMessage = originalMessage.toLowerCase();

      if (lowerMessage.includes('email') && lowerMessage.includes('already')) {
        return 'This email address is already registered. Please use a different email or try logging in.';
      }

      if (
        lowerMessage.includes('username') &&
        lowerMessage.includes('already')
      ) {
        return 'This username is already taken. Please choose a different username.';
      }

      if (lowerMessage.includes('user') && lowerMessage.includes('already')) {
        return 'An account with this information already exists. Please try logging in instead.';
      }
    }

    // Production-safe messages
    const friendlyMessages: Record<number, string> = {
      400: 'The request could not be processed due to invalid data',
      401: 'Authentication is required to access this resource',
      403: 'You do not have permission to access this resource',
      404: 'The requested resource could not be found',
      409: 'The request conflicts with the current state of the resource',
      422: 'The request data is invalid or incomplete',
      429: 'Too many requests. Please try again later',
      500: 'An internal server error occurred. Please try again later',
      502: 'Service temporarily unavailable. Please try again later',
      503: 'Service temporarily unavailable. Please try again later',
    };

    return friendlyMessages[status] || originalMessage;
  }
}
