import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Goal } from '../../core/models/finance.model';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule, CopCurrencyPipe],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Metas de ahorro</h1><p>Define cuánto quieres ahorrar, para cuándo, y sigue tu avance.</p></div></div>

      <form class="card form-grid" (ngSubmit)="create()" #f="ngForm">
        <label class="field">Nombre <input name="n" [(ngModel)]="nombre" required minlength="2" maxlength="120" placeholder="Ej: Viaje a Cartagena" /></label>
        <label class="field">Monto objetivo (COP) <input name="m" type="number" min="1" [(ngModel)]="monto" required /></label>
        <label class="field">Fecha límite <input name="d" type="date" [min]="tomorrow" [(ngModel)]="fecha" required /></label>
        <button class="btn" type="submit" [disabled]="f.invalid">Crear meta</button>
      </form>

      <div class="grid cols-2" style="margin-top:1rem">
        @for (g of goals(); track g.id) {
          <div class="card">
            <div class="row"><strong>{{ g.nombre }}</strong><span class="badge" [ngClass]="g.viabilidad">{{ label(g.viabilidad) }}</span></div>
            <div class="bar" style="margin:.7rem 0"><span [style.width.%]="g.porcentaje"></span></div>
            <div class="row muted"><span>{{ g.montoAhorrado | copCurrency }} de {{ g.montoObjetivo | copCurrency }}</span><strong>{{ g.porcentaje }}%</strong></div>
            <p class="muted">{{ g.mensaje }}</p>
            @if (g.estado === 'activa') {
              <div class="muted">Fecha límite: {{ g.fechaLimite }} · Aporte sugerido: {{ g.aporteMensualRequerido | copCurrency }}/mes</div>
              <div class="row" style="margin-top:.7rem">
                <input class="field" style="background:rgba(255,255,255,.05);border:1px solid var(--color-border);border-radius:10px;color:#fff;padding:.5rem;width:140px" type="number" min="1" placeholder="Aporte" [(ngModel)]="aportes[g.id]" />
                <span><button class="btn sm" (click)="contribute(g)" [disabled]="!aportes[g.id]">Aportar</button>
                <button class="btn danger sm" (click)="remove(g)" style="margin-left:.4rem">Eliminar</button></span>
              </div>
            } @else { <button class="btn danger sm" (click)="remove(g)">Eliminar</button> }
          </div>
        } @empty { <div class="card empty">Todavía no tienes metas. ¡Crea la primera!</div> }
      </div>
    </div>
  `,
})
export class GoalsComponent implements OnInit {
  private finance = inject(FinanceService);
  private toast = inject(ToastService);
  goals = signal<Goal[]>([]);
  nombre = ''; monto: number | null = null; fecha = '';
  aportes: Record<string, number | null> = {};
  tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  ngOnInit(): void { this.load(); }
  load(): void { this.finance.goals().subscribe({ next: (g) => this.goals.set(g), error: () => this.toast.error('No se pudieron cargar las metas') }); }

  label(v: Goal['viabilidad']): string {
    return { cumplida: 'Cumplida', alta: 'Vas bien', media: 'Con retraso', baja: 'En riesgo' }[v];
  }

  create(): void {
    this.finance.createGoal({ nombre: this.nombre, montoObjetivo: Number(this.monto), fechaLimite: this.fecha }).subscribe({
      next: () => { this.toast.success('Meta creada'); this.nombre = ''; this.monto = null; this.fecha = ''; this.load(); },
      error: (e) => this.toast.error(e.error?.message?.toString() || 'No se pudo crear la meta'),
    });
  }

  contribute(g: Goal): void {
    const monto = Number(this.aportes[g.id]);
    if (!monto) return;
    this.finance.contribute(g.id, monto).subscribe({
      next: () => { this.toast.success('Aporte registrado'); this.aportes[g.id] = null; this.load(); },
      error: (e) => this.toast.error(e.error?.message?.toString() || 'No se pudo registrar el aporte'),
    });
  }

  remove(g: Goal): void {
    this.finance.deleteGoal(g.id).subscribe({ next: () => { this.toast.success('Meta eliminada'); this.load(); }, error: () => this.toast.error('No se pudo eliminar') });
  }
}
