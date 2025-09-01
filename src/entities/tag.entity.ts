import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Outfit } from "./outfit.entity";
import { User } from './user.entity';

@Entity({ name: "tags" })
@Unique(["user_id", "name"])
export class Tags {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  user_id: string;

  // Tag entity
  @ManyToMany(() => Outfit, (outfit) => outfit.tags)
  outfits: Outfit[];

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @CreateDateColumn()
  created_at: Date;
}
