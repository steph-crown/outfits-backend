import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthResponse, AuthService } from './auth.service';
import { LoginDto, RegisterDto, UpdateUserDto } from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account with email and password. Automatically generates a unique username.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    example: {
      user: {
        id: 'uuid-string',
        email: 'sarah.johnson@example.com',
        username: 'swift_tiger_2024',
        first_name: null,
        last_name: null,
        profile_image_url: null,
        is_admin: false,
        email_verified: false,
        last_login_at: '2025-08-20T13:47:42.000Z',
        created_at: '2025-08-20T13:47:42.000Z',
        updated_at: '2025-08-20T13:47:42.000Z',
      },
      access_token: 'jwt-token-string',
      message: 'User registered successfully. Please verify your email.',
    },
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description:
      'Authenticates user with email and password, returns JWT token.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    example: {
      user: {
        id: 'uuid-string',
        email: 'sarah.johnson@example.com',
        username: 'swift_tiger_2024',
        first_name: 'Sarah',
        last_name: 'Johnson',
        profile_image_url: 'https://example.com/images/profile.jpg',
        is_admin: false,
        email_verified: false,
        last_login_at: '2025-08-20T13:50:15.000Z',
        created_at: '2025-08-20T13:47:42.000Z',
        updated_at: '2025-08-20T13:50:15.000Z',
      },
      access_token: 'jwt-token-string',
      message: 'Login successful',
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Get('profile/:id')
  async getProfile(@Param('id') userId: string) {
    const user = await this.authService.getUserById(userId);

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        data: null,
      };
    }

    return {
      success: true,
      message: 'User profile retrieved successfully',
      data: { user },
    };
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Request() req: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // In a real implementation, you'd get userId from JWT token
    // For now, we'll require it to be passed in the request body
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return {
        success: false,
        message: 'User ID is required',
        data: null,
      };
    }

    const user = await this.authService.updateProfile(userId, updateUserDto);

    return {
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    };
  }
}
