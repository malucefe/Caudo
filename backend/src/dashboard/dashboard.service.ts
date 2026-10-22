import { Injectable } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { BudgetsService } from '../budgets/budgets.service';
import { GoalsService } from '../goals/goals.service';
import { CreditsService } from '../credits/credits.service';
import { InsightsService } from '../insights/insights.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly transactions: TransactionsService,
    private readonly budgets: BudgetsService,
    private readonly goals: GoalsService,
    private readonly credits: CreditsService,
    private readonly insights: InsightsService,
  ) {}

  /** Vista consolidada del mes (HU-14): balance, gráficos, alertas, metas, deuda y recomendaciones. */
  async get(userId: string, mes: number, anio: number) {
    const [resumen, tendencia, alertas, metas, deuda, recomendaciones] = await Promise.all([
      this.transactions.getSummary(userId, mes, anio),
      this.transactions.getMonthlyTrend(userId, 6),
      this.budgets.alerts(userId, mes, anio),
      this.goals.findAll(userId),
      this.credits.summary(userId),
      this.insights.recommendations(userId),
    ]);
    const tasaAhorro = resumen.ingresos > 0 ? Math.round(((resumen.ingresos - resumen.egresos) / resumen.ingresos) * 10000) / 100 : null;
    return {
      mes, anio,
      resumen: { ingresos: resumen.ingresos, egresos: resumen.egresos, balance: resumen.balance, tasaAhorro },
      porCategoria: resumen.porCategoria,
      tendencia,
      alertas,
      metas: metas.filter((m) => m.estado === 'activa').slice(0, 4),
      deuda: { totalCuotas: deuda.totalCuotas, totalSaldo: deuda.totalSaldo, porcentajeComprometido: deuda.porcentajeComprometido, nivel: deuda.nivel, cantidad: deuda.creditos.length },
      recomendaciones: recomendaciones.slice(0, 3),
    };
  }
}
