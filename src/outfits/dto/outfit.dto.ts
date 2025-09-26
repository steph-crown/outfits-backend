import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

export class OutfitMediaDto {
  @ApiProperty({
    description: 'URL of the media',
    example: 'https://example.com/images/outfit1.jpg',
  })
  @IsString()
  media_url: string;

  @ApiProperty({
    description: 'Type of the media',
    enum: ['image', 'video'],
    example: 'image',
  })
  @IsString()
  media_type: 'image' | 'video';

  @ApiProperty({
    description: 'Whether this media is the primary one',
    example: true,
    default: false,
  })
  @IsBoolean()
  is_primary: boolean;

  @ApiProperty({
    description: 'Order index for sorting',
    example: 0,
  })
  @IsNumber()
  order_index: number;

  @ApiPropertyOptional({
    description: 'Width of the media in pixels',
    example: 1080,
  })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({
    description: 'Height of the media in pixels',
    example: 1920,
  })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 204800,
  })
  @IsOptional()
  @IsNumber()
  file_size?: number;
}


export class CreateOutfitDto {
  @ApiProperty({
    description: 'Source URL of the outfit',
    example: 'https://example.com/outfit-source',
  })
  @IsUrl()
  source_url: string;

  @ApiProperty({
    description: 'Source type of the outfit',
    example: 'Instagram',
  })
  @IsString()
  source_type: string;

  @ApiPropertyOptional({
    description: 'Original text description of the outfit',
    example: 'A chic summer outfit with floral patterns.',
  })
  @IsOptional()
  @IsString()
  original_text?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Tags associated with the outfit',
    example: ['summer', 'casual', 'floral'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Colors associated with the outfit',
    example: ['red', 'white'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @ApiPropertyOptional({
    description: 'Style category of the outfit',
    example: 'Casual',
  })
  @IsOptional()
  @IsString()
  style_category?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the outfit',
    example: 'Perfect for beach trips or casual strolls.',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    type: [OutfitMediaDto],
    description: 'Media associated with the outfit',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutfitMediaDto)
  media: OutfitMediaDto[];
}

export class OutfitMediaResponseDto {
  @ApiProperty({
    description: 'Unique ID of the media',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'URL of the media',
    example: 'https://example.com/images/outfit1.jpg',
  })
  @IsUrl()
  media_url: string;

  @ApiProperty({
    description: 'Type of the media',
    enum: ['image', 'video'],
    example: 'image',
  })
  @IsString()
  media_type: 'image' | 'video';

  @ApiProperty({
    description: 'Whether this media is the primary one',
    example: true,
    default: false,
  })
  @IsBoolean()
  is_primary: boolean;

  @ApiProperty({
    description: 'Order index for sorting',
    example: 0,
  })
  @IsNumber()
  order_index: number;

  @ApiPropertyOptional({
    description: 'Width of the media in pixels',
    example: 1080,
  })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({
    description: 'Height of the media in pixels',
    example: 1920,
  })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 204800,
  })
  @IsOptional()
  @IsNumber()
  file_size?: number;
}

export class OutfitResponseDto {
  @ApiProperty({
    description: 'Unique ID of the outfit',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Source URL of the outfit',
    example: 'https://example.com/outfit-source',
  })
  @IsUrl()
  source_url: string;

  @ApiProperty({
    description: 'Source type of the outfit',
    example: 'Instagram',
  })
  @IsString()
  source_type: string;

  @ApiProperty({
    description: 'Original text description of the outfit',
    example: 'A chic summer outfit with floral patterns.',
  })
  @IsString()
  original_text: string;

  @ApiProperty({
    description: 'Thumbnail URL of the outfit',
    example: 'https://example.com/images/outfit1-thumb.jpg',
  })
  @IsString()
  thumbnail_url: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Colors associated with the outfit',
    example: ['red', 'white'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @ApiPropertyOptional({
    description: 'Style category of the outfit',
    example: 'Casual',
  })
  @IsOptional()
  @IsString()
  style_category?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the outfit',
    example: 'Perfect for beach trips or casual strolls.',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-09-25T10:30:00.000Z',
  })
  @IsString()
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-09-25T12:45:00.000Z',
  })
  @IsString()
  updated_at: Date;

  @ApiProperty({
    type: [String],
    description: 'Tags associated with the outfit',
    example: ['summer', 'casual', 'floral'],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({
    type: [OutfitMediaResponseDto],
    description: 'Media associated with the outfit',
  })
  @IsArray()
  @Type(() => OutfitMediaResponseDto)
  media: OutfitMediaResponseDto[];
}

export class GetOutfitResponseDto {
  @ApiProperty({
    description: 'Unique ID of the outfit',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Source URL of the outfit',
    example: 'https://example.com/outfit-source',
  })
  @IsUrl()
  source_url: string;

  @ApiProperty({
    description: 'Source type of the outfit',
    example: 'Instagram',
  })
  @IsString()
  source_type: string;

  @ApiProperty({
    description: 'Original text description of the outfit',
    example: 'A chic summer outfit with floral patterns.',
  })
  @IsString()
  original_text: string;

  @ApiProperty({
    description: 'Thumbnail URL of the outfit',
    example: 'https://example.com/images/outfit1-thumb.jpg',
  })
  @IsString()
  thumbnail_url: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Colors associated with the outfit',
    example: ['red', 'white'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @ApiPropertyOptional({
    description: 'Style category of the outfit',
    example: 'Casual',
  })
  @IsOptional()
  @IsString()
  style_category?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the outfit',
    example: 'Perfect for beach trips or casual strolls.',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-09-25T10:30:00.000Z',
  })
  @IsString()
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-09-25T12:45:00.000Z',
  })
  @IsString()
  updated_at: Date;

  @ApiProperty({
    type: [String],
    description: 'Tags associated with the outfit',
    example: ['summer', 'casual', 'floral'],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
  
  @ApiProperty({
    type: [OutfitMediaResponseDto],
    description: 'Media associated with the outfit',
  })
  @IsArray()
  @Type(() => OutfitMediaResponseDto)
  media: OutfitMediaResponseDto[];
}

export class UpdateOutfitDto {
  @ApiPropertyOptional({
    description: 'Source URL of the outfit',
    example: 'https://example.com/outfit-source',
  })
  @IsOptional()
  @IsUrl()
  source_url?: string;

  @ApiPropertyOptional({
    description: 'Source type of the outfit',
    example: 'Instagram',
  })
  @IsOptional()
  @IsString()
  source_type?: string;

  @ApiPropertyOptional({
    description: 'Original text description of the outfit',
    example: 'A chic summer outfit with floral patterns.',
  })
  @IsOptional()
  @IsString()
  original_text?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Colors associated with the outfit',
    example: ['red', 'white'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @ApiPropertyOptional({
    description: 'Style category of the outfit',
    example: 'Casual',
  })
  @IsOptional()
  @IsString()
  style_category?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the outfit',
    example: 'Perfect for beach trips or casual strolls.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}