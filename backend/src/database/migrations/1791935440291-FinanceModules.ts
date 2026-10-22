import { MigrationInterface, QueryRunner } from "typeorm";

export class FinanceModules1791935440291 implements MigrationInterface {
    name = 'FinanceModules1791935440291'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "goal_contributions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "goal_id" uuid NOT NULL, "monto" numeric(15,2) NOT NULL, "fecha" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_33413874ace4630a4451a4f4bda" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."goals_estado_enum" AS ENUM('activa', 'cumplida')`);
        await queryRunner.query(`CREATE TABLE "goals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "nombre" character varying(120) NOT NULL, "monto_objetivo" numeric(15,2) NOT NULL, "monto_ahorrado" numeric(15,2) NOT NULL DEFAULT '0', "fecha_limite" date NOT NULL, "estado" "public"."goals_estado_enum" NOT NULL DEFAULT 'activa', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_26e17b251afab35580dff769223" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."credits_tipo_enum" AS ENUM('libre_inversion', 'hipotecario', 'vehiculo', 'tarjeta', 'educativo', 'otro')`);
        await queryRunner.query(`CREATE TYPE "public"."credits_estado_enum" AS ENUM('activo', 'pagado')`);
        await queryRunner.query(`CREATE TABLE "credits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "nombre" character varying(120) NOT NULL, "entidad" character varying(120), "tipo" "public"."credits_tipo_enum" NOT NULL DEFAULT 'otro', "monto_original" numeric(15,2) NOT NULL, "saldo_actual" numeric(15,2) NOT NULL, "tasa_ea" numeric(6,2) NOT NULL, "cuota_mensual" numeric(15,2) NOT NULL, "cuotas_restantes" integer NOT NULL, "estado" "public"."credits_estado_enum" NOT NULL DEFAULT 'activo', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_45cea097fd0ee625d2e840ed99c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "budgets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "categoria_id" uuid NOT NULL, "monto_limite" numeric(15,2) NOT NULL, "mes" smallint NOT NULL, "anio" smallint NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e976e6c22e1cc376e8015bb18fc" UNIQUE ("user_id", "categoria_id", "mes", "anio"), CONSTRAINT "PK_9c8a51748f82387644b773da482" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "goal_contributions" ADD CONSTRAINT "FK_a3486f892fb14eceb63fd37d492" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "goals" ADD CONSTRAINT "FK_88b78010581f2d293699d064441" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credits" ADD CONSTRAINT "FK_47411fd61355a96b8e4d7aabb56" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "budgets" ADD CONSTRAINT "FK_5d25d8bbd6c209261dfe04558f1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "budgets" ADD CONSTRAINT "FK_505d5707562d557145de9abc41d" FOREIGN KEY ("categoria_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budgets" DROP CONSTRAINT "FK_505d5707562d557145de9abc41d"`);
        await queryRunner.query(`ALTER TABLE "budgets" DROP CONSTRAINT "FK_5d25d8bbd6c209261dfe04558f1"`);
        await queryRunner.query(`ALTER TABLE "credits" DROP CONSTRAINT "FK_47411fd61355a96b8e4d7aabb56"`);
        await queryRunner.query(`ALTER TABLE "goals" DROP CONSTRAINT "FK_88b78010581f2d293699d064441"`);
        await queryRunner.query(`ALTER TABLE "goal_contributions" DROP CONSTRAINT "FK_a3486f892fb14eceb63fd37d492"`);
        await queryRunner.query(`DROP TABLE "budgets"`);
        await queryRunner.query(`DROP TABLE "credits"`);
        await queryRunner.query(`DROP TYPE "public"."credits_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."credits_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "goals"`);
        await queryRunner.query(`DROP TYPE "public"."goals_estado_enum"`);
        await queryRunner.query(`DROP TABLE "goal_contributions"`);
    }

}
