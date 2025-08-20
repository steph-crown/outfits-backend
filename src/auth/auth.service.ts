import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UsernameGenerator } from '../utils/username-generator';
import { JwtPayload } from './auth.config';

export interface AuthResponse {
  user: Partial<User>;
  access_token: string;
  message: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate secure username
    let username: string;
    let isUsernameUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      username = await UsernameGenerator.generate();
      const existingUsername = await this.userRepository.findOne({
        where: { username },
      });
      isUsernameUnique = !existingUsername;
      attempts++;
    } while (!isUsernameUnique && attempts < maxAttempts);

    if (!isUsernameUnique) {
      throw new BadRequestException(
        'Unable to generate unique username. Please try again.',
      );
    }

    // Hash password with high cost factor for security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      username,
      email_verified: false,
      is_admin: false,
      last_login_at: new Date(),
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const payload: JwtPayload = {
      sub: savedUser.id,
      email: savedUser.email,
      username: savedUser.username,
    };
    const access_token = this.jwtService.sign(payload);

    // Return user without sensitive data
    const {
      password: _password,
      is_admin: _isAdmin,
      ...userWithoutPassword
    } = savedUser;

    void _password;
    void _isAdmin;

    return {
      user: userWithoutPassword,
      access_token,
      message: 'User registered successfully. Please verify your email.',
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Use same error message to prevent email enumeration
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.userRepository.update(user.id, {
      last_login_at: new Date(),
    });

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };
    const access_token = this.jwtService.sign(payload);

    // Return user without sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      access_token,
      message: 'Login successful',
    };
  }

  async getUserById(userId: string): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    // Return user without sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(
    userId: string,
    updateData: Partial<User>,
  ): Promise<Partial<User>> {
    // Validate username if provided
    if (updateData.username) {
      if (!UsernameGenerator.isValid(updateData.username)) {
        throw new BadRequestException(
          'Username does not meet security requirements',
        );
      }

      // Check username uniqueness
      const existingUser = await this.userRepository.findOne({
        where: { username: updateData.username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Username is already taken');
      }
    }

    // Prevent updating protected fields by destructuring them out
    const { password, is_admin, email_verified, ...allowedUpdates } =
      updateData;

    // These variables are intentionally destructured to prevent them from being updated
    void password;
    void is_admin;
    void email_verified;

    await this.userRepository.update(userId, allowedUpdates);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!updatedUser) {
      throw new BadRequestException('User not found');
    }

    // Return user without sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _userPassword, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}
