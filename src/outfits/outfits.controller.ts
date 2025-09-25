import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiCreatedResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { User as UserEntity } from '../entities/user.entity';
import {
    CreateOutfitDto,
    OutfitResponseDto,
    UpdateOutfitDto
} from './dto/outfit.dto';
import { OutfitsService } from './outfits.service';

@ApiTags('Outfits')
@UseGuards(JwtAuthGuard)
@Controller('outfits')
export class OutfitsController {
  constructor(private readonly outfitsService: OutfitsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new outfit' })
  @ApiCreatedResponse({
    description: 'The outfit has been successfully created',
    type: OutfitResponseDto,
  })
  async create(
    @Body() createOutfitDto: CreateOutfitDto,
    @User() user: UserEntity,
  ) {
    return this.outfitsService.create(user.id, createOutfitDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all outfits of the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of outfits retrieved successfully',
    type: [OutfitResponseDto],
  })
  async findAll(@User() user: UserEntity) {
    return this.outfitsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific outfit by ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the outfit',
    example: 'a3f5e1d0-9c4b-4bfa-82f0-5d8a2b9f1c6e',
  })
  @ApiResponse({
    status: 200,
    description: 'Outfit retrieved successfully',
    type: OutfitResponseDto,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
  ) {
    return this.outfitsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific outfit by ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the outfit',
    example: 'a3f5e1d0-9c4b-4bfa-82f0-5d8a2b9f1c6e',
  })
  @ApiResponse({
    status: 200,
    description: 'Outfit updated successfully',
    type: OutfitResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOutfitDto: UpdateOutfitDto,
    @User() user: UserEntity,
  ) {
    return this.outfitsService.update(id, user.id, updateOutfitDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific outfit by ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the outfit',
    example: 'a3f5e1d0-9c4b-4bfa-82f0-5d8a2b9f1c6e',
  })
  @ApiResponse({
    status: 204,
    description: 'Outfit deleted successfully',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: UserEntity,
  ) {
    await this.outfitsService.remove(id, user.id);
    return null;
  }
}
