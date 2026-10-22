import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Budget } from '../../core/models/finance.model';
import { Category } from '../../core/models/category.model';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule, CopCurrencyPipe],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Presupuestos</h1>
        <p>Define un tope mensual por categoría. Te avisamos al llegar al 80 % y al superarlo.</p></div></div>

      <form class="card form-grid" (ngSubmit)="save()" #f="ngForm">
        <label class="field">Categoría
          <select name="cat" [(ngModel)]="categoriaId" required>
            <option value="">Selecciona…</option>
            @for (c of categories(); track c.id) { <option [value]="c.id">{{ c.icono }} {{ c.nombre }}</option> }
          </select></label>
        <label class="field">Tope mensual (COP)
          <input name="monto" type="number" min="1" [(ngModel)]="monto" required /></label>
        <button class="btn" type="submit" [disabled]="f.invalid || saving()">Guardar tope</button>
      </form>

      <div class="stack" style="margin-top:1rem">
        @for (b of budgets(); track b.id) {
          <div class="card">
            <div class="row"><strong>{{ b.icono }} {{ b.categoria }}</strong>
              <span><span class="badge" [ngClass]="b.estado">{{ b.estado === 'ok' ? 'En orden' : b.estado === 'alerta' ? 'Cerca del tope' : 'Excedido' }}</span>
                <button class="btn danger sm" (click)="remove(b)" style="margin-left:.5rem">Eliminar</button></span></div>
            <div class="bar" style="margin:.6rem 0"><span [ngClass]="b.estado" [style.width.%]="b.porcentaje > 100 ? 100 : b.porcentaje"></span></div>
            <div class="row muted"><span>{{ b.consumido | copCurrency }} de {{ b.montoLimite | copCurrency }} ({{ b.porcentaje }}%)</span>
              <span>{{ b.restante >= 0 ? 'Disponible: ' + (b.restante | copCurrency) : 'Excedido por ' + (-b.restante | copCurrency) }}</span></div>
          </div>
        } @empty { <div class="card empty">Aún no defines topes para este mes.</div> }
      </div>
    </div>
  `,
})
export class BudgetsComponent implements OnInit {
  private finance = inject(FinanceService);
  private cats = inject(CategoryService);
  private toast = inject(ToastService);
  budgets = signal<Budget[]>([]);
  categories = signal<Category[]>([]);
  saving = signal(false);
  categoriaId = '';
  monto: number | null = null;
  private now = new Date();

  ngOnInit(): void {
    this.cats.getAll('egreso').subscribe((c) => this.categories.set(c));
    this.load();
  }

  load(): void {
    this.finance.budgets(this.now.getMonth() + 1, this.now.getFullYear()).subscribe({
      next: (b) => this.budgets.set(b),
      error: () => this.toast.error('No se pudieron cargar los presupuestos'),
    });
  }

  save(): void {
    if (!this.categoriaId || !this.monto) return;
    this.saving.set(true);
    this.finance.setBudget({ categoriaId: this.categoriaId, montoLimite: Number(this.monto), mes: this.now.getMonth() + 1, anio: this.now.getFullYear() }).subscribe({
      next: () => { this.toast.success('Tope guardado'); this.monto = null; this.categoriaId = ''; this.saving.set(false); this.load(); },
      error: (e) => { this.saving.set(false); this.toast.error(e.error?.message?.toString() || 'No se pudo guardar'); },
    });
  }

  remove(b: Budget): void {
    this.finance.deleteBudget(b.id).subscribe({ next: () => { this.toast.success('Tope eliminado'); this.load(); }, error: () => this.toast.error('No se pudo eliminar') });
  }
}
