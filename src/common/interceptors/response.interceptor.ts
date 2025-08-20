import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // If data is already in the correct format, don't wrap it again
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        const responseFormat: ApiResponse<T> = {
          success: true,
          message: this.getSuccessMessage(request.method, request.route?.path),
          data,
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            statusCode: response.statusCode,
          },
        };

        return responseFormat;
      }),
    );
  }

  private getSuccessMessage(method: string, path?: string): string {
    const operation = this.getOperationType(method, path);

    switch (operation) {
      case 'CREATE':
        return 'Resource created successfully';
      case 'UPDATE':
        return 'Resource updated successfully';
      case 'DELETE':
        return 'Resource deleted successfully';
      case 'GET_LIST':
        return 'Resources retrieved successfully';
      case 'GET_ONE':
        return 'Resource retrieved successfully';
      default:
        return 'Operation completed successfully';
    }
  }

  private getOperationType(method: string, path?: string): string {
    switch (method) {
      case 'POST':
        return 'CREATE';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      case 'GET':
        // Check if path indicates single resource (has :id pattern)
        return path && path.includes(':id') ? 'GET_ONE' : 'GET_LIST';
      default:
        return 'UNKNOWN';
    }
  }
}
