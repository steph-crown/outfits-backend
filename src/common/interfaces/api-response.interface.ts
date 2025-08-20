export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
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

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: string | string[];
    timestamp: string;
    path: string;
    method: string;
    statusCode: number;
    stack?: string; // Only in development
  };
}
