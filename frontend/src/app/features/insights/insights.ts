import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../core/services/finance.service';
import { AntExpenses, Patterns, Recommendation } from '../../core/models/finance.model';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, CopCurrencyPipe],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Análisis y recomendaciones</h1>
        <p>Hábitos de gasto, gastos hormiga y sugerencias basadas en tu historial.</p></div></div>

      <div class="card">
        <h2>Recomendaciones</h2>
        @for (r of recos(); track r.id) {
          <div style="margin-bottom:.8rem"><span class="badge" [ngClass]="r.prioridad">{{ r.prioridad }}</span> <strong>{{ r.titulo }}</strong>
            <div class="muted">{{ r.mensaje }}</div></div>
        } @empty { <p class="muted">Cargando…</p> }
      </div>

      <div class="grid cols-2" style="margin-top:1rem">
        <div class="card">
          <h2>Gastos hormiga (últimos 30 días)</h2>
          @if (ant(); as a) {
            @if (a.items.length) {
              <p class="muted">Consumos de hasta {{ a.umbral | copCurrency }} repetidos {{ a.minOcurrencias }}+ veces. Total: <strong>{{ a.totalMensual | copCurrency }}</strong> · al año: <strong>{{ a.proyeccionAnual | copCurrency }}</strong></p>
              @for (i of a.items; track i.concepto) {
                <div class="row" style="margin-bottom:.4rem"><span>{{ i.concepto }} <span class="muted">({{ i.ocurrencias }} veces)</span></span><strong>{{ i.total | copCurrency }}</strong></div>
              }
            } @else { <p class="muted">No detectamos gastos hormiga. ¡Bien!</p> }
          }
        </div>

        <div class="card">
          <h2>Patrones de gasto (últimos {{ p()?.periodoMeses ?? 3 }} meses)</h2>
          @if (p(); as p) {
            <p class="muted">Gasto total {{ p.totalGasto | copCurrency }} · promedio diario {{ p.promedioDiario | copCurrency }}
              @if (p.diaMayorGasto) { · día de mayor gasto: <strong>{{ p.diaMayorGasto.dia }}</strong> }</p>
            @for (c of p.topCategorias.slice(0, 5); track c.categoria) {
              <div class="stack" style="gap:.2rem;margin-bottom:.6rem">
                <div class="row"><span>{{ c.categoria }}</span><span>{{ c.porcentaje }}%</span></div>
                <div class="bar"><span [style.width.%]="c.porcentaje"></span></div>
              </div>
            }
            @if (p.mayoresAumentos.length) {
              <h3 style="margin-top:1rem">Subieron frente al mes anterior</h3>
              @for (a of p.mayoresAumentos; track a.categoria) { <div class="row muted"><span>{{ a.categoria }}</span><span>+{{ a.variacionPct }}%</span></div> }
            }
            @if (p.recurrentes.length) {
              <h3 style="margin-top:1rem">Gastos recurrentes</h3>
              @for (r of p.recurrentes; track r.concepto) { <div class="row muted"><span>{{ r.concepto }}</span><span>{{ r.ocurrencias }} veces · ~{{ r.promedio | copCurrency }}</span></div> }
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class InsightsComponent implements OnInit {
  private finance = inject(FinanceService);
  recos = signal<Recommendation[]>([]);
  ant = signal<AntExpenses | null>(null);
  p = signal<Patterns | null>(null);

  ngOnInit(): void {
    this.finance.recommendations().subscribe({ next: (r) => this.recos.set(r), error: () => this.recos.set([]) });
    this.finance.antExpenses().subscribe({ next: (a) => this.ant.set(a) });
    this.finance.patterns(3).subscribe({ next: (p) => this.p.set(p) });
  }
}
