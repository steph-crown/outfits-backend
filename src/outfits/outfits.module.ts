import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Outfit } from 'src/entities/outfit.entity';
import { OutfitMedia } from 'src/entities/outfit_media.entity';
import { OutfitTag } from 'src/entities/outfit_tags.entity';
import { Tags } from 'src/entities/tag.entity';
import { User } from 'src/entities/user.entity';
import { FileModule } from 'src/file/file.module';
import { OutfitsController } from './outfits.controller';
import { OutfitsService } from './outfits.service';

@Module({
  imports: [TypeOrmModule.forFeature([Outfit, OutfitTag, OutfitMedia, Tags, User]), AuthModule, FileModule],
  providers: [OutfitsService],
  controllers: [OutfitsController]
})
export class OutfitsModule {}
