import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Outfit } from 'src/entities/outfit.entity';
import { OutfitMedia } from 'src/entities/outfit_media.entity';
import { Tags } from 'src/entities/tag.entity';
import { In, Repository } from 'typeorm';
import { CreateOutfitDto, GetOutfitResponseDto, OutfitResponseDto, UpdateOutfitDto } from './dto/outfit.dto';

@Injectable()
export class OutfitsService {
  constructor(
    private readonly s3Client: S3Client,
    @InjectRepository(Tags)
    private readonly tagRepository: Repository<Tags>,
    @InjectRepository(Outfit)
    private readonly outfitRepository: Repository<Outfit>,
    @InjectRepository(OutfitMedia)
    private readonly outfitMediaRepository: Repository<OutfitMedia>,
  ) { }

  async create(
    userId: string,
    createOutfitDto: CreateOutfitDto,
  ): Promise<OutfitResponseDto> {

    const primaryCount = createOutfitDto.media.filter(m => m.is_primary).length;
    if (primaryCount > 1) {
      throw new ConflictException('Only one media item can be primary');
    }
    const primaryMedia = createOutfitDto.media.find(m => m.is_primary);

    const outfit = this.outfitRepository.create({
      user_id: userId,
      source_url: createOutfitDto.source_url,
      source_type: createOutfitDto.source_url,
      thumbnail_url: primaryMedia.media_name,
      original_text: createOutfitDto.original_text,
      colors: createOutfitDto.colors,
      style_category: createOutfitDto.style_category,
      note: createOutfitDto.note,
    })
    const savedOutfit = await this.outfitRepository.save(outfit);

    const medias = createOutfitDto.media.map(media => ({
      outfit_id: savedOutfit.id,
      media_name: media.media_name,
      media_type: media.media_type,
      is_primary: media.is_primary,
      order_index: media.order_index,
      width: media.width,
      height: media.height,
      file_size: media.file_size,
    }));
    const savedOutfitMedias = await this.outfitMediaRepository.save(medias)

    const tagValues = createOutfitDto.tags.map(name => ({
      user_id: userId,
      name,
    }));

    // Insert tags, ignoring duplicates
    await this.tagRepository
      .createQueryBuilder()
      .insert()
      .into(Tags)
      .values(tagValues)
      .orIgnore()  // <-- skip duplicates
      .execute();

    // Fetch all tags (new + existing)
    const savedTags = await this.tagRepository.find({
      where: {
        user_id: userId,
        name: In(createOutfitDto.tags),
      },
    });

    const tagOutfit = await this.outfitRepository.findOne({
      where: { id: savedOutfit.id },
      relations: ["tags"],
    });

    tagOutfit.tags.push(...savedTags);
    await this.outfitRepository.save(tagOutfit);

    await Promise.all(
      savedOutfitMedias.map(async (media) => {
        const command = new GetObjectCommand({
          Bucket: "outfits-app-bucket",
          Key: media.media_name,
        });
        media.media_name = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      })
    );

    const command = new GetObjectCommand({
      Bucket: "outfits-app-bucket",
      Key: savedOutfit.thumbnail_url,
    });
    const thumbnailUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    return plainToInstance(OutfitResponseDto, {
      ...savedOutfit,
      thumbnail_url: thumbnailUrl,
      tags: savedTags.map(m => (m.name)),
      media: savedOutfitMedias.map(m => ({
        id: m.id,
        media_url: m.media_name, // signed URL
        media_type: m.media_type,
        is_primary: m.is_primary,
        order_index: m.order_index,
        width: m.width,
        height: m.height,
        file_size: m.file_size
      })),
    });
  }

  async findAll(userId: string): Promise<GetOutfitResponseDto[]> {
    const outfits = await this.outfitRepository
      .createQueryBuilder('outfit')
      .leftJoinAndSelect('outfit.tags', 'tag') // still fetch tags
      .where('outfit.user_id = :userId', { userId })
      .orderBy('outfit.created_at', 'DESC')
      .getMany();

    await Promise.all(
      outfits.map(async (outfit) => {
        const command = new GetObjectCommand({
          Bucket: "outfits-app-bucket",
          Key: outfit.thumbnail_url,
        });
        outfit.thumbnail_url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      })
    );

    const transformed = outfits.map((o) => ({
      ...o,
      tags: o.tags.map((t) => t.name),
    }));

    return plainToInstance(OutfitResponseDto, transformed)

  }


  async findOne(id: string, userId: string): Promise<GetOutfitResponseDto> {
    const outfit = await this.outfitRepository.findOne({
      where: { id },
      relations: ["tags"],
    });

    if (!outfit) {
      throw new NotFoundException('outfit not found');
    }

    // Check if user owns this collection or if it's public
    if (outfit.user_id !== userId) {
      throw new ForbiddenException('Access denied to this outfit');
    }

    const command = new GetObjectCommand({
      Bucket: "outfits-app-bucket",
      Key: outfit.thumbnail_url,
    });
    outfit.thumbnail_url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    return plainToInstance(OutfitResponseDto, {
      ...outfit,
      tags: outfit.tags.map((t) => t.name),
    });
  }


  async update(
    id: string,
    userId: string,
    updateOutfitDto: UpdateOutfitDto,
  ): Promise<GetOutfitResponseDto> {
    const outfit = await this.outfitRepository.findOne({
      where: { id },
      relations: ["tags"],
    });

    if (!outfit) {
      throw new NotFoundException('outfit not found');
    }

    // Only the owner can update
    if (outfit.user_id !== userId) {
      throw new ForbiddenException('You can only update your own outfit');
    }

    Object.assign(outfit, updateOutfitDto);
    const updatedOutfit = await this.outfitRepository.save(outfit);

    const command = new GetObjectCommand({
      Bucket: "outfits-app-bucket",
      Key: updatedOutfit.thumbnail_url,
    });
    updatedOutfit.thumbnail_url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    return plainToInstance(GetOutfitResponseDto, {
      ...updatedOutfit,
      tags: updatedOutfit.tags.map((t) => t.name),
    });

  }

  async remove(id: string, userId: string): Promise<void> {
    const outfit = await this.outfitRepository.findOne({
      where: { id },
      relations: ["tags"],
    });

    // Only the owner can delete
    if (outfit.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own outfits');
    }

    await this.outfitRepository.remove(outfit);
  }





}
