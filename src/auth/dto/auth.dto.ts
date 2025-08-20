import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'sarah.johnson@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description:
      'User password (min 8 chars, must contain uppercase, lowercase, and number)',
    example: 'SecurePass123',
    minLength: 8,
    maxLength: 128,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  password: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'sarah.johnson@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123',
  })
  @IsString({ message: 'Password is required' })
  password: string;
}

export class UpdateUserDto {
  @ApiProperty({
    description:
      'Unique username (8-20 chars, starts with letter, alphanumeric + underscores)',
    example: 'swift_tiger_2024',
    minLength: 8,
    maxLength: 20,
    required: false,
  })
  @IsString({ message: 'Username must be a string' })
  @MinLength(8, { message: 'Username must be at least 8 characters long' })
  @MaxLength(20, { message: 'Username must not exceed 20 characters' })
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]*[a-zA-Z0-9]$/, {
    message:
      'Username must start with a letter, contain only letters, numbers, and underscores, and not end with an underscore',
  })
  username?: string;

  @ApiProperty({
    description: 'User first name',
    example: 'Sarah',
    maxLength: 100,
    required: false,
  })
  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  first_name?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Johnson',
    maxLength: 100,
    required: false,
  })
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  last_name?: string;

  @ApiProperty({
    description: 'Profile image URL (HTTPS, common image formats)',
    example: 'https://example.com/images/profile.jpg',
    maxLength: 500,
    required: false,
  })
  @IsString({ message: 'Profile image URL must be a string' })
  @MaxLength(500, {
    message: 'Profile image URL must not exceed 500 characters',
  })
  @Matches(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i, {
    message:
      'Profile image URL must be a valid HTTPS URL pointing to an image file',
  })
  profile_image_url?: string;
}
