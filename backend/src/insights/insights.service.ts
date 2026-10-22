import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MonitoringService } from '../monitoring/monitoring.service';
import { AiService } from '../ai/ai.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import { BudgetsService } from '../budgets/budgets.service';
import { GoalsService } from '../goals/goals.service';
import { CreditsService } from '../credits/credits.service';
import { addMonths, currentMonth, monthRange, toIsoDate } from '../common/utils/date.util';
import {
  AntExpensesReport, buildRecommendations, computePatterns, detectAntExpenses,
  Patterns, Recommendation, TxLite, UMBRAL_HORMIGA_DEFAULT,
} from './insights-logic';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
    private readonly budgets: BudgetsService,
    private readonly goals: GoalsService,
    private readonly credits: CreditsService,
    private readonly config: ConfigService,
    private readonly monitoring: MonitoringService,
    private readonly ai: AiService,
  ) {}

  private async loadEgresos(userId: string, desde: string, hasta: string): Promise<TxLite[]> {
    const rows = await this.transactions
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'c')
      .where('t.userId = :userId', { userId })
      .andWhere('t.tipo = :tipo', { tipo: TransactionType.EGRESO })
      .andWhere('t.fecha BETWEEN :desde AND :hasta', { desde, hasta })
      .getMany();
    return rows.map((r) => ({
      fecha: String(r.fecha).slice(0, 10),
      monto: Number(r.monto),
      descripcion: r.descripcion,
      categoria: r.category?.nombre ?? 'Sin categoría',
    }));
  }

  async patterns(userId: string, meses = 3, now = new Date()): Promise<Patterns> {
    const desde = toIsoDate(new Date(now.getFullYear(), now.getMonth() - (meses - 1), 1));
    const egresos = await this.loadEgresos(userId, desde, toIsoDate(now));
    return computePatterns(egresos, now, meses);
  }

  async antExpenses(userId: string, umbral = UMBRAL_HORMIGA_DEFAULT, now = new Date()): Promise<AntExpensesReport> {
    const desde = toIsoDate(addMonths(now, -1));
    const egresos = await this.loadEgresos(userId, desde, toIsoDate(now));
    return detectAntExpenses(egresos, umbral);
  }

  private async monthTotals(userId: string, mes: number, anio: number) {
    const { start, end } = monthRange(mes, anio);
    const rows = await this.transactions
      .createQueryBuilder('t')
      .select('t.tipo', 'tipo')
      .addSelect('SUM(t.monto)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.fecha BETWEEN :start AND :end', { start, end })
      .groupBy('t.tipo')
      .getRawMany();
    const get = (tipo: string) => Number(rows.find((r) => r.tipo === tipo)?.total ?? 0);
    return { ingresos: get('ingreso'), egresos: get('egreso') };
  }

  /** Recomendaciones basadas en reglas (HU-13). */
  async recommendations(userId: string, now = new Date()): Promise<Recommendation[]> {
    const { mes, anio } = currentMonth(now);
    const [totals, alerts, goals, credit, hormiga, patterns] = await Promise.all([
      this.monthTotals(userId, mes, anio),
      this.budgets.alerts(userId, mes, anio),
      this.goals.findAll(userId),
      this.credits.summary(userId),
      this.antExpenses(userId, UMBRAL_HORMIGA_DEFAULT, now),
      this.patterns(userId, 2, now),
    ]);

    const base = buildRecommendations({
      ingresos: totals.ingresos,
      egresos: totals.egresos,
      hormiga,
      presupuestosExcedidos: alerts.filter((a) => a.estado === 'excedido').map((a) => ({ categoria: a.categoria ?? '', porcentaje: a.porcentaje })),
      presupuestosEnAlerta: alerts.filter((a) => a.estado === 'alerta').map((a) => ({ categoria: a.categoria ?? '', porcentaje: a.porcentaje })),
      credito: { porcentaje: credit.porcentajeComprometido, nivel: credit.nivel },
      metasEnRiesgo: goals.filter((g) => g.viabilidad === 'baja').map((g) => ({ nombre: g.nombre, aporteMensualRequerido: g.aporteMensualRequerido })),
      mayoresAumentos: patterns.mayoresAumentos,
    });
    return this.enhanceWording(base);
  }

  /**
   * Redacción opcional vía n8n. Solo se envían los textos de las recomendaciones
   * ya calculadas (sin identificadores del usuario ni transacciones); si el
   * flujo no responde o devuelve algo inesperado se usa el texto original.
   */
  private async enhanceWording(recos: Recommendation[]): Promise<Recommendation[]> {
    // 1) IA generativa (Gemini): solo redacta; las cifras se validan contra el texto original.
    const rewritten = await this.ai.rewriteRecommendations(recos);
    if (rewritten) return recos.map((r) => (rewritten.has(r.id) ? { ...r, mensaje: rewritten.get(r.id) as string } : r));

    // 2) Plan B: flujo opcional de n8n; 3) texto base de las reglas.
    const url = this.config.get<string>('N8N_RECOMMENDATIONS_WEBHOOK');
    if (!url) return recos;
    const inicio = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recomendaciones: recos.map(({ id, prioridad, titulo, mensaje }) => ({ id, prioridad, titulo, mensaje })) }),
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error(`n8n respondió ${res.status}`);
      const data = (await res.json()) as { recomendaciones?: { id: string; mensaje: string }[] };
      void this.monitoring.recordWebhook({ flujo: 'recomendaciones', exitoso: true, duracionMs: Date.now() - inicio });
      const byId = new Map((data.recomendaciones ?? []).map((r) => [r.id, r.mensaje]));
      return recos.map((r) => {
        const m = byId.get(r.id);
        return typeof m === 'string' && m.trim() && m.length <= 600 ? { ...r, mensaje: m.trim() } : r;
      });
    } catch (e) {
      void this.monitoring.recordWebhook({ flujo: 'recomendaciones', exitoso: false, duracionMs: Date.now() - inicio, error: (e as Error).message });
      this.logger.warn(`Redacción con n8n no disponible: ${(e as Error).message}`);
      return recos;
    }
  }
}
