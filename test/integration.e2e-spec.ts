import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { CollectionsModule } from '../src/collections/collections.module';
import { User } from '../src/entities/user.entity';
import { Collection } from '../src/entities/collection.entity';
import { TestUtils } from '../src/test/test.utils';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

describe('Integration Tests (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let collectionRepository: Repository<Collection>;

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
        CollectionsModule,
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
    collectionRepository = moduleFixture.get('CollectionRepository');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await TestUtils.cleanDatabase([userRepository, collectionRepository]);
  });

  describe('Complete User Journey', () => {
    it('should handle complete user registration to collections management flow', async () => {
      const userData = {
        email: 'john@example.com',
        password: 'Password123',
      };

      // 1. Register a new user
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      TestUtils.expectSuccessResponse(registerResponse, 201);
      expect(registerResponse.body.data.user.email).toBe(userData.email);

      // 2. Login with the new user
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      TestUtils.expectSuccessResponse(loginResponse, 200);
      const { accessToken } = loginResponse.body.data;
      expect(accessToken).toBeDefined();

      // 3. Get user profile
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set(TestUtils.getAuthHeaders(accessToken))
        .expect(200);

      TestUtils.expectSuccessResponse(profileResponse, 200);
      expect(profileResponse.body.data.email).toBe(userData.email);

      // 4. Create first collection
      const firstCollection = {
        name: 'My First Collection',
        description: 'Starting my outfit journey',
        isPublic: false,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(accessToken))
        .send(firstCollection)
        .expect(201);

      TestUtils.expectSuccessResponse(createResponse, 201);
      const collectionId = createResponse.body.data.id;

      // 5. Create another collection
      await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(accessToken))
        .send({
          name: 'Public Summer Collection',
          description: 'My summer looks for everyone',
          isPublic: true,
        })
        .expect(201);

      // 6. Get all user collections
      const collectionsResponse = await request(app.getHttpServer())
        .get('/collections')
        .set(TestUtils.getAuthHeaders(accessToken))
        .expect(200);

      TestUtils.expectSuccessResponse(collectionsResponse, 200);
      expect(collectionsResponse.body.data).toHaveLength(2);

      // 7. Update first collection
      const updateResponse = await request(app.getHttpServer())
        .patch(`/collections/${collectionId}`)
        .set(TestUtils.getAuthHeaders(accessToken))
        .send({
          name: 'My Updated Collection',
          isPublic: true,
        })
        .expect(200);

      TestUtils.expectSuccessResponse(updateResponse, 200);
      expect(updateResponse.body.data.name).toBe('My Updated Collection');
      expect(updateResponse.body.data.isPublic).toBe(true);

      // 8. Get public collections (should include user's public collections)
      const publicResponse = await request(app.getHttpServer())
        .get('/collections/public')
        .set(TestUtils.getAuthHeaders(accessToken))
        .expect(200);

      TestUtils.expectSuccessResponse(publicResponse, 200);
      expect(publicResponse.body.data).toHaveLength(2);

      // 9. Logout user
      const logoutResponse = await request(app.getHttpServer())
        .post('/auth/logout')
        .set(TestUtils.getAuthHeaders(accessToken))
        .expect(200);

      TestUtils.expectSuccessResponse(logoutResponse, 200);

      // 10. Try to access collections with blacklisted token (should fail)
      const unauthorizedResponse = await request(app.getHttpServer())
        .get('/collections')
        .set(TestUtils.getAuthHeaders(accessToken))
        .expect(401);

      TestUtils.expectErrorResponse(unauthorizedResponse, 401);
    });
  });

  describe('Multi-User Interactions', () => {
    let user1: User;
    let user2: User;
    let user1Token: string;
    let user2Token: string;

    beforeEach(async () => {
      // Create two users
      user1 = await TestUtils.createTestUser(userRepository, {
        email: 'user1@example.com',
        first_name: 'User',
        last_name: 'One',
      });
      user2 = await TestUtils.createTestUser(userRepository, {
        email: 'user2@example.com',
        first_name: 'User',
        last_name: 'Two',
      });

      user1Token = TestUtils.generateJwtToken(jwtService, user1);
      user2Token = TestUtils.generateJwtToken(jwtService, user2);
    });

    it('should handle privacy correctly between users', async () => {
      // User 1 creates private and public collections
      const privateCollection = await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(user1Token))
        .send({
          name: 'User 1 Private Collection',
          description: 'Only I can see this',
          isPublic: false,
        })
        .expect(201);

      const publicCollection = await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(user1Token))
        .send({
          name: 'User 1 Public Collection',
          description: 'Everyone can see this',
          isPublic: true,
        })
        .expect(201);

      const privateId = privateCollection.body.data.id;
      const publicId = publicCollection.body.data.id;

      // User 2 tries to access User 1's private collection (should fail)
      await request(app.getHttpServer())
        .get(`/collections/${privateId}`)
        .set(TestUtils.getAuthHeaders(user2Token))
        .expect(403);

      // User 2 can access User 1's public collection
      const publicResponse = await request(app.getHttpServer())
        .get(`/collections/${publicId}`)
        .set(TestUtils.getAuthHeaders(user2Token))
        .expect(200);

      TestUtils.expectSuccessResponse(publicResponse, 200);
      expect(publicResponse.body.data.name).toBe('User 1 Public Collection');

      // User 2 cannot modify User 1's collections
      await request(app.getHttpServer())
        .patch(`/collections/${publicId}`)
        .set(TestUtils.getAuthHeaders(user2Token))
        .send({ name: 'Trying to hack' })
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/collections/${publicId}`)
        .set(TestUtils.getAuthHeaders(user2Token))
        .expect(403);

      // User 1 can still modify their own collections
      await request(app.getHttpServer())
        .patch(`/collections/${publicId}`)
        .set(TestUtils.getAuthHeaders(user1Token))
        .send({ name: 'Updated by owner' })
        .expect(200);
    });

    it('should handle collection name conflicts per user', async () => {
      const collectionName = 'Same Collection Name';

      // Both users can create collections with the same name
      await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(user1Token))
        .send({
          name: collectionName,
          description: 'User 1 version',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(user2Token))
        .send({
          name: collectionName,
          description: 'User 2 version',
        })
        .expect(201);

      // But each user cannot create duplicate names for themselves
      await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(user1Token))
        .send({
          name: collectionName,
          description: 'Duplicate attempt',
        })
        .expect(409);
    });

    it('should correctly filter public collections from multiple users', async () => {
      // User 1 creates mixed visibility collections
      await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(user1Token))
        .send({
          name: 'User1 Public 1',
          isPublic: true,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(user1Token))
        .send({
          name: 'User1 Private 1',
          isPublic: false,
        })
        .expect(201);

      // User 2 creates mixed visibility collections
      await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(user2Token))
        .send({
          name: 'User2 Public 1',
          isPublic: true,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(user2Token))
        .send({
          name: 'User2 Private 1',
          isPublic: false,
        })
        .expect(201);

      // Get public collections should only return public ones
      const publicResponse = await request(app.getHttpServer())
        .get('/collections/public')
        .set(TestUtils.getAuthHeaders(user1Token))
        .expect(200);

      TestUtils.expectSuccessResponse(publicResponse, 200);
      expect(publicResponse.body.data).toHaveLength(2);

      const publicNames = publicResponse.body.data.map((c: any) => c.name);
      expect(publicNames).toContain('User1 Public 1');
      expect(publicNames).toContain('User2 Public 1');
      expect(publicNames).not.toContain('User1 Private 1');
      expect(publicNames).not.toContain('User2 Private 1');
    });
  });

  describe('Token Invalidation and Security', () => {
    let testUser: User;
    let authToken: string;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser(userRepository);
      authToken = TestUtils.generateJwtToken(jwtService, testUser);

      // Create a test collection
      await TestUtils.createTestCollection(collectionRepository, testUser.id);
    });

    it('should invalidate tokens across all endpoints after logout', async () => {
      // Verify token works before logout
      await request(app.getHttpServer())
        .get('/collections')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      await request(app.getHttpServer())
        .get('/auth/profile')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      // Logout user
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      // All endpoints should now reject the token
      await request(app.getHttpServer())
        .get('/collections')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(401);

      await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(authToken))
        .send({ name: 'Test' })
        .expect(401);

      await request(app.getHttpServer())
        .get('/auth/profile')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(401);
    });

    it('should handle malformed and missing tokens', async () => {
      // No authorization header
      await request(app.getHttpServer()).get('/collections').expect(401);

      // Malformed authorization header
      await request(app.getHttpServer())
        .get('/collections')
        .set('Authorization', 'InvalidToken')
        .expect(401);

      // Invalid JWT format
      await request(app.getHttpServer())
        .get('/collections')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    let testUser: User;
    let authToken: string;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser(userRepository);
      authToken = TestUtils.generateJwtToken(jwtService, testUser);
    });

    it('should handle database constraints and validation errors', async () => {
      // Try to create collection with invalid data
      await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(authToken))
        .send({
          name: '', // Empty name
          description: 'Valid description',
        })
        .expect(400);

      // Try to create collection with extremely long name
      await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(authToken))
        .send({
          name: 'a'.repeat(256), // Assuming max length is 255
          description: 'Valid description',
        })
        .expect(400);
    });

    it('should handle non-existent resource operations gracefully', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      // Operations on non-existent collection
      await request(app.getHttpServer())
        .get(`/collections/${fakeId}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(404);

      await request(app.getHttpServer())
        .patch(`/collections/${fakeId}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .send({ name: 'New Name' })
        .expect(404);

      await request(app.getHttpServer())
        .delete(`/collections/${fakeId}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(404);
    });

    it('should handle invalid UUID formats', async () => {
      const invalidUuids = ['invalid-uuid', '123', 'not-a-uuid-at-all'];

      for (const invalidId of invalidUuids) {
        await request(app.getHttpServer())
          .get(`/collections/${invalidId}`)
          .set(TestUtils.getAuthHeaders(authToken))
          .expect(400);
      }
    });
  });

  describe('Performance and Pagination', () => {
    let testUser: User;
    let authToken: string;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser(userRepository);
      authToken = TestUtils.generateJwtToken(jwtService, testUser);

      // Create multiple collections for pagination testing
      for (let i = 1; i <= 25; i++) {
        await TestUtils.createTestCollection(
          collectionRepository,
          testUser.id,
          {
            name: `Collection ${i.toString().padStart(2, '0')}`,
            description: `Description for collection ${i}`,
            isPublic: i % 2 === 0, // Even numbered collections are public
          },
        );
      }
    });

    it('should handle large collections list with proper ordering', async () => {
      const response = await request(app.getHttpServer())
        .get('/collections')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);
      expect(response.body.data).toHaveLength(25);

      // Verify ordering (most recent first)
      const names = response.body.data.map((c: any) => c.name);
      expect(names[0]).toBe('Collection 25'); // Most recent
      expect(names[24]).toBe('Collection 01'); // Oldest
    });

    it('should handle public collections pagination', async () => {
      // First page
      const page1 = await request(app.getHttpServer())
        .get('/collections/public?limit=5&offset=0')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      expect(page1.body.data).toHaveLength(5);

      // Second page
      const page2 = await request(app.getHttpServer())
        .get('/collections/public?limit=5&offset=5')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      expect(page2.body.data).toHaveLength(5);

      // Verify no overlap
      const page1Ids = page1.body.data.map((c: any) => c.id);
      const page2Ids = page2.body.data.map((c: any) => c.id);
      const intersection = page1Ids.filter((id: string) =>
        page2Ids.includes(id),
      );
      expect(intersection).toHaveLength(0);
    });

    it('should handle invalid pagination parameters', async () => {
      // Negative offset
      await request(app.getHttpServer())
        .get('/collections/public?offset=-1')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(400);

      // Invalid limit
      await request(app.getHttpServer())
        .get('/collections/public?limit=0')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(400);

      // Non-numeric parameters
      await request(app.getHttpServer())
        .get('/collections/public?limit=abc&offset=xyz')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(400);
    });
  });
});
