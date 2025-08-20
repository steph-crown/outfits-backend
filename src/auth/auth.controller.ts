import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from '../common/decorators/api-response.decorator';
import { JwtAuthGuard } from './guards/auth.guard';
import { User } from './decorators/user.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UpdateUserDto } from './dto/auth.dto';
import { User as UserEntity } from '../entities/user.entity';

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
  @ApiSuccessResponse('User registered successfully.')
  async register(@Body() registerDto: RegisterDto) {
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
  @ApiSuccessResponse('Login successful')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Logs out the authenticated user. With JWT tokens, this is mainly for logging purposes as token invalidation is handled client-side.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      example: {
        success: true,
        message: 'Logout successful',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiSuccessResponse('Logout successful')
  async logout(@User() user: UserEntity, @Request() req) {
    // Extract token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(user.id, token);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Get the profile of the currently authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'User profile retrieved successfully',
        data: {
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
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async getProfile(@User() user: UserEntity) {
    return {
      success: true,
      message: 'User profile retrieved successfully',
      data: { user },
    };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update the profile of the currently authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async updateProfile(
    @User() user: UserEntity,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.authService.updateProfile(
      user.id,
      updateUserDto,
    );

    return {
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    };
  }
}
