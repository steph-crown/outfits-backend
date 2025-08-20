import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from '../entities/collection.entity';
import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
  ) {}

  async create(
    userId: string,
    createCollectionDto: CreateCollectionDto,
  ): Promise<Collection> {
    // Check if user already has a collection with this name
    const existingCollection = await this.collectionRepository.findOne({
      where: { userId, name: createCollectionDto.name },
    });

    if (existingCollection) {
      throw new ConflictException(
        'You already have a collection with this name',
      );
    }

    const collection = this.collectionRepository.create({
      ...createCollectionDto,
      userId,
    });

    const savedCollection = await this.collectionRepository.save(collection);
    
    // Add outfitsCount for response
    savedCollection.outfitsCount = 0;
    
    return savedCollection;
  }

  async findAll(userId: string): Promise<Collection[]> {
    const collections = await this.collectionRepository
      .createQueryBuilder('collection')
      .where('collection.userId = :userId', { userId })
      .orderBy('collection.createdAt', 'DESC')
      .getMany();

    // Add outfitsCount for each collection (placeholder for now)
    return collections.map((collection) => ({
      ...collection,
      outfitsCount: 0,
    }));
  }

  async findOne(id: string, userId: string): Promise<Collection> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    // Check if user owns this collection or if it's public
    if (collection.userId !== userId && !collection.isPublic) {
      throw new ForbiddenException('Access denied to this collection');
    }

    // Add outfitsCount (placeholder for now)
    collection.outfitsCount = 0;

    return collection;
  }

  async update(
    id: string,
    userId: string,
    updateCollectionDto: UpdateCollectionDto,
  ): Promise<Collection> {
    const collection = await this.findOne(id, userId);

    // Only the owner can update
    if (collection.userId !== userId) {
      throw new ForbiddenException('You can only update your own collections');
    }

    // If updating name, check for conflicts
    if (
      updateCollectionDto.name &&
      updateCollectionDto.name !== collection.name
    ) {
      const existingCollection = await this.collectionRepository.findOne({
        where: { userId, name: updateCollectionDto.name },
      });

      if (existingCollection) {
        throw new ConflictException(
          'You already have a collection with this name',
        );
      }
    }

    Object.assign(collection, updateCollectionDto);
    const updatedCollection = await this.collectionRepository.save(collection);
    
    // Add outfitsCount for response
    updatedCollection.outfitsCount = 0;
    
    return updatedCollection;
  }

  async remove(id: string, userId: string): Promise<void> {
    const collection = await this.findOne(id, userId);

    // Only the owner can delete
    if (collection.userId !== userId) {
      throw new ForbiddenException('You can only delete your own collections');
    }

    await this.collectionRepository.remove(collection);
  }

  async findPublicCollections(limit = 20, offset = 0): Promise<Collection[]> {
    const collections = await this.collectionRepository
      .createQueryBuilder('collection')
      .where('collection.isPublic = :isPublic', { isPublic: true })
      .orderBy('collection.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    // Add outfitsCount for each collection (placeholder for now)
    return collections.map((collection) => ({
      ...collection,
      outfitsCount: 0,
    }));
  }
}
