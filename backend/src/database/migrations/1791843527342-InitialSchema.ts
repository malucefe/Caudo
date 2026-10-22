import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1791843527342 implements MigrationInterface {
    name = 'InitialSchema1791843527342'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."categories_tipo_enum" AS ENUM('ingreso', 'egreso')`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(100) NOT NULL, "tipo" "public"."categories_tipo_enum" NOT NULL, "icono" character varying(50), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_tipo_enum" AS ENUM('ingreso', 'egreso')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_origen_categoria_enum" AS ENUM('manual', 'automatica')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "tipo" "public"."transactions_tipo_enum" NOT NULL, "monto" numeric(15,2) NOT NULL, "categoria_id" uuid NOT NULL, "origen_categoria" "public"."transactions_origen_categoria_enum" NOT NULL DEFAULT 'manual', "descripcion" character varying(500), "fecha" date NOT NULL, "archivo_url" character varying(500), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_efc1d13ef00d111002b8ed439c" ON "transactions" ("user_id", "fecha") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying NOT NULL, "ingreso_mensual" numeric(15,2), "acepta_politica" boolean NOT NULL DEFAULT false, "fecha_consentimiento" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_2e79580ce1c830068a2a3a3ef9f" FOREIGN KEY ("categoria_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_2e79580ce1c830068a2a3a3ef9f"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_efc1d13ef00d111002b8ed439c"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_origen_categoria_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TYPE "public"."categories_tipo_enum"`);
    }

}
