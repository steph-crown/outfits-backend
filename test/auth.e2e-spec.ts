import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AuthModule } from '../src/auth/auth.module';
import { TokenBlacklistService } from '../src/auth/services/token-blacklist.service';
import { User } from '../src/entities/user.entity';
import { Collection } from '../src/entities/collection.entity';
import { TestUtils } from '../src/test/test.utils';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let tokenBlacklistService: TokenBlacklistService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
          username: process.env.DB_USERNAME || 'outfits_db_dev',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME_TEST || 'outfits_db_test',
          entities: [User, Collection],
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
      ],
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useClass: ResponseInterceptor,
        },
        {
          provide: APP_FILTER,
          useClass: AllExceptionsFilter,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    userRepository = moduleFixture.get('UserRepository');
    tokenBlacklistService = moduleFixture.get<TokenBlacklistService>(
      TokenBlacklistService,
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await TestUtils.cleanDatabase([userRepository]);
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        first_name: 'John',
        last_name: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      TestUtils.expectSuccessResponse(response, 201);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data.user.email).toBe(registerDto.email);
      expect(response.body.data.user.first_name).toBe(registerDto.first_name);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should generate unique username when not provided', async () => {
      const registerDto = {
        email: 'testuser@example.com',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body.data.user.username).toBeDefined();
      expect(response.body.data.user.username).toMatch(/^[a-z]+_[a-z]+_\d{4}$/);
    });

    it('should return 409 when email already exists', async () => {
      const email = 'duplicate@example.com';
      await TestUtils.createTestUser(userRepository, { email });

      const registerDto = {
        email,
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);

      TestUtils.expectErrorResponse(
        response,
        409,
        'email address is already registered',
      );
    });

    it('should return 400 for invalid email format', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      TestUtils.expectErrorResponse(response, 400);
    });

    it('should return 400 for weak password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: '123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      TestUtils.expectErrorResponse(response, 400);
    });
  });

  describe('/auth/login (POST)', () => {
    let testUser: User;
    const userPassword = 'Password123!';

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser(userRepository, {
        email: 'logintest@example.com',
        password: await bcrypt.hash(userPassword, 12),
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: testUser.email,
        password: userPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 for invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: userPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      TestUtils.expectErrorResponse(response, 401, 'Invalid email or password');
    });

    it('should return 401 for invalid password', async () => {
      const loginDto = {
        email: testUser.email,
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      TestUtils.expectErrorResponse(response, 401, 'Invalid email or password');
    });

    it('should be case insensitive for email', async () => {
      const loginDto = {
        email: testUser.email.toUpperCase(),
        password: userPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);
    });
  });

  describe('/auth/logout (POST)', () => {
    let testUser: User;
    let authToken: string;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser(userRepository);
      authToken = TestUtils.generateJwtToken(jwtService, testUser);
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);
      expect(response.body.data.message).toContain(
        'Token has been invalidated',
      );
    });

    it('should return 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);

      TestUtils.expectErrorResponse(response, 401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set(TestUtils.getAuthHeaders('invalid-token'))
        .expect(401);

      TestUtils.expectErrorResponse(response, 401);
    });

    it('should invalidate token after logout', async () => {
      // Logout first
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      // Try to use the same token again
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(401);

      TestUtils.expectErrorResponse(
        response,
        401,
        'Token has been invalidated',
      );
    });
  });

  describe('/auth/profile (GET)', () => {
    let testUser: User;
    let authToken: string;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser(userRepository, {
        first_name: 'Profile',
        last_name: 'Test',
      });
      authToken = TestUtils.generateJwtToken(jwtService, testUser);
    });

    it('should get user profile successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);

      TestUtils.expectErrorResponse(response, 401);
    });
  });

  describe('/auth/profile (PUT)', () => {
    let testUser: User;
    let authToken: string;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser(userRepository);
      authToken = TestUtils.generateJwtToken(jwtService, testUser);
    });

    it('should update profile successfully', async () => {
      const updateDto = {
        first_name: 'Updated',
        last_name: 'Name',
        profile_image_url: 'https://example.com/new-avatar.jpg',
      };

      const response = await request(app.getHttpServer())
        .put('/auth/profile')
        .set(TestUtils.getAuthHeaders(authToken))
        .send(updateDto)
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);
      expect(response.body.data.user.first_name).toBe(updateDto.first_name);
      expect(response.body.data.user.last_name).toBe(updateDto.last_name);
      expect(response.body.data.user.profile_image_url).toBe(
        updateDto.profile_image_url,
      );
    });

    it('should not allow updating protected fields', async () => {
      const updateDto = {
        email: 'newemail@example.com',
        password: 'newpassword',
        is_admin: true,
        email_verified: true,
      };

      const response = await request(app.getHttpServer())
        .put('/auth/profile')
        .set(TestUtils.getAuthHeaders(authToken))
        .send(updateDto)
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.is_admin).toBe(false);
    });

    it('should return 401 without token', async () => {
      const updateDto = { first_name: 'Test' };

      const response = await request(app.getHttpServer())
        .put('/auth/profile')
        .send(updateDto)
        .expect(401);

      TestUtils.expectErrorResponse(response, 401);
    });
  });

  describe('Token Blacklist Service', () => {
    it('should blacklist tokens correctly', () => {
      const token = 'test-token-123';

      expect(tokenBlacklistService.isTokenBlacklisted(token)).toBe(false);

      tokenBlacklistService.blacklistToken(token);

      expect(tokenBlacklistService.isTokenBlacklisted(token)).toBe(true);
    });

    it('should handle multiple tokens', () => {
      const tokens = ['token1', 'token2', 'token3'];

      tokens.forEach((token) => {
        tokenBlacklistService.blacklistToken(token);
      });

      tokens.forEach((token) => {
        expect(tokenBlacklistService.isTokenBlacklisted(token)).toBe(true);
      });

      expect(tokenBlacklistService.isTokenBlacklisted('non-blacklisted')).toBe(
        false,
      );
    });
  });
});
