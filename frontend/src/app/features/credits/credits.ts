import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { AbonoResult, CompraCarteraResult, Credit, CreditEvaluation, CreditSummary, CreditType } from '../../core/models/finance.model';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';

type Tab = 'mis' | 'evaluar' | 'abono' | 'cartera';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [CommonModule, FormsModule, CopCurrencyPipe],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Créditos</h1>
        <p>Controla tus obligaciones, evalúa un crédito nuevo y simula cómo pagar menos intereses.</p></div></div>

      <div class="tabs" role="tablist">
        <button [class.active]="tab() === 'mis'" (click)="tab.set('mis')">Mis créditos</button>
        <button [class.active]="tab() === 'evaluar'" (click)="tab.set('evaluar')">Evaluar nuevo crédito</button>
        <button [class.active]="tab() === 'abono'" (click)="tab.set('abono')">Abono a capital</button>
        <button [class.active]="tab() === 'cartera'" (click)="tab.set('cartera')">Compra de cartera</button>
      </div>

      @if (tab() === 'mis') {
        @if (summary(); as s) {
          <div class="card">
            @if (s.advertencia) { <p class="muted">⚠ {{ s.advertencia }}</p> }
            <div class="grid cols-3">
              <div class="kpi"><div class="label">Cuotas mensuales</div><div class="value">{{ s.totalCuotas | copCurrency }}</div></div>
              <div class="kpi"><div class="label">Saldo total</div><div class="value">{{ s.totalSaldo | copCurrency }}</div></div>
              <div class="kpi"><div class="label">Ingreso comprometido</div>
                <div class="value">{{ s.nivel ? s.porcentajeComprometido + '%' : '—' }}</div>
                @if (s.nivel) { <span class="badge" [ngClass]="s.nivel">{{ nivelLabel(s.nivel) }}</span> }</div>
            </div>
            @if (s.nivel) {
              <div class="bar" style="margin-top:.8rem"><span [ngClass]="s.nivel" [style.width.%]="s.porcentajeComprometido > 100 ? 100 : s.porcentajeComprometido"></span></div>
              <p class="muted">Referencia: hasta {{ s.umbrales.saludable }}% saludable · hasta {{ s.umbrales.precaucion }}% precaución · más, riesgo. Ingreso base: {{ s.ingresoMensual | copCurrency }} ({{ s.fuenteIngreso === 'perfil' ? 'tomado de tu perfil' : 'ingresos del mes' }}).</p>
            }
          </div>
        }

        @if (summary()?.prioridadAbono; as p) {
          <div class="card" style="margin-top:1rem">
            <h3>¿A cuál deuda abonar primero?</h3>
            <p class="muted" style="margin:.2rem 0 .6rem">{{ p.mensaje }}</p>
            @for (o of p.orden; track o.id) {
              <div class="row"><span>{{ o.posicion }}. {{ o.nombre }}</span><span class="muted">{{ o.tasaEA }}% E.A. · saldo {{ o.saldoActual | copCurrency }}</span></div>
            }
          </div>
        }

        <form class="card form-grid" style="margin-top:1rem" (ngSubmit)="add()" #f="ngForm">
          <label class="field">Nombre <input name="n" [(ngModel)]="nuevo.nombre" required minlength="2" placeholder="Ej: Crédito libre inversión" /></label>
          <label class="field">Entidad <input name="e" [(ngModel)]="nuevo.entidad" placeholder="Banco / cooperativa" /></label>
          <label class="field">Tipo
            <select name="t" [(ngModel)]="nuevo.tipo">
              @for (t of tipos; track t.v) { <option [value]="t.v">{{ t.l }}</option> }
            </select></label>
          <label class="field">Monto original <input name="mo" type="number" min="1" [(ngModel)]="nuevo.montoOriginal" required /></label>
          <label class="field">Saldo actual <input name="sa" type="number" min="0" [(ngModel)]="nuevo.saldoActual" required /></label>
          <label class="field">Tasa E.A. (%) <input name="ta" type="number" min="0" max="100" step="0.01" [(ngModel)]="nuevo.tasaEA" required /></label>
          <label class="field">Cuota mensual <input name="cm" type="number" min="1" [(ngModel)]="nuevo.cuotaMensual" required /></label>
          <label class="field">Cuotas restantes <input name="cr" type="number" min="1" max="600" [(ngModel)]="nuevo.cuotasRestantes" required /></label>
          <button class="btn" type="submit" [disabled]="f.invalid">Registrar crédito</button>
        </form>

        <div class="stack" style="margin-top:1rem">
          @for (c of summary()?.creditos ?? []; track c.id) {
            <div class="card row">
              <div><strong>{{ c.nombre }}</strong> <span class="muted">{{ c.entidad }}</span>
                <div class="muted">Saldo {{ c.saldoActual | copCurrency }} · Cuota {{ c.cuotaMensual | copCurrency }} · {{ c.cuotasRestantes }} cuotas · {{ c.tasaEA }}% E.A.</div></div>
              <button class="btn danger sm" (click)="remove(c)">Eliminar</button>
            </div>
          } @empty { <div class="card empty">No tienes créditos activos registrados.</div> }
        </div>
      }

      @if (tab() === 'evaluar') {
        <form class="card form-grid" (ngSubmit)="evaluate()" #fe="ngForm">
          <label class="field">Monto a solicitar <input name="m" type="number" min="1" [(ngModel)]="ev.monto" required /></label>
          <label class="field">Tasa E.A. (%) <input name="t" type="number" min="0" max="100" step="0.01" [(ngModel)]="ev.tasaEA" required /></label>
          <label class="field">Plazo (meses) <input name="p" type="number" min="1" max="600" [(ngModel)]="ev.plazoMeses" required /></label>
          <button class="btn" type="submit" [disabled]="fe.invalid">Evaluar</button>
        </form>
        @if (evaluation(); as r) {
          <div class="card result">
            <div class="row"><h3>Resultado</h3><span class="badge" [ngClass]="r.veredicto">{{ veredictoLabel(r.veredicto) }}</span></div>
            <dl>
              <dt>Cuota estimada</dt><dd>{{ r.cuotaNueva | copCurrency }}</dd>
              <dt>Total a pagar</dt><dd>{{ r.totalPagar | copCurrency }}</dd>
              <dt>Intereses totales</dt><dd>{{ r.totalIntereses | copCurrency }}</dd>
              <dt>Ingreso comprometido hoy → con el crédito</dt><dd>{{ r.porcentajeActual }}% → {{ r.porcentajeNuevo }}%</dd>
              <dt>Cuota máxima que mantiene el nivel saludable</dt><dd>{{ r.cuotaMaximaSaludable | copCurrency }}</dd>
              <dt>Monto máximo sugerido (misma tasa y plazo)</dt><dd>{{ r.montoMaximoSugerido | copCurrency }}</dd>
            </dl>
          </div>
        }
      }

      @if (tab() === 'abono') {
        @if (!activos().length) { <div class="card empty">Registra un crédito para simular un abono.</div> } @else {
          <form class="card form-grid" (ngSubmit)="simAbono()" #fa="ngForm">
            <label class="field">Crédito
              <select name="c" [(ngModel)]="selId" required>@for (c of activos(); track c.id) { <option [value]="c.id">{{ c.nombre }}</option> }</select></label>
            <label class="field">Valor del abono <input name="a" type="number" min="1" [(ngModel)]="abono.abono" required /></label>
            <label class="field">Quiero
              <select name="m" [(ngModel)]="abono.modalidad"><option value="reducir_plazo">Reducir el plazo</option><option value="reducir_cuota">Reducir la cuota</option></select></label>
            <button class="btn" type="submit" [disabled]="fa.invalid">Simular</button>
          </form>
          @if (abonoRes(); as r) {
            <div class="card result">
              <h3>{{ r.liquidaElCredito ? 'El abono liquida el crédito' : 'Efecto del abono' }}</h3>
              <dl>
                <dt>Saldo después del abono</dt><dd>{{ r.saldoNuevo | copCurrency }}</dd>
                <dt>Cuota</dt><dd>{{ r.cuotaActual | copCurrency }} → {{ r.cuotaNueva | copCurrency }}</dd>
                <dt>Cuotas restantes</dt><dd>{{ r.cuotasActuales }} → {{ r.cuotasNuevas }}</dd>
                <dt>Intereses sin abono → con abono</dt><dd>{{ r.interesesSinAbono | copCurrency }} → {{ r.interesesConAbono | copCurrency }}</dd>
                <dt>Ahorro en intereses</dt><dd style="color:var(--color-income)">{{ r.ahorroIntereses | copCurrency }}</dd>
              </dl>
              @if (r.comparacion; as c) {
                <div class="card" style="margin-top:.8rem">
                  <h3>Comparación de modalidades</h3>
                  <dl>
                    <dt>Reducir el plazo</dt><dd>{{ c.reducirPlazo.cuotasActuales }} → {{ c.reducirPlazo.cuotasNuevas }} cuotas · ahorro {{ c.reducirPlazo.ahorroIntereses | copCurrency }}</dd>
                    <dt>Reducir la cuota</dt><dd>cuota {{ c.reducirCuota.cuotaNueva | copCurrency }} · ahorro {{ c.reducirCuota.ahorroIntereses | copCurrency }}</dd>
                  </dl>
                  <p style="margin-top:.6rem">{{ c.mensaje }}</p>
                </div>
              }
              <p class="muted">Simulación informativa. Al pagar anticipadamente, la ley colombiana te permite elegir si el abono reduce el plazo o la cuota; confirma las condiciones con tu entidad.</p>
            </div>
          }
        }
      }

      @if (tab() === 'cartera') {
        @if (!activos().length) { <div class="card empty">Registra un crédito para simular una compra de cartera.</div> } @else {
          <form class="card form-grid" (ngSubmit)="simCartera()" #fc="ngForm">
            <label class="field">Crédito a trasladar
              <select name="c" [(ngModel)]="selId" required>@for (c of activos(); track c.id) { <option [value]="c.id">{{ c.nombre }}</option> }</select></label>
            <label class="field">Nueva tasa E.A. (%) <input name="t" type="number" min="0" max="100" step="0.01" [(ngModel)]="cartera.tasaEANueva" required /></label>
            <label class="field">Nuevo plazo (meses) <input name="p" type="number" min="1" max="600" [(ngModel)]="cartera.plazoMesesNuevo" required /></label>
            <label class="field">Gastos de la operación <input name="g" type="number" min="0" [(ngModel)]="cartera.gastosCierre" /></label>
            <button class="btn" type="submit" [disabled]="fc.invalid">Simular</button>
          </form>
          @if (carteraRes(); as r) {
            <div class="card result">
              <div class="row"><h3>Comparación</h3><span class="badge" [ngClass]="r.conviene ? 'ok' : 'excedido'">{{ r.conviene ? 'Conviene' : 'No conviene' }}</span></div>
              <dl>
                <dt>Lo que pagarías si sigues como estás</dt><dd>{{ r.totalRestanteActual | copCurrency }}</dd>
                <dt>Lo que pagarías con el nuevo crédito</dt><dd>{{ r.totalNuevoCredito | copCurrency }}</dd>
                <dt>Ahorro total</dt><dd [style.color]="r.ahorroTotal > 0 ? 'var(--color-income)' : 'var(--color-expense)'">{{ r.ahorroTotal | copCurrency }}</dd>
                <dt>Nueva cuota (cambio frente a la actual)</dt><dd>{{ r.cuotaNueva | copCurrency }} ({{ r.ahorroCuotaMensual >= 0 ? '−' : '+' }}{{ (r.ahorroCuotaMensual < 0 ? -r.ahorroCuotaMensual : r.ahorroCuotaMensual) | copCurrency }})</dd>
              </dl>
              @if (r.analisis) { <p style="margin-top:.8rem">{{ r.analisis.mensaje }}</p> }
              @if (r.plazoNuevoMayor) { <p class="muted">⚠ El nuevo plazo es mayor que el actual ({{ r.cuotasRestantesActual }} cuotas): la cuota baja pero pagarás durante más tiempo.</p> }
            </div>
          }
        }
      }
    </div>
  `,
})
export class CreditsComponent implements OnInit {
  private finance = inject(FinanceService);
  private toast = inject(ToastService);

  tab = signal<Tab>('mis');
  summary = signal<CreditSummary | null>(null);
  evaluation = signal<CreditEvaluation | null>(null);
  abonoRes = signal<AbonoResult | null>(null);
  carteraRes = signal<CompraCarteraResult | null>(null);

  tipos: { v: CreditType; l: string }[] = [
    { v: 'libre_inversion', l: 'Libre inversión' }, { v: 'hipotecario', l: 'Hipotecario' }, { v: 'vehiculo', l: 'Vehículo' },
    { v: 'tarjeta', l: 'Tarjeta de crédito' }, { v: 'educativo', l: 'Educativo' }, { v: 'otro', l: 'Otro' },
  ];
  nuevo = { nombre: '', entidad: '', tipo: 'libre_inversion' as CreditType, montoOriginal: null as number | null, saldoActual: null as number | null, tasaEA: null as number | null, cuotaMensual: null as number | null, cuotasRestantes: null as number | null };
  ev = { monto: null as number | null, tasaEA: null as number | null, plazoMeses: null as number | null };
  abono = { abono: null as number | null, modalidad: 'reducir_plazo' as 'reducir_plazo' | 'reducir_cuota' };
  cartera = { tasaEANueva: null as number | null, plazoMesesNuevo: null as number | null, gastosCierre: 0 as number | null };
  selId = '';

  activos = () => this.summary()?.creditos ?? [];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.finance.creditSummary().subscribe({
      next: (s) => { this.summary.set(s); if (!this.selId && s.creditos.length) this.selId = s.creditos[0].id; },
      error: () => this.toast.error('No se pudieron cargar los créditos'),
    });
  }

  nivelLabel(n: string) { return ({ saludable: 'Saludable', precaucion: 'Precaución', riesgo: 'Riesgo' } as Record<string, string>)[n]; }
  veredictoLabel(v: string) { return ({ viable: 'Viable', precaucion: 'Con precaución', no_recomendable: 'No recomendable' } as Record<string, string>)[v]; }

  private err(e: any, fallback: string) { this.toast.error(e.error?.message?.toString() || fallback); }

  add(): void {
    const n = this.nuevo;
    this.finance.createCredit({
      nombre: n.nombre, entidad: n.entidad || undefined, tipo: n.tipo, montoOriginal: Number(n.montoOriginal), saldoActual: Number(n.saldoActual),
      tasaEA: Number(n.tasaEA), cuotaMensual: Number(n.cuotaMensual), cuotasRestantes: Number(n.cuotasRestantes),
    } as any).subscribe({
      next: () => { this.toast.success('Crédito registrado'); this.nuevo = { ...this.nuevo, nombre: '', entidad: '', montoOriginal: null, saldoActual: null, tasaEA: null, cuotaMensual: null, cuotasRestantes: null }; this.load(); },
      error: (e) => this.err(e, 'No se pudo registrar el crédito'),
    });
  }

  remove(c: Credit): void {
    this.finance.deleteCredit(c.id).subscribe({ next: () => { this.toast.success('Crédito eliminado'); this.load(); }, error: (e) => this.err(e, 'No se pudo eliminar') });
  }

  evaluate(): void {
    this.finance.evaluateCredit({ monto: Number(this.ev.monto), tasaEA: Number(this.ev.tasaEA), plazoMeses: Number(this.ev.plazoMeses) }).subscribe({
      next: (r) => this.evaluation.set(r), error: (e) => this.err(e, 'No se pudo evaluar'),
    });
  }

  simAbono(): void {
    this.finance.simulateAbono(this.selId, { abono: Number(this.abono.abono), modalidad: this.abono.modalidad }).subscribe({
      next: (r) => this.abonoRes.set(r), error: (e) => this.err(e, 'No se pudo simular'),
    });
  }

  simCartera(): void {
    this.finance.simulateCompraCartera(this.selId, { tasaEANueva: Number(this.cartera.tasaEANueva), plazoMesesNuevo: Number(this.cartera.plazoMesesNuevo), gastosCierre: Number(this.cartera.gastosCierre) || 0 }).subscribe({
      next: (r) => this.carteraRes.set(r), error: (e) => this.err(e, 'No se pudo simular'),
    });
  }
}
