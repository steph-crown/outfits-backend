import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { CollectionsService } from './collections.service';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  CollectionResponseDto,
} from './dto/collection.dto';
import { User as UserEntity } from '../entities/user.entity';

@ApiTags('Collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new collection',
    description: 'Create a new outfit collection for the authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'Collection created successfully',
    type: CollectionResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Collection name already exists for this user',
    schema: {
      example: {
        success: false,
        message: 'You already have a collection with this name',
        errorCode: 'CONFLICT',
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  async create(
    @Body() createCollectionDto: CreateCollectionDto,
    @User() user: UserEntity,
  ) {
    return this.collectionsService.create(user.id, createCollectionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get user collections',
    description: 'Retrieve all collections belonging to the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Collections retrieved successfully',
    type: [CollectionResponseDto],
  })
  async findAll(@User() user: UserEntity) {
    return this.collectionsService.findAll(user.id);
  }

  @Get('public')
  @ApiOperation({
    summary: 'Get public collections',
    description: 'Retrieve public collections from all users',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of collections to return',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of collections to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Public collections retrieved successfully',
    type: [CollectionResponseDto],
  })
  async findPublic(@Query('limit') limit = 20, @Query('offset') offset = 0) {
    return this.collectionsService.findPublicCollections(+limit, +offset);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get collection by ID',
    description: 'Retrieve a specific collection by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Collection UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection retrieved successfully',
    type: CollectionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found',
    schema: {
      example: {
        success: false,
        message: 'Collection not found',
        errorCode: 'NOT_FOUND',
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to private collection',
    schema: {
      example: {
        success: false,
        message: 'Access denied to this collection',
        errorCode: 'FORBIDDEN',
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
  ) {
    return this.collectionsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update collection',
    description: 'Update a collection owned by the authenticated user',
  })
  @ApiParam({
    name: 'id',
    description: 'Collection UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection updated successfully',
    type: CollectionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot update collection owned by another user',
  })
  @ApiResponse({
    status: 409,
    description: 'Collection name already exists for this user',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
    @User() user: UserEntity,
  ) {
    return this.collectionsService.update(id, user.id, updateCollectionDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete collection',
    description: 'Delete a collection owned by the authenticated user',
  })
  @ApiParam({
    name: 'id',
    description: 'Collection UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot delete collection owned by another user',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
  ) {
    await this.collectionsService.remove(id, user.id);
    return null;
  }
}
