import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1755695851810 implements MigrationInterface {
    name = 'CreateUserTable1755695851810'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "username" character varying(50) NOT NULL, "first_name" character varying(100), "last_name" character varying(100), "profile_image_url" character varying(500), "is_admin" boolean NOT NULL DEFAULT false, "email_verified" boolean NOT NULL DEFAULT false, "last_login_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }

}