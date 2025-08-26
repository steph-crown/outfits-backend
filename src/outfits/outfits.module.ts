import { Module } from '@nestjs/common';
import { OutfitsService } from './outfits.service';
import { OutfitsController } from './outfits.controller';

@Module({
  providers: [OutfitsService],
  controllers: [OutfitsController]
})
export class OutfitsModule {}
