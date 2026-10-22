import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { Goal } from '../goals/entities/goal.entity';
import { Credit } from '../credits/entities/credit.entity';
import { MonitoringService } from '../monitoring/monitoring.service';
import { AiService } from '../ai/ai.service';

const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 3600 * 1000);

/** Origen (protocolo+host+puerto) de n8n a partir de N8N_BASE_URL o del webhook configurado. */
export function n8nOrigin(baseUrl?: string, webhookUrl?: string): string | null {
  const raw = baseUrl || webhookUrl;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

@Injectable()
export class AdminMetricsService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
    @InjectRepository(Budget) private readonly budgets: Repository<Budget>,
    @InjectRepository(Goal) private readonly goals: Repository<Goal>,
    @InjectRepository(Credit) private readonly credits: Repository<Credit>,
    @InjectDataSource() private readonly ds: DataSource,
    private readonly monitoring: MonitoringService,
    private readonly config: ConfigService,
    private readonly ai: AiService,
  ) {}

  /** Métricas agregadas de uso: ningún dato permite identificar movimientos de una persona. */
  async metrics() {
    const desde30 = daysAgo(30);
    const [total, activos, admins, nuevos30, activos30] = await Promise.all([
      this.users.count(),
      this.users.count({ where: { activo: true } }),
      this.users.count({ where: { rol: UserRole.ADMIN } }),
      this.users.createQueryBuilder('u').where('u.createdAt >= :d', { d: desde30 }).getCount(),
      this.users.createQueryBuilder('u').where('u.ultimoAcceso >= :d', { d: desde30 }).getCount(),
    ]);

    const registros = await this.users
      .createQueryBuilder('u')
      .select("TO_CHAR(DATE_TRUNC('month', u.createdAt), 'YYYY-MM')", 'mes')
      .addSelect('COUNT(*)', 'total')
      .where('u.createdAt >= :d', { d: daysAgo(183) })
      .groupBy('mes')
      .orderBy('mes', 'ASC')
      .getRawMany<{ mes: string; total: string }>();

    const txTotal = await this.transactions.count();
    const tx30 = await this.transactions
      .createQueryBuilder('t')
      .select('t.tipo', 'tipo')
      .addSelect('COUNT(*)', 'cantidad')
      .addSelect('COALESCE(SUM(t.monto), 0)', 'volumen')
      .where('t.createdAt >= :d', { d: desde30 })
      .groupBy('t.tipo')
      .getRawMany<{ tipo: string; cantidad: string; volumen: string }>();

    const top = await this.transactions
      .createQueryBuilder('t')
      .innerJoin('t.category', 'c')
      .select('c.nombre', 'categoria')
      .addSelect('COUNT(*)', 'cantidad')
      .where("t.createdAt >= :d AND t.tipo = 'egreso'", { d: desde30 })
      .groupBy('c.nombre')
      .orderBy('cantidad', 'DESC')
      .limit(5)
      .getRawMany<{ categoria: string; cantidad: string }>();

    const [presupuestos, metas, creditos, errores24h] = await Promise.all([
      this.budgets.count(),
      this.goals.count(),
      this.credits.count(),
      this.monitoring.errorsCountSince(24),
    ]);

    const pick = (tipo: string) => tx30.find((r) => r.tipo === tipo);
    return {
      usuarios: { total, activos, suspendidos: total - activos, administradores: admins, nuevos30d: nuevos30, conAcceso30d: activos30 },
      registrosPorMes: registros.map((r) => ({ mes: r.mes, total: Number(r.total) })),
      transacciones: {
        total: txTotal,
        ultimos30d: {
          ingresos: Number(pick('ingreso')?.cantidad ?? 0),
          egresos: Number(pick('egreso')?.cantidad ?? 0),
          volumenIngresos: Number(pick('ingreso')?.volumen ?? 0),
          volumenEgresos: Number(pick('egreso')?.volumen ?? 0),
        },
      },
      modulos: { presupuestos, metas, creditos },
      topCategoriasEgreso30d: top.map((r) => ({ categoria: r.categoria, cantidad: Number(r.cantidad) })),
      errores24h,
    };
  }

  async system() {
    const inicio = Date.now();
    let db = { ok: false, latenciaMs: 0 };
    try {
      await this.ds.query('SELECT 1');
      db = { ok: true, latenciaMs: Date.now() - inicio };
    } catch {
      db = { ok: false, latenciaMs: Date.now() - inicio };
    }

    const webhookUrl = this.config.get<string>('N8N_RECOMMENDATIONS_WEBHOOK');
    const origin = n8nOrigin(this.config.get<string>('N8N_BASE_URL'), webhookUrl);
    const n8n: { configurado: boolean; host: string | null; alcanzable: boolean | null; latenciaMs: number | null; detalle?: string } = {
      configurado: Boolean(webhookUrl),
      host: origin ? new URL(origin).host : null,
      alcanzable: null,
      latenciaMs: null,
    };
    if (origin) {
      const t0 = Date.now();
      try {
        const res = await fetch(`${origin}/healthz`, { signal: AbortSignal.timeout(3000) });
        n8n.alcanzable = res.ok;
        n8n.latenciaMs = Date.now() - t0;
        if (!res.ok) n8n.detalle = `n8n respondió ${res.status}`;
      } catch (e) {
        n8n.alcanzable = false;
        n8n.detalle = (e as Error).message;
      }
    }

    return {
      api: {
        estado: 'ok',
        entorno: this.config.get<string>('NODE_ENV', 'development'),
        nodeVersion: process.version,
        uptimeSegundos: Math.round(process.uptime()),
        errores24h: await this.monitoring.errorsCountSince(24),
      },
      baseDatos: db,
      n8n,
      ia: { configurada: this.ai.enabled, proveedor: 'Google Gemini', modelo: this.ai.model, categorizacionActiva: this.ai.categorizationEnabled },
      webhooks: await this.monitoring.webhookStats(24),
    };
  }
}
