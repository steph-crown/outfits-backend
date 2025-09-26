import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1757836483915 implements MigrationInterface {
    name = 'InitialMigration1757836483915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outfit_media" RENAME COLUMN "media_name" TO "media_url"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outfit_media" RENAME COLUMN "media_url" TO "media_name"`);
    }

}
