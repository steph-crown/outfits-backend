import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { User as UserEntity } from '../entities/user.entity';
import { CreateOutfitDto, UpdateOutfitDto } from './dto/outfit.dto';
import { OutfitsService } from './outfits.service';

@UseGuards(JwtAuthGuard)
@Controller('outfits')
export class OutfitsController {
    constructor(private readonly outfitsService: OutfitsService) { }

    @Post()
    async create(
        @Body() createOutfitDto: CreateOutfitDto,
        @User() user: UserEntity,
    ) {
        return this.outfitsService.create(user.id, createOutfitDto);
    }


    @Get()
    async findAll(@User() user: UserEntity) {
        return this.outfitsService.findAll(user.id);
    }


    @Get(':id')
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @User() user: UserEntity,
    ) {
        return this.outfitsService.findOne(id, user.id);
    }


    @Patch(':id')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateOutfitDto: UpdateOutfitDto,
        @User() user: UserEntity,
    ) {
        return this.outfitsService.update(id, user.id, updateOutfitDto);
    }


}
