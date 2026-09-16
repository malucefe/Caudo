import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Filter, Trash2, ArrowLeftRight, Calendar, Tag, X } from 'lucide-angular';
import { SkeletonCardComponent } from '../../../shared/components/skeleton/skeleton-card';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { TransactionService } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Transaction, PaginatedResponse } from '../../../core/models/transaction.model';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, SkeletonCardComponent, CopCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="transactions-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Transacciones</h1>
          <p class="page-subtitle">Historial de tus movimientos financieros</p>
        </div>
        <a routerLink="/transactions/new" class="btn-new">
          <lucide-angular [img]="Plus" size="18"></lucide-angular>
          Nueva
        </a>
      </div>

      @if (loading()) {
        <div class="transactions-list">
          @for (i of [1,2,3,4,5]; track i) { <app-skeleton-card [showHeader]="false" /> }
        </div>
      } @else if (error()) {
        <div class="empty-state">
          <lucide-angular [img]="ArrowLeftRight" size="48"></lucide-angular>
          <h3>Error al cargar</h3>
          <p>{{ error() }}</p>
          <button class="btn-new" (click)="loadTransactions()">
            <lucide-angular [img]="Plus" size="18"></lucide-angular>
            Reintentar
          </button>
        </div>
      } @else {
        <div class="filters-bar">
          <div class="filter-group">
            <lucide-angular [img]="Filter" size="16"></lucide-angular>
            <select [(ngModel)]="filterType" (change)="applyFilters()" class="filter-select">
              <option value="">Todos los tipos</option>
              <option value="ingreso">Ingresos</option>
              <option value="egreso">Egresos</option>
            </select>
          </div>
          <div class="filter-group">
            <lucide-angular [img]="Tag" size="16"></lucide-angular>
            <select [(ngModel)]="filterCategoryId" (change)="applyFilters()" class="filter-select">
              <option value="">Todas las categorías</option>
              @for (c of categories(); track c.id) {
                <option [value]="c.id">{{ c.nombre }}</option>
              }
            </select>
          </div>
          <div class="filter-group">
            <lucide-angular [img]="Calendar" size="16"></lucide-angular>
            <input type="date" [(ngModel)]="filterStartDate" (change)="applyFilters()" class="filter-date" title="Desde" aria-label="Fecha inicial" />
            <span class="date-sep">→</span>
            <input type="date" [(ngModel)]="filterEndDate" (change)="applyFilters()" class="filter-date" title="Hasta" aria-label="Fecha final" />
          </div>
          @if (hasActiveFilters()) {
            <button type="button" class="btn-clear" (click)="clearFilters()">
              <lucide-angular [img]="X" size="16"></lucide-angular>
              Limpiar
            </button>
          }
        </div>

        <div class="transactions-list">
          @for (t of transactions(); track t.id) {
            <div class="transaction-item animate-fade-in-up">
              <div class="t-icon" [class.ingreso]="t.tipo === 'ingreso'">
                @if (t.tipo === 'ingreso') {
                  <lucide-angular [img]="ArrowLeftRight" size="20"></lucide-angular>
                } @else {
                  <lucide-angular [img]="ArrowLeftRight" size="20"></lucide-angular>
                }
              </div>
              <div class="t-info">
                <span class="t-category">
                  <lucide-angular [img]="Tag" size="14"></lucide-angular>
                  {{ t.category?.nombre || 'Sin categoría' }}
                </span>
                <span class="t-desc">{{ t.descripcion || '-' }}</span>
                <span class="t-date">
                  <lucide-angular [img]="Calendar" size="12"></lucide-angular>
                  {{ t.fecha | date:'dd MMM yyyy' }}
                </span>
              </div>
              <div class="t-actions">
                <span class="t-amount" [class.positive]="t.tipo === 'ingreso'">
                  @if (t.tipo === 'ingreso') {
                    <lucide-angular [img]="ArrowLeftRight" size="14"></lucide-angular>
                  }
                  {{ t.monto | copCurrency }}
                </span>
                <button class="btn-delete" (click)="deleteTransaction(t.id)" title="Eliminar">
                  <lucide-angular [img]="Trash2" size="16"></lucide-angular>
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <lucide-angular [img]="ArrowLeftRight" size="48"></lucide-angular>
              <h3>No hay transacciones</h3>
              <p>Registra tu primera transacción para empezar</p>
              <a routerLink="/transactions/new" class="btn-new">
                <lucide-angular [img]="Plus" size="18"></lucide-angular>
                Crear transacción
              </a>
            </div>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="pagination">
            <button [disabled]="page() === 1" (click)="changePage(page() - 1)">Anterior</button>
            <span>Página {{ page() }} de {{ totalPages() }}</span>
            <button [disabled]="page() >= totalPages()" (click)="changePage(page() + 1)">Siguiente</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .transactions-page {
      min-height: 100vh;
      background: #0a0e1a;
      padding: 2rem;
      color: white;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      animation: fadeInUp 0.4s ease-out;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .page-subtitle {
      color: rgba(255,255,255,0.4);
      margin: 0.25rem 0 0;
      font-size: 0.95rem;
    }
    .btn-new {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #10B981, #059669);
      color: white;
      padding: 0.7rem 1.25rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }
    .btn-new:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
    }
    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      animation: fadeInUp 0.4s ease-out 0.1s both;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255,255,255,0.03);
      padding: 0.5rem 1rem;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.06);
      width: fit-content;
      color: rgba(255,255,255,0.5);
    }
    .filter-select {
      background: transparent;
      border: none;
      color: white;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .filter-select option { background: #0a0e1a; }
    .filter-date {
      background: transparent;
      border: none;
      color: white;
      font-size: 0.9rem;
      cursor: pointer;
      color-scheme: dark;
    }
    .date-sep { color: rgba(255,255,255,0.3); font-size: 0.85rem; }
    .btn-clear {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
      color: rgba(239,68,68,0.8);
      padding: 0.5rem 1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-clear:hover {
      background: rgba(239,68,68,0.15);
      color: #ef4444;
    }
    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .transaction-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: rgba(255,255,255,0.02);
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.04);
      transition: all 0.3s;
    }
    .transaction-item:hover {
      background: rgba(255,255,255,0.04);
      border-color: rgba(255,255,255,0.08);
      transform: translateX(4px);
    }
    .t-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      flex-shrink: 0;
    }
    .t-icon.ingreso {
      background: rgba(16, 185, 129, 0.1);
      color: #10B981;
    }
    .t-info { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
    .t-category {
      font-weight: 600;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: rgba(255,255,255,0.8);
    }
    .t-desc { color: rgba(255,255,255,0.4); font-size: 0.85rem; }
    .t-date {
      color: rgba(255,255,255,0.3);
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .t-actions { display: flex; align-items: center; gap: 1rem; }
    .t-amount {
      font-weight: 700;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      color: #ef4444;
    }
    .t-amount.positive { color: #10B981; }
    .btn-delete {
      background: transparent;
      border: 1px solid rgba(239,68,68,0.15);
      color: rgba(239,68,68,0.5);
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-delete:hover {
      background: rgba(239,68,68,0.1);
      border-color: rgba(239,68,68,0.3);
      color: #ef4444;
    }
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: rgba(255,255,255,0.3);
    }
    .empty-state h3 { margin: 1rem 0 0.5rem; color: rgba(255,255,255,0.5); }
    .empty-state p { margin: 0 0 1.5rem; }
    .empty-state .btn-new { margin: 0 auto; width: fit-content; }
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .pagination button {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      color: white;
      padding: 0.6rem 1.25rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    .pagination button:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
    .pagination button:disabled { opacity: 0.3; cursor: not-allowed; }
    .pagination span { color: rgba(255,255,255,0.5); font-size: 0.9rem; }
    @media (max-width: 768px) {
      .transactions-page { padding: 1rem; }
      .page-header { flex-direction: column; gap: 0.75rem; align-items: stretch; }
      .btn-new { justify-content: center; text-align: center; }
      .transaction-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem;
      }
      .t-actions {
        width: 100%;
        justify-content: space-between;
        align-items: center;
      }
      .t-icon { width: 38px; height: 38px; }
    }
    @media (max-width: 400px) {
      .transactions-page { padding: 0.75rem; }
      .page-title { font-size: 1.35rem; }
      .page-subtitle { font-size: 0.85rem; }
      .filter-group { width: 100%; }
      .filter-select { flex: 1; }
      .transaction-item { padding: 0.85rem; gap: 0.6rem; }
      .t-icon { width: 34px; height: 34px; border-radius: 10px; }
      .t-amount { font-size: 1rem; }
      .t-actions { gap: 0.5rem; }
      .pagination button { padding: 0.5rem 0.75rem; font-size: 0.8rem; }
      .pagination { gap: 0.5rem; }
    }
  `]
})
export class TransactionListComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);

  Plus = Plus;
  Filter = Filter;
  Trash2 = Trash2;
  ArrowLeftRight = ArrowLeftRight;
  Calendar = Calendar;
  Tag = Tag;
  X = X;

  loading = signal(true);
  error = signal<string | null>(null);
  transactions = signal<Transaction[]>([]);
  categories = signal<Category[]>([]);
  page = signal(1);
  totalPages = signal(1);
  filterType = '';
  filterStartDate = '';
  filterEndDate = '';
  filterCategoryId = '';

  ngOnInit(): void {
    this.loadCategories();
    this.loadTransactions();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.categories.set([]),
    });
  }

  loadTransactions(): void {
    const params: Record<string, string> = {
      page: String(this.page()),
      limit: '20'
    };
    if (this.filterType) params['type'] = this.filterType;
    if (this.filterStartDate) params['startDate'] = this.filterStartDate;
    if (this.filterEndDate) params['endDate'] = this.filterEndDate;
    if (this.filterCategoryId) params['categoryId'] = this.filterCategoryId;

    this.error.set(null);
    this.loading.set(true);
    this.transactionService.getAll(params).subscribe({
      next: (res) => {
        this.transactions.set(res.data);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al cargar las transacciones. Intenta de nuevo.');
        this.toast.error(this.error()!);
      }
    });
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadTransactions();
  }

  hasActiveFilters(): boolean {
    return !!(this.filterType || this.filterStartDate || this.filterEndDate || this.filterCategoryId);
  }

  clearFilters(): void {
    this.filterType = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filterCategoryId = '';
    this.applyFilters();
  }

  changePage(newPage: number): void {
    this.page.set(newPage);
    this.loadTransactions();
  }

  deleteTransaction(id: string): void {
    this.transactionService.delete(id).subscribe({
      next: () => {
        this.toast.success('Transacción eliminada');
        this.loadTransactions();
      }
    });
  }
}
