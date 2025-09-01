import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1756728372557 implements MigrationInterface {
    name = 'InitialMigration1756728372557'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "outfits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "source_url" character varying, "source_type" character varying NOT NULL, "thumbnail_url" character varying, "original_text" text, "ai_tags" jsonb, "colors" character varying array, "style_category" character varying, "confidence_score" double precision, "analysis_data" jsonb, "note" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_f356b7c0267c3b970e469f0401a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "UQ_1d8718578ce96a09d1aa2237a14" UNIQUE ("user_id", "name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "outfit_tags" ("outfit_id" uuid NOT NULL, "tag_id" uuid NOT NULL, "outfitId" uuid, "tagId" uuid, CONSTRAINT "PK_fae07128d5b912afbbc83c5c612" PRIMARY KEY ("outfit_id", "tag_id"))`);
        await queryRunner.query(`CREATE TABLE "outfit_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "outfit_id" uuid NOT NULL, "media_name" character varying NOT NULL, "media_type" character varying NOT NULL, "is_primary" boolean NOT NULL DEFAULT false, "order_index" integer, "width" integer, "height" integer, "file_size" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "outfitId" uuid, CONSTRAINT "PK_140f591aa551cdd74a93d320424" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "outfits_tags_tags" ("outfitsId" uuid NOT NULL, "tagsId" uuid NOT NULL, CONSTRAINT "PK_54b48ea1177e911bd77297286d1" PRIMARY KEY ("outfitsId", "tagsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f5976132b823b8bdbafc82f578" ON "outfits_tags_tags" ("outfitsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_00f67e589ba0c1c2884b925f3c" ON "outfits_tags_tags" ("tagsId") `);
        await queryRunner.query(`ALTER TABLE "outfits" ADD CONSTRAINT "FK_6d25b702984b28263912fabc670" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_92e67dc508c705dd66c94615576" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "outfit_tags" ADD CONSTRAINT "FK_f7e76552bb10c713e17d0bec28d" FOREIGN KEY ("outfitId") REFERENCES "outfits"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "outfit_tags" ADD CONSTRAINT "FK_59a8cd07c18277df7ab8fc23994" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "outfit_media" ADD CONSTRAINT "FK_c80d67a324b6cf1248647744e17" FOREIGN KEY ("outfitId") REFERENCES "outfits"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "outfits_tags_tags" ADD CONSTRAINT "FK_f5976132b823b8bdbafc82f5783" FOREIGN KEY ("outfitsId") REFERENCES "outfits"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "outfits_tags_tags" ADD CONSTRAINT "FK_00f67e589ba0c1c2884b925f3cf" FOREIGN KEY ("tagsId") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "outfits_tags_tags" DROP CONSTRAINT "FK_00f67e589ba0c1c2884b925f3cf"`);
        await queryRunner.query(`ALTER TABLE "outfits_tags_tags" DROP CONSTRAINT "FK_f5976132b823b8bdbafc82f5783"`);
        await queryRunner.query(`ALTER TABLE "outfit_media" DROP CONSTRAINT "FK_c80d67a324b6cf1248647744e17"`);
        await queryRunner.query(`ALTER TABLE "outfit_tags" DROP CONSTRAINT "FK_59a8cd07c18277df7ab8fc23994"`);
        await queryRunner.query(`ALTER TABLE "outfit_tags" DROP CONSTRAINT "FK_f7e76552bb10c713e17d0bec28d"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_92e67dc508c705dd66c94615576"`);
        await queryRunner.query(`ALTER TABLE "outfits" DROP CONSTRAINT "FK_6d25b702984b28263912fabc670"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_00f67e589ba0c1c2884b925f3c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f5976132b823b8bdbafc82f578"`);
        await queryRunner.query(`DROP TABLE "outfits_tags_tags"`);
        await queryRunner.query(`DROP TABLE "outfit_media"`);
        await queryRunner.query(`DROP TABLE "outfit_tags"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP TABLE "outfits"`);
    }

}
