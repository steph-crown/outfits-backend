import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Collection } from '../entities/collection.entity';
import * as bcrypt from 'bcryptjs';

export class TestUtils {
  static async createTestApp(modules: any[]): Promise<INestApplication> {
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
          synchronize: true, // Only for testing
          dropSchema: true, // Clean slate for each test
        }),
        ...modules,
      ],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();
    return app;
  }

  static async createTestUser(
    userRepository: Repository<User>,
    userData: Partial<User> = {},
  ): Promise<User> {
    const defaultUser = {
      email: 'test@example.com',
      username: 'test_user_123',
      password: await bcrypt.hash('Password123!', 12),
      first_name: 'Test',
      last_name: 'User',
      is_admin: false,
      email_verified: false,
      ...userData,
    };

    const user = userRepository.create(defaultUser);
    return await userRepository.save(user);
  }

  static async createTestCollection(
    collectionRepository: Repository<Collection>,
    userId: string,
    collectionData: Partial<Collection> = {},
  ): Promise<Collection> {
    const defaultCollection = {
      userId,
      name: 'Test Collection',
      description: 'A test collection',
      isPublic: false,
      ...collectionData,
    };

    const collection = collectionRepository.create(defaultCollection);
    return await collectionRepository.save(collection);
  }

  static generateJwtToken(jwtService: JwtService, user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };
    return jwtService.sign(payload);
  }

  static async cleanDatabase(repositories: Repository<any>[]): Promise<void> {
    for (const repository of repositories) {
      await repository.clear();
    }
  }

  static getAuthHeaders(token: string): { Authorization: string } {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  static expectErrorResponse(
    response: any,
    status: number,
    message?: string,
  ): void {
    expect(response.status).toBe(status);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('errorCode');
    expect(response.body).toHaveProperty('timestamp');

    if (message) {
      expect(response.body.message).toContain(message);
    }
  }

  static expectSuccessResponse(
    response: any,
    status: number,
    data?: any,
  ): void {
    expect(response.status).toBe(status);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');

    if (data) {
      expect(response.body.data).toMatchObject(data);
    }
  }

  static generateRandomEmail(): string {
    return `test${Date.now()}@example.com`;
  }

  static generateRandomUsername(): string {
    return `testuser${Date.now()}`;
  }
}
