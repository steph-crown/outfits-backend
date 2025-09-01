import { Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Outfit } from './outfit.entity';
import { Tags } from './tag.entity';

@Entity({ name: "outfit_tags" })
export class OutfitTag {
  @PrimaryColumn("uuid")
  outfit_id: string;

  @PrimaryColumn("uuid")
  tag_id: string;

  @ManyToOne(() => Outfit, { onDelete: "CASCADE" })
  outfit: Outfit;

  @ManyToOne(() => Tags, { onDelete: "CASCADE" })
  tag: Tags;
}
