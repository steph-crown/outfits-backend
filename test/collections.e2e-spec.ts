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

describe('CollectionsController (e2e)', () => {
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

  describe('/collections (POST)', () => {
    let testUser: User;
    let authToken: string;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser(userRepository);
      authToken = TestUtils.generateJwtToken(jwtService, testUser);
    });

    it('should create a collection successfully', async () => {
      const createDto = {
        name: 'Summer Outfits',
        description: 'My favorite summer looks',
        isPublic: false,
      };

      const response = await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(authToken))
        .send(createDto)
        .expect(201);

      TestUtils.expectSuccessResponse(response, 201);
      expect(response.body.data.name).toBe(createDto.name);
      expect(response.body.data.description).toBe(createDto.description);
      expect(response.body.data.isPublic).toBe(createDto.isPublic);
      expect(response.body.data.outfitsCount).toBe(0);
      expect(response.body.data.id).toBeDefined();
    });

    it('should create a public collection', async () => {
      const createDto = {
        name: 'Public Collection',
        description: 'A public collection for everyone',
        isPublic: true,
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
      };

      const response = await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(authToken))
        .send(createDto)
        .expect(201);

      TestUtils.expectSuccessResponse(response, 201);
      expect(response.body.data.isPublic).toBe(true);
      expect(response.body.data.thumbnailUrl).toBe(createDto.thumbnailUrl);
    });

    it('should return 409 for duplicate collection name', async () => {
      const collectionName = 'Duplicate Name';
      await TestUtils.createTestCollection(collectionRepository, testUser.id, {
        name: collectionName,
      });

      const createDto = {
        name: collectionName,
        description: 'Another collection with same name',
      };

      const response = await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(authToken))
        .send(createDto)
        .expect(409);

      TestUtils.expectErrorResponse(
        response,
        409,
        'already have a collection with this name',
      );
    });

    it('should return 401 without authentication', async () => {
      const createDto = {
        name: 'Test Collection',
        description: 'Test description',
      };

      const response = await request(app.getHttpServer())
        .post('/collections')
        .send(createDto)
        .expect(401);

      TestUtils.expectErrorResponse(response, 401);
    });

    it('should return 400 for invalid data', async () => {
      const createDto = {
        name: '', // Empty name should fail validation
        description: 'Test description',
      };

      const response = await request(app.getHttpServer())
        .post('/collections')
        .set(TestUtils.getAuthHeaders(authToken))
        .send(createDto)
        .expect(400);

      TestUtils.expectErrorResponse(response, 400);
    });
  });

  describe('/collections (GET)', () => {
    let testUser: User;
    let otherUser: User;
    let authToken: string;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser(userRepository, {
        email: 'testuser@example.com',
      });
      otherUser = await TestUtils.createTestUser(userRepository, {
        email: 'otheruser@example.com',
      });
      authToken = TestUtils.generateJwtToken(jwtService, testUser);

      // Create test collections
      await TestUtils.createTestCollection(collectionRepository, testUser.id, {
        name: 'My Collection 1',
        description: 'First collection',
      });
      await TestUtils.createTestCollection(collectionRepository, testUser.id, {
        name: 'My Collection 2',
        description: 'Second collection',
      });
      // Other user's collection (should not appear in results)
      await TestUtils.createTestCollection(collectionRepository, otherUser.id, {
        name: 'Other User Collection',
      });
    });

    it('should get user collections successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/collections')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('My Collection 2'); // Most recent first
      expect(response.body.data[1].name).toBe('My Collection 1');
      // Should not include other user's collections
      expect(
        response.body.data.find((c: any) => c.name === 'Other User Collection'),
      ).toBeUndefined();
    });

    it('should return empty array when user has no collections', async () => {
      await TestUtils.cleanDatabase([collectionRepository]);

      const response = await request(app.getHttpServer())
        .get('/collections')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/collections')
        .expect(401);

      TestUtils.expectErrorResponse(response, 401);
    });
  });

  describe('/collections/public (GET)', () => {
    let testUser: User;
    let otherUser: User;
    let authToken: string;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser(userRepository, {
        email: 'testuser@example.com',
      });
      otherUser = await TestUtils.createTestUser(userRepository, {
        email: 'otheruser@example.com',
      });
      authToken = TestUtils.generateJwtToken(jwtService, testUser);

      // Create public and private collections
      await TestUtils.createTestCollection(collectionRepository, testUser.id, {
        name: 'Public Collection 1',
        isPublic: true,
      });
      await TestUtils.createTestCollection(collectionRepository, testUser.id, {
        name: 'Private Collection',
        isPublic: false,
      });
      await TestUtils.createTestCollection(collectionRepository, otherUser.id, {
        name: 'Public Collection 2',
        isPublic: true,
      });
    });

    it('should get public collections successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/collections/public')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);
      expect(response.body.data).toHaveLength(2);
      const collectionNames = response.body.data.map((c: any) => c.name);
      expect(collectionNames).toContain('Public Collection 1');
      expect(collectionNames).toContain('Public Collection 2');
      expect(collectionNames).not.toContain('Private Collection');
    });

    it('should support pagination', async () => {
      // Create more public collections for pagination test
      for (let i = 3; i <= 25; i++) {
        await TestUtils.createTestCollection(
          collectionRepository,
          testUser.id,
          {
            name: `Public Collection ${i}`,
            isPublic: true,
          },
        );
      }

      // Test first page
      const response1 = await request(app.getHttpServer())
        .get('/collections/public?limit=10&offset=0')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      expect(response1.body.data).toHaveLength(10);

      // Test second page
      const response2 = await request(app.getHttpServer())
        .get('/collections/public?limit=10&offset=10')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      expect(response2.body.data).toHaveLength(10);
    });
  });

  describe('/collections/:id (GET)', () => {
    let testUser: User;
    let otherUser: User;
    let authToken: string;
    let testCollection: Collection;
    let publicCollection: Collection;
    let privateCollection: Collection;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser(userRepository, {
        email: 'testuser@example.com',
      });
      otherUser = await TestUtils.createTestUser(userRepository, {
        email: 'otheruser@example.com',
      });
      authToken = TestUtils.generateJwtToken(jwtService, testUser);

      testCollection = await TestUtils.createTestCollection(
        collectionRepository,
        testUser.id,
        {
          name: 'My Test Collection',
          description: 'A collection for testing',
        },
      );

      publicCollection = await TestUtils.createTestCollection(
        collectionRepository,
        otherUser.id,
        {
          name: 'Public Collection',
          description: 'A public collection',
          isPublic: true,
        },
      );

      privateCollection = await TestUtils.createTestCollection(
        collectionRepository,
        otherUser.id,
        {
          name: 'Private Collection',
          description: 'A private collection',
          isPublic: false,
        },
      );
    });

    it('should get own collection successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/collections/${testCollection.id}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);
      expect(response.body.data.id).toBe(testCollection.id);
      expect(response.body.data.name).toBe(testCollection.name);
      expect(response.body.data.description).toBe(testCollection.description);
    });

    it('should get public collection from other user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/collections/${publicCollection.id}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);
      expect(response.body.data.id).toBe(publicCollection.id);
      expect(response.body.data.isPublic).toBe(true);
    });

    it('should return 403 for private collection from other user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/collections/${privateCollection.id}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(403);

      TestUtils.expectErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent collection', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app.getHttpServer())
        .get(`/collections/${fakeId}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(404);

      TestUtils.expectErrorResponse(response, 404, 'Collection not found');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app.getHttpServer())
        .get('/collections/invalid-uuid')
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(400);

      TestUtils.expectErrorResponse(response, 400);
    });
  });

  describe('/collections/:id (PATCH)', () => {
    let testUser: User;
    let otherUser: User;
    let authToken: string;
    let testCollection: Collection;
    let otherUserCollection: Collection;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser(userRepository, {
        email: 'testuser@example.com',
      });
      otherUser = await TestUtils.createTestUser(userRepository, {
        email: 'otheruser@example.com',
      });
      authToken = TestUtils.generateJwtToken(jwtService, testUser);

      testCollection = await TestUtils.createTestCollection(
        collectionRepository,
        testUser.id,
        {
          name: 'Original Name',
          description: 'Original description',
          isPublic: false,
        },
      );

      otherUserCollection = await TestUtils.createTestCollection(
        collectionRepository,
        otherUser.id,
        {
          name: 'Other User Collection',
        },
      );
    });

    it('should update own collection successfully', async () => {
      const updateDto = {
        name: 'Updated Name',
        description: 'Updated description',
        isPublic: true,
        thumbnailUrl: 'https://example.com/new-thumbnail.jpg',
      };

      const response = await request(app.getHttpServer())
        .patch(`/collections/${testCollection.id}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .send(updateDto)
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);
      expect(response.body.data.name).toBe(updateDto.name);
      expect(response.body.data.description).toBe(updateDto.description);
      expect(response.body.data.isPublic).toBe(updateDto.isPublic);
      expect(response.body.data.thumbnailUrl).toBe(updateDto.thumbnailUrl);
    });

    it('should update partial fields only', async () => {
      const updateDto = {
        name: 'Updated Name Only',
      };

      const response = await request(app.getHttpServer())
        .patch(`/collections/${testCollection.id}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .send(updateDto)
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);
      expect(response.body.data.name).toBe(updateDto.name);
      expect(response.body.data.description).toBe(testCollection.description);
      expect(response.body.data.isPublic).toBe(testCollection.isPublic);
    });

    it('should return 409 for duplicate name', async () => {
      const existingName = 'Existing Collection';
      await TestUtils.createTestCollection(collectionRepository, testUser.id, {
        name: existingName,
      });

      const updateDto = {
        name: existingName,
      };

      const response = await request(app.getHttpServer())
        .patch(`/collections/${testCollection.id}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .send(updateDto)
        .expect(409);

      TestUtils.expectErrorResponse(
        response,
        409,
        'already have a collection with this name',
      );
    });

    it('should return 403 for other user collection', async () => {
      const updateDto = {
        name: 'Trying to update others collection',
      };

      const response = await request(app.getHttpServer())
        .patch(`/collections/${otherUserCollection.id}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .send(updateDto)
        .expect(403);

      TestUtils.expectErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent collection', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto = { name: 'New Name' };

      const response = await request(app.getHttpServer())
        .patch(`/collections/${fakeId}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .send(updateDto)
        .expect(404);

      TestUtils.expectErrorResponse(response, 404, 'Collection not found');
    });
  });

  describe('/collections/:id (DELETE)', () => {
    let testUser: User;
    let otherUser: User;
    let authToken: string;
    let testCollection: Collection;
    let otherUserCollection: Collection;

    beforeEach(async () => {
      testUser = await TestUtils.createTestUser(userRepository, {
        email: 'testuser@example.com',
      });
      otherUser = await TestUtils.createTestUser(userRepository, {
        email: 'otheruser@example.com',
      });
      authToken = TestUtils.generateJwtToken(jwtService, testUser);

      testCollection = await TestUtils.createTestCollection(
        collectionRepository,
        testUser.id,
        {
          name: 'Collection to Delete',
        },
      );

      otherUserCollection = await TestUtils.createTestCollection(
        collectionRepository,
        otherUser.id,
        {
          name: 'Other User Collection',
        },
      );
    });

    it('should delete own collection successfully', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/collections/${testCollection.id}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(200);

      TestUtils.expectSuccessResponse(response, 200);

      // Verify collection is actually deleted
      const deletedCollection = await collectionRepository.findOne({
        where: { id: testCollection.id },
      });
      expect(deletedCollection).toBeNull();
    });

    it('should return 403 for other user collection', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/collections/${otherUserCollection.id}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(403);

      TestUtils.expectErrorResponse(response, 403, 'Access denied');

      // Verify collection still exists
      const stillExists = await collectionRepository.findOne({
        where: { id: otherUserCollection.id },
      });
      expect(stillExists).toBeTruthy();
    });

    it('should return 404 for non-existent collection', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .delete(`/collections/${fakeId}`)
        .set(TestUtils.getAuthHeaders(authToken))
        .expect(404);

      TestUtils.expectErrorResponse(response, 404, 'Collection not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/collections/${testCollection.id}`)
        .expect(401);

      TestUtils.expectErrorResponse(response, 401);
    });
  });
});
