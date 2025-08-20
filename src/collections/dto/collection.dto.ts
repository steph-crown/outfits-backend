import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({
    description: 'Name of the collection',
    example: 'Summer Casual',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the collection',
    example: 'Casual outfits perfect for summer days',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the collection is public',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Thumbnail URL for the collection',
    example: 'https://example.com/thumbnail.jpg',
  })
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;
}

export class UpdateCollectionDto {
  @ApiPropertyOptional({
    description: 'Name of the collection',
    example: 'Updated Summer Casual',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the collection',
    example: 'Updated description for casual outfits',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the collection is public',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Thumbnail URL for the collection',
    example: 'https://example.com/new-thumbnail.jpg',
  })
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;
}

export class CollectionResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the collection',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the collection',
    example: 'Summer Casual',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the collection',
    example: 'Casual outfits perfect for summer days',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Whether the collection is public',
    example: false,
  })
  isPublic: boolean;

  @ApiProperty({
    description: 'Thumbnail URL for the collection',
    example: 'https://example.com/thumbnail.jpg',
    nullable: true,
  })
  thumbnailUrl: string | null;

  @ApiProperty({
    description: 'Number of outfits in the collection',
    example: 12,
  })
  outfitsCount: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T14:45:00Z',
  })
  updatedAt: Date;
}
