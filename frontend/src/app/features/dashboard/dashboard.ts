import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FinanceService } from '../../core/services/finance.service';
import { DashboardData } from '../../core/models/finance.model';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CopCurrencyPipe],
  template: `
    <div class="page">
      <div class="page-head">
        <div><h1>Balance de {{ nombreMes() }}</h1><p>Resumen de tus ingresos, gastos, metas y deudas.</p></div>
        <div class="form-grid">
          <label class="field">Mes
            <select [(ngModel)]="mes" (change)="load()">
              @for (m of meses; track $index) { <option [ngValue]="$index + 1">{{ m }}</option> }
            </select>
          </label>
          <label class="field">Año <input type="number" [(ngModel)]="anio" (change)="load()" min="2000" max="2100" /></label>
        </div>
      </div>

      @if (loading()) { <p class="muted">Cargando…</p> }
      @else if (error()) { <div class="card empty">{{ error() }} <button class="btn sm" (click)="load()">Reintentar</button></div> }
      @else if (data(); as d) {
        <div class="grid cols-3">
          <div class="card kpi"><div class="label">Ingresos</div><div class="value pos">{{ d.resumen.ingresos | copCurrency }}</div></div>
          <div class="card kpi"><div class="label">Gastos</div><div class="value neg">{{ d.resumen.egresos | copCurrency }}</div></div>
          <div class="card kpi"><div class="label">Balance disponible</div>
            <div class="value" [class.pos]="d.resumen.balance >= 0" [class.neg]="d.resumen.balance < 0">{{ d.resumen.balance | copCurrency }}</div>
            @if (d.resumen.tasaAhorro !== null) { <div class="muted">Ahorro: {{ d.resumen.tasaAhorro }}% de tus ingresos</div> }
          </div>
        </div>

        <div class="grid cols-2" style="margin-top:1rem">
          <div class="card">
            <h2>Ingresos vs. gastos (últimos 6 meses)</h2>
            @if (trend().length) {
              <div class="cols-chart" role="img" aria-label="Gráfico de barras de ingresos y gastos por mes">
                @for (c of trend(); track c.mes) {
                  <div class="col">
                    <div class="pair">
                      <i class="in" [style.height.%]="c.ingreso / trendMax() * 100" [title]="'Ingresos ' + c.ingreso"></i>
                      <i class="out" [style.height.%]="c.egreso / trendMax() * 100" [title]="'Gastos ' + c.egreso"></i>
                    </div><small>{{ c.mes.slice(5) }}/{{ c.mes.slice(2, 4) }}</small>
                  </div>
                }
              </div>
              <div class="legend"><span><i style="background:var(--color-income)"></i>Ingresos</span><span><i style="background:var(--color-expense)"></i>Gastos</span></div>
            } @else { <p class="muted">Aún no hay movimientos para graficar.</p> }
          </div>

          <div class="card">
            <h2>Gastos por categoría</h2>
            @for (c of gastos(); track c.categoria) {
              <div class="stack" style="gap:.2rem;margin-bottom:.7rem">
                <div class="row"><span>{{ c.icono }} {{ c.categoria }}</span><strong>{{ c.total | copCurrency }}</strong></div>
                <div class="bar"><span [style.width.%]="c.pct"></span></div>
              </div>
            } @empty { <p class="muted">Sin gastos registrados este mes.</p> }
          </div>
        </div>

        <div class="grid cols-2" style="margin-top:1rem">
          <div class="card">
            <div class="row"><h2>Alertas de presupuesto</h2><a routerLink="/budgets" class="btn ghost sm">Gestionar</a></div>
            @for (a of d.alertas; track a.id) {
              <div class="stack" style="gap:.2rem;margin-bottom:.7rem">
                <div class="row"><span>{{ a.icono }} {{ a.categoria }}</span><span class="badge" [ngClass]="a.estado">{{ a.porcentaje }}%</span></div>
                <div class="bar"><span [ngClass]="a.estado" [style.width.%]="a.porcentaje > 100 ? 100 : a.porcentaje"></span></div>
                <span class="muted">{{ a.mensaje }}</span>
              </div>
            } @empty { <p class="muted">Sin alertas: tus gastos van dentro de los topes.</p> }
          </div>

          <div class="card">
            <div class="row"><h2>Endeudamiento</h2><a routerLink="/credits" class="btn ghost sm">Ver créditos</a></div>
            @if (d.deuda.cantidad > 0) {
              <div class="row"><span class="muted">Ingreso comprometido en cuotas</span>
                @if (d.deuda.nivel) { <span class="badge" [ngClass]="d.deuda.nivel">{{ d.deuda.porcentajeComprometido }}%</span> }</div>
              <div class="bar" style="margin:.5rem 0"><span [ngClass]="d.deuda.nivel ?? ''" [style.width.%]="d.deuda.porcentajeComprometido > 100 ? 100 : d.deuda.porcentajeComprometido"></span></div>
              <div class="row muted"><span>Cuotas mensuales</span><strong>{{ d.deuda.totalCuotas | copCurrency }}</strong></div>
              <div class="row muted"><span>Saldo total</span><strong>{{ d.deuda.totalSaldo | copCurrency }}</strong></div>
            } @else { <p class="muted">No tienes créditos registrados.</p> }
          </div>
        </div>

        <div class="grid cols-2" style="margin-top:1rem">
          <div class="card">
            <div class="row"><h2>Metas de ahorro</h2><a routerLink="/goals" class="btn ghost sm">Ver metas</a></div>
            @for (g of d.metas; track g.id) {
              <div class="stack" style="gap:.2rem;margin-bottom:.7rem">
                <div class="row"><span>{{ g.nombre }}</span><span class="badge" [ngClass]="g.viabilidad">{{ g.porcentaje }}%</span></div>
                <div class="bar"><span [style.width.%]="g.porcentaje"></span></div>
              </div>
            } @empty { <p class="muted">Crea una meta para empezar a ahorrar con objetivo.</p> }
          </div>
          <div class="card">
            <div class="row"><h2>Recomendaciones</h2><a routerLink="/insights" class="btn ghost sm">Ver más</a></div>
            @for (r of d.recomendaciones; track r.id) {
              <div style="margin-bottom:.7rem"><span class="badge" [ngClass]="r.prioridad">{{ r.prioridad }}</span> <strong>{{ r.titulo }}</strong>
                <div class="muted">{{ r.mensaje }}</div></div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private finance = inject(FinanceService);
  meses = MESES;
  mes = new Date().getMonth() + 1;
  anio = new Date().getFullYear();
  data = signal<DashboardData | null>(null);
  loading = signal(true);
  error = signal('');

  nombreMes = computed(() => `${MESES[this.mes - 1]} ${this.anio}`);

  trend = computed(() => {
    const m = new Map<string, { mes: string; ingreso: number; egreso: number }>();
    for (const t of this.data()?.tendencia ?? []) {
      const e = m.get(t.mes) ?? { mes: t.mes, ingreso: 0, egreso: 0 };
      if (t.tipo === 'ingreso') e.ingreso += Number(t.total); else e.egreso += Number(t.total);
      m.set(t.mes, e);
    }
    return [...m.values()].sort((a, b) => a.mes.localeCompare(b.mes));
  });
  trendMax = computed(() => Math.max(1, ...this.trend().flatMap((t) => [t.ingreso, t.egreso])));

  gastos = computed(() => {
    const rows = (this.data()?.porCategoria ?? []).filter((c) => c.tipo === 'egreso').map((c) => ({ ...c, total: Number(c.total) }));
    const max = Math.max(1, ...rows.map((r) => r.total));
    return rows.map((r) => ({ ...r, pct: (r.total / max) * 100 }));
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.finance.dashboard(this.mes, this.anio).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el resumen.'); this.loading.set(false); },
    });
  }
}
