import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  AbonoResult, AntExpenses, Budget, CompraCarteraResult, Credit, CreditEvaluation, CreditSummary,
  DashboardData, Goal, NewCredit, Patterns, Recommendation,
} from '../models/finance.model';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private api = inject(ApiService);

  // Dashboard
  dashboard(mes: number, anio: number): Observable<DashboardData> {
    return this.api.get('/dashboard', { mes: String(mes), anio: String(anio) });
  }

  // Presupuestos
  budgets(mes: number, anio: number): Observable<Budget[]> {
    return this.api.get('/budgets', { mes: String(mes), anio: String(anio) });
  }
  setBudget(b: { categoriaId: string; montoLimite: number; mes: number; anio: number }) {
    return this.api.post('/budgets', b);
  }
  deleteBudget(id: string) { return this.api.delete(`/budgets/${id}`); }

  // Metas
  goals(): Observable<Goal[]> { return this.api.get('/goals'); }
  createGoal(g: { nombre: string; montoObjetivo: number; fechaLimite: string }): Observable<Goal> { return this.api.post('/goals', g); }
  contribute(id: string, monto: number): Observable<Goal> { return this.api.post(`/goals/${id}/contributions`, { monto }); }
  deleteGoal(id: string) { return this.api.delete(`/goals/${id}`); }

  // Créditos
  creditSummary(): Observable<CreditSummary> { return this.api.get('/credits/summary'); }
  createCredit(c: NewCredit): Observable<Credit> { return this.api.post('/credits', c); }
  deleteCredit(id: string) { return this.api.delete(`/credits/${id}`); }
  evaluateCredit(b: { monto: number; tasaEA: number; plazoMeses: number }): Observable<CreditEvaluation> {
    return this.api.post('/credits/evaluate', b);
  }
  simulateAbono(id: string, b: { abono: number; modalidad: 'reducir_plazo' | 'reducir_cuota' }): Observable<AbonoResult> {
    return this.api.post(`/credits/${id}/simulate/abono`, b);
  }
  simulateCompraCartera(id: string, b: { tasaEANueva: number; plazoMesesNuevo: number; gastosCierre?: number }): Observable<CompraCarteraResult> {
    return this.api.post(`/credits/${id}/simulate/compra-cartera`, b);
  }

  // Análisis
  patterns(meses = 3): Observable<Patterns> { return this.api.get('/insights/patterns', { meses: String(meses) }); }
  antExpenses(): Observable<AntExpenses> { return this.api.get('/insights/ant-expenses'); }
  recommendations(): Observable<Recommendation[]> { return this.api.get('/insights/recommendations'); }
}
