import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Outfit } from './outfit.entity';

@Entity({ name: "outfit_media" })
export class OutfitMedia {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("uuid")
    outfit_id: string;

    @ManyToOne(() => Outfit, { onDelete: "CASCADE" })
    outfit: Outfit;

    @Column({ type: "varchar" })
    media_name: string;

    @Column({ type: "varchar" })
    media_type: string; // validated in DTO ('image' | 'video')

    @Column({ type: "boolean", default: false })
    is_primary: boolean;

    @Column({ type: "integer", nullable: true })
    order_index: number | null;

    @Column({ type: "integer", nullable: true })
    width: number | null;

    @Column({ type: "integer", nullable: true })
    height: number | null;

    @Column({ type: "bigint", nullable: true })
    file_size: number | null; // bigint as string in JS

    @CreateDateColumn()
    created_at: Date;
}
