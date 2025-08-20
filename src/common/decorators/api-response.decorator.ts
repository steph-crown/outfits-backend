import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ApiResponseMessage = createParamDecorator(
  (message: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    request.customSuccessMessage = message;
    return message;
  },
);

// Usage: @ApiResponseMessage('User registered successfully')
export const ApiSuccessResponse = (message: string) => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // If result is already formatted, update the message
      if (result && typeof result === 'object' && 'success' in result) {
        return { ...result, message };
      }

      // Return result with custom message
      return {
        success: true,
        message,
        data: result,
      };
    };

    return descriptor;
  };
};
