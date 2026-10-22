import { MigrationInterface, QueryRunner } from "typeorm";

export class AdminRolesMonitoring1792033521037 implements MigrationInterface {
    name = 'AdminRolesMonitoring1792033521037'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "webhook_runs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "flujo" character varying(60) NOT NULL, "exitoso" boolean NOT NULL, "duracion_ms" integer NOT NULL, "error" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_23e8c35cdeb9a83d32cadfa715a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_864ddfc02279164aef583342c6" ON "webhook_runs" ("created_at") `);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actor_id" uuid, "actor_email" character varying(255), "accion" character varying(60) NOT NULL, "entidad" character varying(60), "entidad_id" character varying(60), "detalle" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_84c3f6da56a20988410f70042f" ON "audit_logs" ("accion") `);
        await queryRunner.query(`CREATE INDEX "IDX_2cd10fda8276bb995288acfbfb" ON "audit_logs" ("created_at") `);
        await queryRunner.query(`CREATE TABLE "error_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status_code" integer NOT NULL, "metodo" character varying(10) NOT NULL, "ruta" character varying(300) NOT NULL, "mensaje" text NOT NULL, "user_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6840885d7eb78406fa7d358be72" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ec6dd47926703713d920561c00" ON "error_logs" ("created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."users_rol_enum" AS ENUM('usuario', 'admin')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "rol" "public"."users_rol_enum" NOT NULL DEFAULT 'usuario'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "activo" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" ADD "ultimo_acceso" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "ultimo_acceso"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "activo"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "rol"`);
        await queryRunner.query(`DROP TYPE "public"."users_rol_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ec6dd47926703713d920561c00"`);
        await queryRunner.query(`DROP TABLE "error_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2cd10fda8276bb995288acfbfb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_84c3f6da56a20988410f70042f"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_864ddfc02279164aef583342c6"`);
        await queryRunner.query(`DROP TABLE "webhook_runs"`);
    }

}
