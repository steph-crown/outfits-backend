import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

export class OutfitMediaDto {
  @IsString()
  media_name: string;

  @IsString()
  media_type: 'image' | 'video';

  @IsBoolean()
  is_primary: boolean;

  @IsNumber()
  order_index: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  file_size?: number;
}

export class CreateOutfitDto {
  @IsUrl()
  source_url: string;

  @IsString()
  source_type: string;

  @IsOptional()
  @IsString()
  original_text?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @IsOptional()
  @IsString()
  style_category?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutfitMediaDto)
  media: OutfitMediaDto[];
}


export class OutfitMediaResponseDto {
  @IsString()
  id: string;

  @IsUrl()
  media_url: string;

  @IsString()
  media_type: 'image' | 'video';

  @IsBoolean()
  is_primary: boolean;

  @IsNumber()
  order_index: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  file_size?: number;
}

export class OutfitResponseDto {
  @IsString()
  id: string;

  @IsUrl()
  source_url: string;

  @IsString()
  source_type: string;

  @IsString()
  original_text: string;

  @IsString()
  thumbnail_url: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @IsOptional()
  @IsString()
  style_category?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsString()
  created_at: Date; // ISO string (or you could use Date if you prefer)

  @IsString()
  updated_at: Date;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsArray()
  @Type(() => OutfitMediaResponseDto)
  media: OutfitMediaResponseDto[];
}


export class GetOutfitResponseDto {
  @IsString()
  id: string;

  @IsUrl()
  source_url: string;

  @IsString()
  source_type: string;

  @IsString()
  original_text: string;

  @IsString()
  thumbnail_url: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @IsOptional()
  @IsString()
  style_category?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsString()
  created_at: Date; // ISO string (or you could use Date if you prefer)

  @IsString()
  updated_at: Date;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

}

export class UpdateOutfitDto {
  @IsOptional()
  @IsUrl()
  source_url?: string;

  @IsOptional()
  @IsString()
  source_type?: string;

  @IsOptional()
  @IsString()
  original_text?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @IsOptional()
  @IsString()
  style_category?: string;

  @IsOptional()
  @IsString()
  note?: string;

}

