import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { ErrorLog } from './entities/error-log.entity';
import { WebhookRun } from './entities/webhook-run.entity';

export interface AuditInput {
  actorId?: string | null;
  actorEmail?: string | null;
  accion: string;
  entidad?: string;
  entidadId?: string;
  detalle?: Record<string, unknown>;
}

/**
 * Registro de auditoría, errores de API y ejecuciones de webhooks. Nunca debe
 * romper la operación principal: si escribir el log falla, solo se advierte.
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(AuditLog) private readonly audits: Repository<AuditLog>,
    @InjectRepository(ErrorLog) private readonly errors: Repository<ErrorLog>,
    @InjectRepository(WebhookRun) private readonly webhooks: Repository<WebhookRun>,
  ) {}

  async audit(input: AuditInput): Promise<void> {
    try {
      await this.audits.save(
        this.audits.create({
          actorId: input.actorId ?? null,
          actorEmail: input.actorEmail ?? null,
          accion: input.accion,
          entidad: input.entidad ?? null,
          entidadId: input.entidadId ?? null,
          detalle: input.detalle ?? null,
        }),
      );
    } catch (e) {
      this.logger.warn(`No se pudo registrar auditoría: ${(e as Error).message}`);
    }
  }

  async recordError(e: { statusCode: number; metodo: string; ruta: string; mensaje: string; userId?: string | null }): Promise<void> {
    try {
      await this.errors.save(
        this.errors.create({
          statusCode: e.statusCode,
          metodo: e.metodo.slice(0, 10),
          ruta: e.ruta.slice(0, 300),
          mensaje: e.mensaje.slice(0, 2000),
          userId: e.userId ?? null,
        }),
      );
    } catch (err) {
      this.logger.warn(`No se pudo registrar el error: ${(err as Error).message}`);
    }
  }

  async recordWebhook(run: { flujo: string; exitoso: boolean; duracionMs: number; error?: string | null }): Promise<void> {
    try {
      await this.webhooks.save(
        this.webhooks.create({
          flujo: run.flujo,
          exitoso: run.exitoso,
          duracionMs: Math.round(run.duracionMs),
          error: run.error ? run.error.slice(0, 500) : null,
        }),
      );
    } catch (err) {
      this.logger.warn(`No se pudo registrar el webhook: ${(err as Error).message}`);
    }
  }

  async listAudit(page: number, limit: number, accion?: string) {
    const qb = this.audits.createQueryBuilder('a').orderBy('a.createdAt', 'DESC');
    if (accion) qb.andWhere('a.accion ILIKE :accion', { accion: `%${accion}%` });
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async listErrors(page: number, limit: number) {
    const [data, total] = await this.errors.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async webhookStats(sinceHours = 24) {
    const since = new Date(Date.now() - sinceHours * 3600 * 1000);
    const runs = await this.webhooks
      .createQueryBuilder('w')
      .where('w.createdAt >= :since', { since })
      .orderBy('w.createdAt', 'DESC')
      .getMany();
    const exitosos = runs.filter((r) => r.exitoso).length;
    const promedio = runs.length ? Math.round(runs.reduce((s, r) => s + r.duracionMs, 0) / runs.length) : 0;
    return {
      ventanaHoras: sinceHours,
      total: runs.length,
      exitosos,
      fallidos: runs.length - exitosos,
      duracionPromedioMs: promedio,
      ultimas: runs.slice(0, 10),
    };
  }

  async errorsCountSince(hours: number): Promise<number> {
    return this.errors
      .createQueryBuilder('e')
      .where('e.createdAt >= :s', { s: new Date(Date.now() - hours * 3600 * 1000) })
      .getCount();
  }
}
