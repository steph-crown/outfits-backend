import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Tags } from "./tag.entity";
import { User } from './user.entity';

@Entity({ name: "outfits" })
export class Outfit {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("uuid")
    user_id: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    user: User;

    @ManyToMany(() => Tags, (tag) => tag.outfits)
    @JoinTable()  
    tags: Tags[];

    @Column({ type: "varchar", nullable: true })
    source_url: string | null;

    @Column({ type: "varchar" })
    source_type: string; // handled by DTO validation

    @Column({ type: "varchar", nullable: true })
    thumbnail_url: string;

    @Column({ type: "text", nullable: true })
    original_text: string | null;

    @Column({ type: "jsonb", nullable: true })
    ai_tags: Record<string, any> | null;

    @Column("varchar", { array: true, nullable: true })
    colors: string[] | null;

    @Column({ type: "varchar", nullable: true })
    style_category: string | null;

    @Column({ type: "float", nullable: true })
    confidence_score: number | null;

    @Column({ type: "jsonb", nullable: true })
    analysis_data: Record<string, any> | null;

    @Column({ type: "text", nullable: true })
    note: string | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}